import React, { useState } from 'react';
import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';

export default function MenuDashboard() {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div className="admin-content">
            <div className="page-header">
                <h2>Gestão de Cardápio</h2>
            </div>
            <p>Adicione, edite ou remova produtos e suas respectivas categorias.</p>

            <div className="submenu-nav">
                <button 
                    className={`submenu-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Produtos
                </button>
                <button 
                    className={`submenu-btn ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    Categorias
                </button>
            </div>

            {activeTab === 'products' ? <ProductManagement /> : <CategoryManagement />}
        </div>
    );
}