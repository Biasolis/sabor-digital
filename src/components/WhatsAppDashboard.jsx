import React from 'react';
import Chat from './Chat';

// CORRIGIDO: Este componente agora é dedicado apenas a exibir o chat.
export default function WhatsAppDashboard({ session }) {
    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>WhatsApp Chat</h2>
            </div>
            <p>Visualize e responda às conversas com os seus clientes.</p>
            <Chat session={session} />
        </div>
    );
}