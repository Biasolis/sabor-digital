import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import OrderDetailModal from './OrderDetailModal';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedOrderId, setUpdatedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles ( * ), order_items ( *, products ( * ) )`)
      .order('created_at', { ascending: false });

    if (error) console.error("Erro ao buscar pedidos:", error);
    else setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('realtime orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          fetchOrders();
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
      <OrderDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} order={selectedOrder} onStatusChange={fetchOrders} />
      <div className="admin-content">
        <div className="page-header"><h2>Gestão de Pedidos</h2></div>
        <p>Visualize e gira os pedidos recebidos.</p>
        <div className="order-list">
          {orders.length > 0 ? orders.map(order => (
            <div key={order.id} className={`order-card status-${order.status} ${updatedOrderId === order.id ? 'updated' : ''}`}>
              <div className="order-card-header">
                <div><h3>Pedido #{order.id}</h3><span>{new Date(order.created_at).toLocaleString('pt-PT')}</span></div>
                <span className="order-card-total">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)}</span>
              </div>
              <div className="order-card-customer">
                <p><strong>Cliente:</strong> {order.profiles?.full_name || order.in_person_identifier || 'N/A'}</p>
                <p><strong>Tipo:</strong> {order.delivery_type === 'delivery' ? 'Entrega' : (order.delivery_type === 'pickup' ? 'Retirada' : 'No Local')}</p>
              </div>
              <div className="order-card-footer">
                <button className="btn-secondary" style={{padding: '0.5rem 1rem'}} onClick={() => handleViewDetails(order)}>Ver Detalhes</button>
              </div>
            </div>
          )) : <p>Nenhum pedido encontrado.</p>}
        </div>
      </div>
    </>
  );
}