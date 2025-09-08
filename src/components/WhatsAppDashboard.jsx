import React, { useState } from 'react';
import Connection from './Connection';
import Chat from './Chat';
import WhatsAppSettings from './WhatsAppSettings';

export default function WhatsAppDashboard() {
    const [activeTab, setActiveTab] = useState('connection');

    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Gestão de WhatsApp</h2>
            </div>
            <div className="submenu-nav">
                <button 
                    className={`submenu-btn ${activeTab === 'connection' ? 'active' : ''}`}
                    onClick={() => setActiveTab('connection')}
                >
                    Conexão
                </button>
                <button 
                    className={`submenu-btn ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Chat
                </button>
                <button 
                    className={`submenu-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Configurações
                </button>
            </div>

            {activeTab === 'connection' && <Connection />}
            {activeTab === 'chat' && <Chat />}
            {activeTab === 'settings' && <WhatsAppSettings />}
        </div>
    );
}