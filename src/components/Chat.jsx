import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChatList from './Chat/ChatList';
import MessageView from './Chat/MessageView';
import NewChatModal from './Chat/NewChatModal';
import ContactInfo from './Chat/ContactInfo';
import './Chat/Chat.css';

const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

export default function Chat({ session }) {
  const [allChats, setAllChats] = useState([]);
  const [visibleChats, setVisibleChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chats_with_profile')
      .select('*')
      .order('last_message_timestamp', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Erro ao buscar chats:', error);
      setAllChats([]);
    } else {
      setAllChats(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      fetchChats();
    }
    const channel = supabase.channel('realtime:whatsapp_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' },
        (payload) => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchChats]);

  useEffect(() => {
    const filtered = allChats.filter(chat => {
      const isArchived = chat.status === 'archived';
      return showArchived ? isArchived : !isArchived;
    });
    setVisibleChats(filtered);
  }, [allChats, showArchived]);

  useEffect(() => {
    setIsContactInfoOpen(false);
  }, [selectedChat]);

  const handleArchiveChat = async (chatId) => {
    const statusToSet = showArchived ? 'open' : 'archived';
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Utilizador não autenticado.");

        const response = await fetch(`${backendUrl}/archive-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ chatId, status: statusToSet })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Falha ao arquivar a conversa.');
        }

        if(selectedChat?.id === chatId) {
            setSelectedChat(null);
        }
        fetchChats(); // Atualiza a lista após a operação ser bem-sucedida

    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
  };
  
  return (
    <div className="chat-container">
      {isNewChatModalOpen && <NewChatModal 
        onClose={() => setIsNewChatModalOpen(false)} 
        onSelectChat={(chat) => {
          setShowArchived(false);
          setSelectedChat(chat);
          setIsNewChatModalOpen(false);
        }} 
      />}

      <ChatList 
        chats={visibleChats}
        selectedChatId={selectedChat?.id}
        onSelectChat={setSelectedChat}
        loading={loading}
        onArchiveToggle={(isArchived) => {
          setShowArchived(isArchived);
          setSelectedChat(null);
        }}
        showArchived={showArchived}
        onNewChat={() => setIsNewChatModalOpen(true)}
        onArchiveChat={handleArchiveChat}
      />
      <MessageView 
        key={selectedChat ? selectedChat.id : 'placeholder'}
        chat={selectedChat}
        onToggleContactInfo={() => setIsContactInfoOpen(!isContactInfoOpen)}
      />
      {isContactInfoOpen && (
        <ContactInfo 
          key={selectedChat ? `info-${selectedChat.id}`: 'info-placeholder'}
          chat={selectedChat}
          onClose={() => setIsContactInfoOpen(false)}
        />
      )}
    </div>
  );
}