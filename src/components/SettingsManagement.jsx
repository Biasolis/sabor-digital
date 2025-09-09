import React from 'react';
import StoreSettings from './StoreSettings';

// ATUALIZADO: Recebe a propriedade e passa-a para o filho
export default function SettingsManagement({ onSettingsUpdate }) {
    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Configurações da Loja</h2>
            </div>
            <StoreSettings onSettingsUpdate={onSettingsUpdate} />
        </div>
    );
}