import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

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

const upsertChat = async (chat) => {
  const { data, error } = await supabase
    .from('whatsapp_chats')
    .upsert(chat, { onConflict: 'id' });
  if (error) console.error('Erro ao salvar chat:', error);
  return data;
};

// --- FUNÇÃO CORRIGIDA ---
const saveMessage = async (msg) => {
  // Trocado .insert() por .upsert() para evitar erros de chave duplicada
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .upsert(msg, { onConflict: 'id' });
  if (error) console.error('Erro ao salvar mensagem:', error);
  return data;
};

// ... (O restante do arquivo continua o mesmo)
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
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
      const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      connectionStatus = 'Desconectado';
      console.log('Conexão fechada devido a ', lastDisconnect.error, ', reconectando... ', shouldReconnect);
      io.emit('status', { status: connectionStatus });
      if (shouldReconnect) {
        connectToWhatsApp();
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
    for (const msg of m.messages) {
      if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

      const chatId = msg.key.remoteJid;
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
    if (sock && sock.user) {
        res.json({ status: 'Conectado', user: sock.user });
    } else if (qrCodeData) {
        res.json({ status: 'Aguardando QR Code', qr: qrCodeData });
    } else {
        res.json({ status: 'Desconectado' });
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
app.post('/notify/order-update', async (req, res) => {
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
  connectToWhatsApp();
});