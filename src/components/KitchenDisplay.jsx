import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function KitchenDisplay({ session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAcceptedOrders = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiBackendUrl}/api/orders/kitchen`);
        if (!response.ok) throw new Error('Falha ao buscar pedidos para a cozinha.');
        const data = await response.json();
        setOrders(data);
    } catch (error) {
        console.error("Erro ao buscar pedidos para a cozinha:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAcceptedOrders();
    const channel = supabase.channel('kds_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: 'status=eq.accepted'
      }, 
      (payload) => {
        fetchAcceptedOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsReady = async (orderId) => {
    try {
        const response = await fetch(`${apiBackendUrl}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ready' })
        });
        if (!response.ok) throw new Error('Falha ao marcar pedido como pronto.');
        // A atualização em tempo real via Supabase vai remover o card da tela.
    } catch (error) {
        alert("Erro ao marcar pedido como pronto: " + error.message);
    }
  };

  if (loading) return <p className="loading-message">A carregar pedidos...</p>;

  return (
    <div className="kitchen-display">
      <div className="kitchen-header">
        <h1>Pedidos na Cozinha</h1>
        <p>Pedidos "Em Preparo". Marque-os como "Pronto" assim que finalizados.</p>
      </div>
      {orders.length > 0 ? (
        <div className="kds-order-grid">
          {orders.map(order => (
            <div key={order.id} className="kds-order-card">
              <div className="kds-card-header">
                <h3>Pedido #{order.id}</h3>
                <span>{order.in_person_identifier || 'Cliente'}</span>
              </div>
              <ul className="kds-item-list">
                {order.order_items.map(item => (
                  <li key={item.id}>
                    <strong>{item.quantity}x</strong> {item.products?.name || 'Produto Removido'}
                  </li>
                ))}
              </ul>
              <button 
                className="btn-ready" 
                onClick={() => handleMarkAsReady(order.id)}>
                Marcar como Pronto
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-orders-message">Nenhum pedido em preparo no momento.</p>
      )}
    </div>
  );
}