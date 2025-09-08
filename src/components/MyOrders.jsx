import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MyOrders({ isOpen, onClose, session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusMap = {
    pending: { text: "Pendente", class: "pending" },
    accepted: { text: "Em Preparo", class: "accepted" },
    ready: { text: "Pronto para Retirada/Entrega", class: "ready" },
    delivered: { text: "Entregue", class: "delivered" },
    cancelled: { text: "Cancelado", class: "cancelled" },
  };

  const fetchUserOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('orders').select(`*, order_items(*, products(name))`).eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (error) console.error("Erro ao buscar pedidos:", error);
      else setOrders(data);
      setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchUserOrders();
    const channel = supabase.channel(`user-orders-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${session.user.id}` }, () => { fetchUserOrders(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, session.user.id]);

  const handleCancelOrder = async (orderId) => {
      if (window.confirm("Tem a certeza que deseja cancelar este pedido?")) {
          const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId).eq('status', 'pending');
          if (error) alert("Erro ao cancelar pedido: " + error.message);
          else alert("Pedido cancelado com sucesso.");
      }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header"><h2>Meus Pedidos</h2><button onClick={onClose}>&times;</button></div>
        <div className="cart-body">
          {loading ? <p>A carregar...</p> : (
            orders.length === 0 ? <p>Você ainda não fez nenhum pedido.</p> : (
              orders.map(order => (
                <div key={order.id} className="my-orders-card">
                  <div className="my-orders-header">
                    <div><strong>Pedido #{order.id}</strong><p style={{fontSize: '0.9rem', color: '#6b7280'}}>{new Date(order.created_at).toLocaleString('pt-PT')}</p></div>
                    <span className={`status-badge ${statusMap[order.status]?.class || ''}`}>{statusMap[order.status]?.text || order.status}</span>
                  </div>
                  <ul>{order.order_items.map(item => (<li key={item.id}>{item.quantity}x {item.products?.name || 'Produto removido'}</li>))}</ul>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                    {order.status === 'pending' && <button className="btn-secondary" style={{padding: '0.5rem 1rem'}} onClick={() => handleCancelOrder(order.id)}>Cancelar</button>}
                    <p style={{fontWeight: 'bold', margin: 0}}>Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)}</p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}