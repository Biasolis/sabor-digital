import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import P from 'pino';
import fileUpload from 'express-fileupload';

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
app.use(fileUpload());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = process.env.PORT || 3001;

let sock;
let qrCodeData;
let connectionStatus = 'Desconectado';
const authFolder = 'auth_info_baileys';
const logger = P({ level: 'silent' });

// --- Funções Auxiliares do Supabase ---
const upsertChat = async (chat) => {
  const chatData = { ...chat, status: 'open' };
  const { data, error } = await supabase
    .from('whatsapp_chats')
    .upsert(chatData, { onConflict: 'id' });
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
    .select('status, contacts(full_name, phone)')
    .eq('id', orderId)
    .single();

  if (orderError || !order || !order.contacts?.phone) {
    console.log(`Pedido #${orderId} ou telefone do cliente não encontrado. Notificação ignorada.`);
    return;
  }

  const { contacts: customer, status } = order;
  const message = `Olá, ${customer.full_name}! O status do seu pedido #${orderId} foi atualizado para: *${status}*.`;
  const number = customer.phone.replace(/\D/g, '');
  const jid = `${number}@s.whatsapp.net`;
  
  await sock.sendMessage(jid, { text: message });
  console.log(`Notificação do pedido #${orderId} enviada para ${number}`);
}

// --- Lógica Principal do Baileys ---
async function connectToWhatsApp() {
  if (sock) {
    console.log('Já existe uma conexão. Fechando a antiga...');
    try {
      await sock.logout();
    } catch (error) {
      console.error('Erro ao desconectar a sessão antiga:', error);
    } finally {
      sock = undefined;
    }
  }
  
  connectionStatus = 'Conectando...';
  io.emit('status', { status: connectionStatus });
  
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`A usar Baileys v${version.join('.')}, é a mais recente: ${isLatest}`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ["Sabor Digital", "Chrome", "1.0.0"],
    logger,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCodeData = qr;
      connectionStatus = 'Aguardando leitura do QR Code';
      console.log('QR Code recebido, escaneie com seu celular.');
      io.emit('qr', qr);
      io.emit('status', { status: connectionStatus });
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      
      if (reason === DisconnectReason.loggedOut) {
        console.log('Desconectado pelo usuário. A apagar sessão...');
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
        connectionStatus = 'Desconectado';
        io.emit('status', { status: connectionStatus });
        sock = undefined;
      } else {
        console.log('Conexão perdida. Motivo:', reason, '. Tentando reconectar...');
        connectionStatus = 'Reconectando...';
        io.emit('status', { status: connectionStatus });
        setTimeout(connectToWhatsApp, 10000);
      }
    } else if (connection === 'open') {
      connectionStatus = 'Conectado';
      console.log('Conexão com o WhatsApp aberta!', sock.user);
      io.emit('status', { status: connectionStatus, user: sock.user });
      qrCodeData = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('chats.upsert', async (chats) => {
    for (const chat of chats) {
      if (chat.id && !chat.id.endsWith('@g.us')) {
        try {
          const picUrl = await sock.profilePictureUrl(chat.id, 'image');
          await supabase.from('whatsapp_chats').upsert({ id: chat.id, profile_picture_url: picUrl }, { onConflict: 'id' });
        } catch (e) {
            // Silencia o erro
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    for (const msg of m.messages) {
      const chatId = msg.key.remoteJid;
      
      if (!msg.message || !chatId || chatId === 'status@broadcast' || chatId.endsWith('@newsletter')) {
        continue;
      }

      const { data: settings } = await supabase.from('whatsapp_settings').select('process_group_messages').eq('id', 1).single();
      const isGroup = chatId.endsWith('@g.us');
      if (isGroup && !settings?.process_group_messages) {
        continue;
      }

      // LÓGICA DO CHATBOT REFATORADA
      if (!msg.key.fromMe && !isGroup) {
          try {
              const chatbotUrl = process.env.CHATBOT_BACKEND_URL || 'http://localhost:3002';
              const response = await fetch(`${chatbotUrl}/process-message`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      chatId: msg.key.remoteJid,
                      messageBody: msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
                  })
              });
              const { replies } = await response.json();

              if (replies && replies.length > 0) {
                  for (const reply of replies) {
                      await sock.sendMessage(chatId, { text: reply.content });
                  }
                  // Impede que a mensagem do utilizador seja guardada se o bot respondeu
                  continue; 
              }
          } catch (e) {
              console.error("Erro ao comunicar com o backend do chatbot:", e.message);
          }
      }

      // Lógica de salvar contato e mensagem
      if (!msg.key.fromMe && !isGroup) {
        const phoneNumber = chatId.split('@')[0];
        const { data: existingContact } = await supabase.from('contacts').select('id').eq('phone', phoneNumber).maybeSingle();
        if (!existingContact) {
          await supabase.from('contacts').insert({ phone: phoneNumber, full_name: msg.pushName || phoneNumber });
        }
      }

      const senderId = msg.key.fromMe ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : msg.key.participant || msg.key.remoteJid;
      const messageTimestamp = new Date(Number(msg.messageTimestamp) * 1000);
      await upsertChat({ id: chatId, name: msg.pushName || chatId.split('@')[0], last_message_timestamp: messageTimestamp, status: 'open' });
      
      const messageType = getContentType(msg.message);
      let message_body = '';
      let media_url = null;
      let media_mime_type = null;

      if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
        message_body = msg.message.conversation || msg.message.extendedTextMessage.text;
      } else if (['imageMessage', 'videoMessage', 'audioMessage'].includes(messageType)) {
        try {
          const stream = await downloadMediaMessage(msg, 'buffer', {}, { logger });
          media_mime_type = msg.message[messageType].mimetype;
          const fileExtension = media_mime_type.split('/')[1].split(';')[0];
          const fileName = `${msg.key.id}.${fileExtension}`;
          
          await supabase.storage.from('whatsapp-media').upload(fileName, stream, { contentType: media_mime_type });
          
          const { data: publicUrlData } = supabase.storage.from('whatsapp-media').getPublicUrl(fileName);
          media_url = publicUrlData.publicUrl;
          message_body = msg.message[messageType].caption || '';

        } catch (e) {
          console.error('Erro ao descarregar e guardar a mídia:', e);
        }
      }

      if (message_body || media_url) {
        await saveMessage({ 
          id: msg.key.id, 
          chat_id: chatId, 
          sender_id: senderId, 
          message_type: messageType, 
          message_body, 
          sent_by_us: msg.key.fromMe, 
          "timestamp": messageTimestamp,
          media_url,
          media_mime_type
        });
      }
    }
  });
}

