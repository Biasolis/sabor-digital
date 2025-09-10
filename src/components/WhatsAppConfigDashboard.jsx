import React, { useState } from 'react';
import Connection from './Connection';
import WhatsAppSettings from './WhatsAppSettings';
import WhatsAppProfileSettings from './WhatsAppProfileSettings';
import ChatbotManager from './ChatbotManager';

export default function WhatsAppConfigDashboard() {
    const [activeTab, setActiveTab] = useState('connection');

    const renderContent = () => {
        switch (activeTab) {
            case 'connection': return <Connection />;
            case 'settings': return <WhatsAppSettings />;
            case 'profile': return <WhatsAppProfileSettings />;
            case 'chatbot': return <ChatbotManager />;
            default: return <Connection />;
        }
    }

    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Configurações do WhatsApp</h2>
            </div>
            <p>Gira a conexão, automações, perfil e chatbots da sua conta do WhatsApp.</p>

            <div className="submenu-nav">
                <button className={`submenu-btn ${activeTab === 'connection' ? 'active' : ''}`} onClick={() => setActiveTab('connection')}>Conexão</button>
                <button className={`submenu-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Configurações</button>
                <button className={`submenu-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Perfil</button>
                <button className={`submenu-btn ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}>Chatbot</button>
            </div>

            {renderContent()}
        </div>
    );
}