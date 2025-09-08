import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const MessageView = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!chat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('timestamp', { ascending: true });

      if (error) console.error("Erro ao buscar mensagens:", error);
      else setMessages(data);
    };

    fetchMessages();
  }, [chat]);

  useEffect(() => {
    if (!chat) return;

    const channel = supabase.channel(`whatsapp_messages_${chat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `chat_id=eq.${chat.id}`
      }, (payload) => {
        setMessages(currentMessages => {
          if (currentMessages.find(msg => msg.id === payload.new.id)) {
            return currentMessages;
          }
          return [...currentMessages, payload.new];
        });
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBE_FAILED') {
          console.error(`Falha ao se inscrever no canal de mensagens para ${chat.id}: `, err);
        }
      });

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
    
    try {
      const response = await fetch('http://localhost:3001/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, message: newMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao enviar a mensagem.');
      }
      
      setNewMessage('');

    } catch (error) {
      console.error(error);
      alert(error.message);
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
        <h5>{chat.name}</h5>
      </header>
      <div className="message-list">
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.sent_by_us ? 'sent' : 'received'}`}>
            <p>{msg.message_body}</p>
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