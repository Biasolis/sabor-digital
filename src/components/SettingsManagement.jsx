import React, { useState } from 'react';
import StoreSettings from './StoreSettings';
import WhatsAppIntegration from './WhatsAppIntegration';

export default function SettingsManagement() {
    const [activeTab, setActiveTab] = useState('store');
    
    return (
        <div className="admin-content">
            <div className="page-header"><h2>Configurações</h2></div>
            <div className="submenu-nav">
                <button 
                    onClick={() => setActiveTab('store')} 
                    className={`submenu-btn ${activeTab === 'store' ? 'active' : ''}`}
                >
                    Loja
                </button>
                <button 
                    onClick={() => setActiveTab('whatsapp')} 
                    className={`submenu-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
                >
                    WhatsApp
                </button>
            </div>
            
            {activeTab === 'store' ? <StoreSettings /> : <WhatsAppIntegration />}
        </div>
    );
}
