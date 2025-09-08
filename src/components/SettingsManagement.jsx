import React from 'react';
import StoreSettings from './StoreSettings';

export default function SettingsManagement() {
    // Como a integração antiga foi removida, exibimos diretamente as configurações da loja.
    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Configurações da Loja</h2>
            </div>
            <StoreSettings />
        </div>
    );
}