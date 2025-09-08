import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function KitchenDisplay({ session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAcceptedOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(*, products(name))`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true }); // Mais antigos primeiro

    if (error) {
      console.error("Erro ao buscar pedidos para a cozinha:", error);
    } else {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAcceptedOrders();
    const channel = supabase.channel('kds_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, 
      (payload) => {
        // Recarrega a lista se um pedido for atualizado para 'accepted' ou removido da lista
        fetchAcceptedOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsReady = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'ready' })
      .eq('id', orderId);
    
    if (error) {
      alert("Erro ao marcar pedido como pronto: " + error.message);
    }
    // A atualização em tempo real vai remover o card da tela
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