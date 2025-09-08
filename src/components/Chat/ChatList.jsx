import React from 'react';

const ChatList = ({ chats, selectedChatId, onSelectChat, loading }) => {
  if (loading) return <div className="chat-list-pane"><p>A carregar conversas...</p></div>;

  return (
    <aside className="chat-list-pane">
      <div className="chat-list-header">
        <h4>Conversas</h4>
      </div>
      <div className="chat-list">
        {chats.length > 0 ? (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-list-item ${selectedChatId === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-item-details">
                <p className="chat-item-name">{chat.name}</p>
              </div>
            </div>
          ))
        ) : (
          <p style={{ padding: '1rem', textAlign: 'center' }}>Nenhuma conversa encontrada.</p>
        )}
      </div>
    </aside>
  );
};

export default ChatList;