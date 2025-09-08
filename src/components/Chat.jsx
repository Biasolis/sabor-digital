import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChatList from './Chat/ChatList';
import MessageView from './Chat/MessageView';
import './Chat/Chat.css';

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  const fetchChats = async () => {
    // Não seta loading para true aqui para evitar piscar a tela em cada atualização
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .order('last_message_timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar chats:', error);
    } else {
      setChats(data);
    }
    setLoading(false); // Apenas no carregamento inicial
  };

  useEffect(() => {
    fetchChats();

    const channel = supabase.channel('whatsapp_chats_and_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' }, fetchChats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, fetchChats)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBE_FAILED') {
          console.error('Falha ao se inscrever no canal de chats: ', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="chat-container">
      <ChatList 
        chats={chats}
        selectedChatId={selectedChat?.id}
        onSelectChat={setSelectedChat}
        loading={loading}
      />
      <MessageView 
        chat={selectedChat}
      />
    </div>
  );
}