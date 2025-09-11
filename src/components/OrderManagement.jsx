import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import OrderDetailModal from './OrderDetailModal';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedOrderId, setUpdatedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fetchOpenOrders = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiBackendUrl}/api/orders/open`);
        if (!response.ok) throw new Error('Falha ao buscar pedidos em aberto.');
        const data = await response.json();
        setOrders(data);
    } catch (error) {
        console.error("Erro ao buscar pedidos em aberto:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOpenOrders();
    const channel = supabase.channel('realtime orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          fetchOpenOrders(); // Atualiza a lista a cada mudança
          if (payload.eventType === 'UPDATE') {
            setUpdatedOrderId(payload.new.id);
            setTimeout(() => setUpdatedOrderId(null), 1500);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (loading) return <p>A carregar pedidos...</p>;

  return (
    <>
      <OrderDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} order={selectedOrder} onStatusChange={fetchOpenOrders} />
      <p>Visualize e gira os pedidos que precisam de atenção (pendentes ou em preparo).</p>
      <div className="order-list">
        {orders.length > 0 ? orders.map(order => (
          <div key={order.id} className={`order-card status-${order.status} ${updatedOrderId === order.id ? 'updated' : ''}`}>
            <div className="order-card-header">
              <div><h3>Pedido #{order.id}</h3><span>{new Date(order.created_at).toLocaleString('pt-PT')}</span></div>
              <span className="order-card-total">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)}</span>
            </div>
            <div className="order-card-customer">
              <p><strong>Cliente:</strong> {order.contacts?.full_name || order.in_person_identifier || 'N/A'}</p>
              <p><strong>Tipo:</strong> {order.delivery_type === 'delivery' ? 'Entrega' : (order.delivery_type === 'pickup' ? 'Retirada' : 'No Local')}</p>
            </div>
            <div className="order-card-footer">
              <button className="btn-secondary" style={{padding: '0.5rem 1rem'}} onClick={() => handleViewDetails(order)}>Ver Detalhes</button>
            </div>
          </div>
        )) : <p>Nenhum pedido em aberto no momento.</p>}
      </div>
    </>
  );
}