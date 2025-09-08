import React from 'react';

const ChatList = ({ chats, selectedChatId, onSelectChat, loading, onArchiveToggle, showArchived, onNewChat, onArchiveChat }) => {
  if (loading) return <div className="chat-list-pane"><p>A carregar conversas...</p></div>;

  return (
    <aside className="chat-list-pane">
      <div className="chat-list-header">
        <h4>Conversas</h4>
        <button onClick={onNewChat} className="new-chat-btn" title="Nova Conversa">+</button>
      </div>
      <div className="chat-list-tabs">
        <button onClick={() => onArchiveToggle(false)} className={!showArchived ? 'active' : ''}>Abertas</button>
        <button onClick={() => onArchiveToggle(true)} className={showArchived ? 'active' : ''}>Arquivadas</button>
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
                <p className="chat-item-name">{chat.name || chat.id.split('@')[0]}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onArchiveChat(chat.id); }} 
                className="archive-btn"
                title={showArchived ? 'Desarquivar' : 'Arquivar'}
              >
                {showArchived ? '↩' : 'X'}
              </button>
            </div>
          ))
        ) : (
          <p className="chat-list-empty">{showArchived ? 'Nenhuma conversa arquivada.' : 'Nenhuma conversa aberta.'}</p>
        )}
      </div>
    </aside>
  );
};

export default ChatList;