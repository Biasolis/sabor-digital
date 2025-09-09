import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AllOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mapeamento de status para texto e classe CSS para os badges
  const statusMap = {
    pending: { text: "Pendente", class: "pending" },
    accepted: { text: "Em Preparo", class: "accepted" },
    ready: { text: "Pronto", class: "ready" },
    delivered: { text: "Entregue", class: "delivered" },
    cancelled: { text: "Cancelado", class: "cancelled" },
  };

  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);

      // 1. Busca a data da última abertura da loja
      const { data: settings } = await supabase
        .from('store_settings')
        .select('last_opened_at')
        .eq('id', 1)
        .single();
      
      let query = supabase
        .from('orders')
        .select(`*, contacts ( full_name )`)
        .order('created_at', { ascending: false });

      // 2. Se houver uma data, filtra os pedidos a partir dela
      if (settings?.last_opened_at) {
        query = query.gte('created_at', settings.last_opened_at);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao buscar todos os pedidos:", error);
      } else {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchAllOrders();
  }, []);

  if (loading) return <p>A carregar todos os pedidos...</p>;

  return (
    <div className="product-table-wrapper">
      <p>Abaixo estão todos os pedidos recebidos desde que a loja foi aberta.</p>
      <table className="product-table">
        <thead>
          <tr>
            <th>Pedido #</th>
            <th>Cliente</th>
            <th>Data/Hora</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.contacts?.full_name || order.in_person_identifier || 'N/A'}</td>
              <td>{new Date(order.created_at).toLocaleString('pt-PT')}</td>
              <td>
                <span className={`status-badge ${statusMap[order.status]?.class || ''}`}>
                  {statusMap[order.status]?.text || order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p style={{marginTop: '1rem', textAlign: 'center'}}>Nenhum pedido encontrado no período atual.</p>}
    </div>
  );
}