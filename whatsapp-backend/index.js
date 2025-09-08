import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';

dotenv.config();

// --- Configuração do Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Key are required. Make sure you have a .env file in the whatsapp-backend directory.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = process.env.PORT || 3001;

let sock;
let qrCodeData;
let connectionStatus = 'Desconectado';
const authFolder = 'auth_info_baileys';

// --- Funções Auxiliares do Supabase ---
const upsertChat = async (chat) => {
  const { data, error } = await supabase
    .from('whatsapp_chats')
    .upsert(chat, { onConflict: 'id' });
  if (error) console.error('Erro ao salvar chat:', error);
  return data;
};

const saveMessage = async (msg) => {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .upsert(msg, { onConflict: 'id' });
  if (error) console.error('Erro ao salvar mensagem:', error);
  return data;
};

// --- Função para Enviar Notificações de Pedido ---
async function sendOrderStatusUpdate(orderId) {
  if (!sock || connectionStatus !== 'Conectado') {
    console.log('WhatsApp não conectado. Notificação de pedido ignorada.');
    return;
  }

  const { data: settings, error: settingsError } = await supabase
    .from('whatsapp_settings')
    .select('send_order_updates')
    .eq('id', 1)
    .single();

  if (settingsError || !settings || !settings.send_order_updates) {
    console.log('Envio de atualização de status desativado. Notificação ignorada.');
    return;
  }
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, profiles(full_name, phone)')
    .eq('id', orderId)
    .single();

  if (orderError || !order || !order.profiles?.phone) {
    console.log(`Pedido #${orderId} ou telefone do cliente não encontrado. Notificação ignorada.`);
    return;
  }

  const { profiles: customer, status } = order;
  const message = `Olá, ${customer.full_name}! O status do seu pedido #${orderId} foi atualizado para: *${status}*.`;
  const number = customer.phone.replace(/\D/g, '');
  const jid = `${number}@s.whatsapp.net`;
  
  await sock.sendMessage(jid, { text: message });
  console.log(`Notificação do pedido #${orderId} enviada para ${number}`);
}

// --- Lógica Principal do Baileys ---
async function connectToWhatsApp() {
  if (sock || connectionStatus === 'Conectando...') {
    console.log('Conexão já em andamento ou estabelecida.');
    return;
  }

  connectionStatus = 'Conectando...';
  io.emit('status', { status: connectionStatus });

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  
  sock = makeWASocket({
    auth: state,
    browser: ["Sabor Digital", "Chrome", "1.0.0"],
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCodeData = qr;
      connectionStatus = 'Aguardando leitura do QR Code';
      console.log('QR Code recebido, escaneie com seu celular:');
      qrcode.generate(qr, { small: true });
      io.emit('qr', qr);
      io.emit('status', { status: connectionStatus });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect.error)?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) {
        connectionStatus = 'Desconectado (Logout)';
        console.log('Desconectado pelo usuário. A apagar sessão...');
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
        // Não reconecta automaticamente, espera um novo comando do usuário
        sock = null; 
        io.emit('status', { status: 'Desconectado' });
        
      } else {
        connectionStatus = 'Desconectado';
        console.log('Conexão perdida. A tentar reconectar...');
        io.emit('status', { status: connectionStatus });
        setTimeout(connectToWhatsApp, 5000); // Tenta reconectar se não for logout
      }
    } else if (connection === 'open') {
      connectionStatus = 'Conectado';
      console.log('Conexão com o WhatsApp aberta!', sock.user);
      io.emit('status', { status: connectionStatus, user: sock.user });
      qrCodeData = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('process_group_messages')
      .eq('id', 1)
      .single();

    for (const msg of m.messages) {
      if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

      const chatId = msg.key.remoteJid;
      const isGroup = chatId.endsWith('@g.us');

      if (isGroup && !settings?.process_group_messages) {
        console.log(`Mensagem de grupo (${chatId}) ignorada conforme configuração.`);
        continue;
      }

      const senderId = msg.key.fromMe ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : msg.key.participant || msg.key.remoteJid;
      const messageTimestamp = new Date(Number(msg.messageTimestamp) * 1000);

      await upsertChat({ id: chatId, name: msg.pushName || chatId.split('@')[0], last_message_timestamp: messageTimestamp });

      let message_body = '';
      const messageType = Object.keys(msg.message)[0];
      if (messageType === 'conversation') { message_body = msg.message.conversation; } 
      else if (messageType === 'extendedTextMessage') { message_body = msg.message.extendedTextMessage.text; }

      if (message_body) {
        await saveMessage({ id: msg.key.id, chat_id: chatId, sender_id: senderId, message_type: messageType, message_body: message_body, sent_by_us: msg.key.fromMe, "timestamp": messageTimestamp });
        console.log(`Mensagem de ${senderId} em ${chatId}: ${message_body}`);
      }
    }
  });
}

// Rota para status
app.get('/status', (req, res) => {
    res.json({ status: connectionStatus, user: sock?.user });
});

// Rota para conectar
app.post('/connect', (req, res) => {
  console.log('Recebida solicitação para conectar...');
  connectToWhatsApp();
  res.status(200).json({ message: 'Processo de conexão iniciado.' });
});

// Rota para desconectar
app.post('/disconnect', async (req, res) => {
  console.log('Recebida solicitação para desconectar...');
  if (sock) {
    await sock.logout();
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    sock = null;
    connectionStatus = 'Desconectado';
    qrCodeData = null;
    io.emit('status', { status: connectionStatus });
    res.status(200).json({ message: 'Desconectado com sucesso.' });
  } else {
    res.status(400).json({ message: 'Nenhuma conexão ativa para desconectar.' });
  }
});

// Rota para enviar mensagens manuais
app.post('/send-message', async (req, res) => {
  const { number, message } = req.body;
  if (!sock || connectionStatus !== 'Conectado') {
    return res.status(500).json({ error: 'WhatsApp não está conectado.' });
  }
  if (!number || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
  }

  try {
    const jid = `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Falha ao enviar mensagem.' });
  }
});

// Rota para notificações de pedido
app.post('/notify/order-update', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId é obrigatório.' });
  }
  sendOrderStatusUpdate(orderId).catch(err => console.error(`Falha ao processar notificação para pedido ${orderId}:`, err));
  res.status(202).json({ message: 'Solicitação de notificação recebida.' });
});

io.on('connection', (socket) => {
  console.log('Frontend conectado via Socket.IO');
  
  socket.emit('status', { status: connectionStatus, user: sock?.user });
  if (qrCodeData) {
    socket.emit('qr', qrCodeData);
  }

  socket.on('get-status', () => {
    socket.emit('status', { status: connectionStatus, user: sock?.user });
    if (qrCodeData) {
      socket.emit('qr', qrCodeData);
    }
  });
});

server.listen(port, () => {
  console.log(`Servidor do WhatsApp rodando na porta ${port}`);
});