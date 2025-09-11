import React, { useState, useEffect } from 'react';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function AllOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      try {
        const response = await fetch(`${apiBackendUrl}/api/orders/allday`);
        if (!response.ok) throw new Error('Falha ao buscar os pedidos do dia.');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Erro ao buscar todos os pedidos:", error);
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