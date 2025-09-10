import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

const MediaMessage = ({ message }) => {
  if (!message.media_url || !message.media_mime_type) return null;
  if (message.media_mime_type.startsWith('image/')) return <img src={message.media_url} alt={message.message_body || 'Imagem'} style={{ maxWidth: '300px', borderRadius: '0.75rem', marginTop: '0.5rem' }} />;
  if (message.media_mime_type.startsWith('video/')) return <video src={message.media_url} controls style={{ maxWidth: '300px', borderRadius: '0.75rem', marginTop: '0.5rem' }} />;
  if (message.media_mime_type.startsWith('audio/')) return <audio src={message.media_url} controls style={{ marginTop: '0.5rem' }} />;
  return null;
};

const MessageView = ({ chat, onToggleContactInfo }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!chat?.id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão não encontrada. Por favor, faça login novamente.");

        const response = await fetch(`${backendUrl}/messages/${chat.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Falha ao buscar mensagens.');
        }

        const data = await response.json();
        setMessages(data || []);
      } catch (error) {
        console.error("Erro ao buscar mensagens via backend:", error);
        alert(error.message);
      }
    };

    fetchMessages();
  }, [chat]);

  useEffect(() => {
    if (!chat?.id) return;

    const channel = supabase.channel(`whatsapp_messages_${chat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `chat_id=eq.${chat.id}`
      }, 
        (payload) => {
          setMessages(currentMessages => {
            const filtered = currentMessages.filter(msg => !msg.id.startsWith('temp_'));
            if (filtered.find(msg => msg.id === payload.new.id)) {
              return filtered;
            }
            return [...filtered, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat || sending) return;

    setSending(true);
    const number = chat.id.split('@')[0];
    const originalMessage = newMessage;
    setNewMessage('');
    
    const optimisticMessage = {
        id: `temp_${Date.now()}`,
        chat_id: chat.id,
        sent_by_us: true,
        message_body: originalMessage,
        timestamp: new Date().toISOString(),
        media_url: null,
        media_mime_type: null
    };
    setMessages(current => [...current, optimisticMessage]);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Utilizador não autenticado.");

        const response = await fetch(`${backendUrl}/send-message`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ number, message: originalMessage }),
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao enviar a mensagem.');
      }
      
    } catch (error) {
      console.error(error);
      alert(error.message);
      setMessages(current => current.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  if (!chat) {
    return <div className="message-view-pane placeholder"><p>Selecione uma conversa para começar</p></div>;
  }

  return (
    <main className="message-view-pane">
      <header className="message-view-header">
        <h5>{chat.display_name || chat.name}</h5>
        {!chat.id.includes('@g.us') && (
            <button className="btn-contact-info" onClick={onToggleContactInfo}>
                Info
            </button>
        )}
      </header>
      <div className="message-list">
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.sent_by_us ? 'sent' : 'received'}`}>
            {msg.message_body && <p>{msg.message_body}</p>}
            <MediaMessage message={msg} />
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          placeholder="Digite uma mensagem..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending}>
          {sending ? 'A Enviar...' : 'Enviar'}
        </button>
      </form>
    </main>
  );
};

export default MessageView;