import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChatList from './Chat/ChatList';
import MessageView from './Chat/MessageView';
import NewChatModal from './Chat/NewChatModal';
import './Chat/Chat.css';

export default function Chat() {
  const [allChats, setAllChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .order('last_message_timestamp', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Erro ao buscar chats:', error);
    } else {
      setAllChats(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();

    const channel = supabase.channel('whatsapp_chats_and_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' }, fetchChats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, fetchChats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleArchiveChat = async (chatId) => {
    const statusToSet = showArchived ? 'open' : 'archived';
    const { error } = await supabase
      .from('whatsapp_chats')
      .update({ status: statusToSet })
      .eq('id', chatId);

    if (error) {
      alert(`Erro ao ${showArchived ? 'desarquivar' : 'arquivar'} a conversa.`);
      console.error('Erro ao arquivar chat:', error);
    } else {
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    }
  };

  const visibleChats = allChats.filter(chat => 
    showArchived ? chat.status === 'archived' : chat.status === 'open'
  );

  return (
    <div className="chat-container">
      {isNewChatModalOpen && <NewChatModal 
        onClose={() => setIsNewChatModalOpen(false)} 
        onSelectChat={(chat) => {
          setShowArchived(false); // Garante que a vista de chats abertos está ativa
          setSelectedChat(chat);
        }} 
      />}

      <ChatList 
        chats={visibleChats}
        selectedChatId={selectedChat?.id}
        onSelectChat={setSelectedChat}
        loading={loading}
        onArchiveToggle={setShowArchived}
        showArchived={showArchived}
        onNewChat={() => setIsNewChatModalOpen(true)}
        onArchiveChat={handleArchiveChat}
      />
      <MessageView 
        chat={selectedChat}
      />
    </div>
  );
}