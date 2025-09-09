import React, { useState } from 'react';
import Connection from './Connection';
import Chat from './Chat';
import WhatsAppSettings from './WhatsAppSettings';

export default function WhatsAppDashboard({ session }) {
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

            {/* A lógica de renderização foi alterada para manter os componentes montados */}
            <div style={{ display: activeTab === 'connection' ? 'block' : 'none' }}>
                <Connection />
            </div>
            <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
                <Chat session={session} />
            </div>
            <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
                <WhatsAppSettings />
            </div>
        </div>
    );
}