import React, { useState, useEffect } from 'react';
import OrderDetailModal from './OrderDetailModal';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function ReportsDashboard() {
  const [reportData, setReportData] = useState({ revenue: 0, orderCount: 0, topProducts: [] });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('day'); // 'day', 'week', 'month'
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusMap = {
    pending: { text: "Pendente", class: "pending" },
    accepted: { text: "Em Preparo", class: "accepted" },
    ready: { text: "Pronto", class: "ready" },
    delivered: { text: "Entregue", class: "delivered" },
    cancelled: { text: "Cancelado", class: "cancelled" },
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiBackendUrl}/api/orders/report?period=${period}`);
        if (!response.ok) throw new Error("Falha ao buscar dados do relatório.");
        
        const { allOrders, summary } = await response.json();
        
        setOrders(allOrders);
        setReportData(summary);

    } catch (error) {
        console.error("Erro ao buscar dados do relatório:", error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchReportData();
  }, [period]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <>
      <OrderDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder} 
        onStatusChange={fetchReportData}
      />
      <div className="admin-content">
        <div className="page-header">
          <h2>Relatórios</h2>
        </div>
        <p>Analise o desempenho da sua loja.</p>

        <div className="date-filters">
          <button onClick={() => setPeriod('day')} className={`btn ${period === 'day' ? 'btn-primary' : 'btn-secondary'}`}>Hoje</button>
          <button onClick={() => setPeriod('week')} className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'}`}>Esta Semana</button>
          <button onClick={() => setPeriod('month')} className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}>Este Mês</button>
        </div>

        {loading ? <p>A gerar relatório...</p> : (
          <>
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Total Arrecadado (Entregues)</h4>
                <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData.revenue)}</p>
              </div>
              <div className="summary-card">
                <h4>Pedidos Finalizados</h4>
                <p>{reportData.orderCount}</p>
              </div>
            </div>
            
            <h4 style={{marginTop: '2rem'}}>Todos os Pedidos do Período</h4>
            <div className="product-table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Pedido #</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.contacts?.full_name || order.in_person_identifier || 'N/A'}</td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)}</td>
                        <td>
                          <span className={`status-badge ${statusMap[order.status]?.class || ''}`}>
                            {statusMap[order.status]?.text || order.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button onClick={() => handleViewDetails(order)}>Ver Detalhes</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            {orders.length === 0 && <p style={{marginTop: '1rem', textAlign: 'center'}}>Nenhum pedido encontrado no período.</p>}
          </>
        )}
      </div>
    </>
  );
}