// --- ROTAS DA API ---

const isAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Token inválido.' });
        if (user.user_metadata?.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso não autorizado.' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

app.get('/messages/:chatId', isAdmin, async (req, res) => {
    const { chatId } = req.params;
    try {
        const { data, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('timestamp', { ascending: true });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/archive-chat', isAdmin, async (req, res) => {
    const { chatId, status } = req.body;
    if (!chatId || !status) return res.status(400).json({ error: 'chatId e status são obrigatórios.' });
    try {
        const { data, error } = await supabase.from('whatsapp_chats').update({ status: status }).eq('id', chatId);
        if (error) throw error;
        res.status(200).json({ success: true, message: 'Chat atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/contacts', isAdmin, async (req, res) => {
    const contactData = req.body;
    if (!contactData || !contactData.phone) return res.status(400).json({ error: 'Dados do contato são inválidos.' });
    try {
        const { data, error } = await supabase
            .from('contacts')
            .upsert(contactData, { onConflict: 'phone' })
            .select()
            .single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/status', (req, res) => res.json({ status: connectionStatus, user: sock?.user }));
app.post('/connect', (req, res) => { connectToWhatsApp(); res.status(200).json({ message: 'A iniciar conexão...' }); });
app.post('/disconnect', async (req, res) => {
    if (sock) await sock.logout();
    if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
    sock = null;
    connectionStatus = 'Desconectado';
    res.status(200).json({ message: 'Desconectado com sucesso.' });
});
app.post('/send-message', isAdmin, async (req, res) => {
  const { number, message } = req.body;
  if (!sock || connectionStatus !== 'Conectado') return res.status(500).json({ error: 'WhatsApp não está conectado.' });
  if (!number || !message) return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
  try {
    const jid = `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) { res.status(500).json({ error: 'Falha ao enviar mensagem.' }); }
});
app.post('/send-media', isAdmin, async (req, res) => {
    if (!sock || connectionStatus !== 'Conectado') return res.status(500).json({ error: 'WhatsApp não está conectado.' });
    if (!req.files || !req.body.number) return res.status(400).json({ error: 'Ficheiro e número são obrigatórios.' });
    const { number, caption } = req.body;
    const file = req.files.file;
    const jid = `${number}@s.whatsapp.net`;
    try {
        let messageOptions = { caption: caption || '' };
        if (file.mimetype.startsWith('image/')) messageOptions.image = file.data;
        else if (file.mimetype.startsWith('video/')) messageOptions.video = file.data;
        else if (file.mimetype.startsWith('audio/')) { messageOptions.audio = file.data; messageOptions.mimetype = file.mimetype; }
        else return res.status(400).json({ error: 'Tipo de ficheiro não suportado.' });
        await sock.sendMessage(jid, messageOptions);
        res.status(200).json({ success: true, message: 'Mídia enviada com sucesso!' });
    } catch (e) { res.status(500).json({ error: 'Falha ao enviar mídia.' }); }
});
app.post('/update-profile-picture', isAdmin, async (req, res) => {
    if (!sock) return res.status(500).json({ error: 'WhatsApp não conectado.' });
    if (!req.files) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    try {
        await sock.updateProfilePicture(sock.user.id, req.files.picture.data);
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/update-profile-status', isAdmin, async (req, res) => {
    if (!sock) return res.status(500).json({ error: 'WhatsApp não conectado.' });
    try {
        await sock.updateProfileStatus(req.body.status);
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/update-profile-name', isAdmin, async (req, res) => {
    if (!sock) return res.status(500).json({ error: 'WhatsApp não conectado.' });
    try {
        await sock.updateProfileName(req.body.name);
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/notify/order-update', isAdmin, (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório.' });
  sendOrderStatusUpdate(orderId).catch(err => console.error(`Falha ao processar notificação para pedido ${orderId}:`, err));
  res.status(202).json({ message: 'Solicitação de notificação recebida.' });
});
app.post('/update-store-status', isAdmin, async (req, res) => {
  try {
    const { is_open } = req.body;
    const updateData = { id: 1, is_open };
    if (is_open) updateData.last_opened_at = new Date().toISOString();
    const { data, error } = await supabase.from('store_settings').upsert(updateData).select().single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

io.on('connection', (socket) => {
  console.log('Frontend conectado via Socket.IO');
  socket.emit('status', { status: connectionStatus, user: sock?.user });
  if (qrCodeData) socket.emit('qr', qrCodeData);
});

server.listen(port, () => {
  console.log(`Servidor do WhatsApp rodando na porta ${port}`);
});