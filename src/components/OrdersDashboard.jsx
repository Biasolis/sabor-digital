import React, { useState } from 'react';
import OrderManagement from './OrderManagement';
import AllOrdersList from './AllOrdersList'; // Vamos criar este componente a seguir

export default function OrdersDashboard() {
    const [activeTab, setActiveTab] = useState('open'); // 'open' ou 'all'

    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Gestão de Pedidos</h2>
            </div>
            
            <div className="submenu-nav">
                <button 
                    className={`submenu-btn ${activeTab === 'open' ? 'active' : ''}`}
                    onClick={() => setActiveTab('open')}
                >
                    Em Aberto
                </button>
                <button 
                    className={`submenu-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Todos os Pedidos do Dia
                </button>
            </div>

            {/* Renderiza o componente correto com base na aba ativa */}
            {activeTab === 'open' ? <OrderManagement /> : <AllOrdersList />}
        </div>
    );
}