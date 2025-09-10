import React, { useState } from 'react';
import Connection from './Connection';
import WhatsAppSettings from './WhatsAppSettings';
import WhatsAppProfileSettings from './WhatsAppProfileSettings';

export default function WhatsAppConfigDashboard() {
    const [activeTab, setActiveTab] = useState('connection');

    // Função para renderizar o conteúdo da aba ativa
    const renderContent = () => {
        switch (activeTab) {
            case 'connection':
                return <Connection />;
            case 'settings':
                return <WhatsAppSettings />;
            case 'profile':
                return <WhatsAppProfileSettings />;
            default:
                return <Connection />;
        }
    }

    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Configurações do WhatsApp</h2>
            </div>
            <p>Gira a conexão, automações e o perfil público da sua conta do WhatsApp.</p>

            <div className="submenu-nav">
                <button 
                    className={`submenu-btn ${activeTab === 'connection' ? 'active' : ''}`}
                    onClick={() => setActiveTab('connection')}
                >
                    Conexão
                </button>
                <button 
                    className={`submenu-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Configurações
                </button>
                {/* Aba de Perfil agora está presente */}
                <button 
                    className={`submenu-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Perfil
                </button>
            </div>

            {renderContent()}
        </div>
    );
}