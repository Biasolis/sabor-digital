import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import OrderDetailModal from './OrderDetailModal'; // Importa o modal de detalhes do pedido

export default function ReportsDashboard() {
  const [reportData, setReportData] = useState({ revenue: 0, orderCount: 0, topProducts: [] });
  const [orders, setOrders] = useState([]); // NOVO: Estado para guardar a lista de pedidos
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('day'); // 'day', 'week', 'month'
  
  // NOVO: Estados para controlar o modal de detalhes
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mapeamento de status para usar no relatório
  const statusMap = {
    pending: { text: "Pendente", class: "pending" },
    accepted: { text: "Em Preparo", class: "accepted" },
    ready: { text: "Pronto", class: "ready" },
    delivered: { text: "Entregue", class: "delivered" },
    cancelled: { text: "Cancelado", class: "cancelled" },
  };

  const fetchReportData = async () => {
    setLoading(true);

    // Define o intervalo de datas com base no período
    const today = new Date();
    let startDate = new Date();
    const endDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // 1. Busca todos os pedidos no período, incluindo os dados dos contactos e itens
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*, contacts(*), order_items(*, products(name))')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error("Erro ao buscar pedidos para o relatório:", ordersError);
      setLoading(false);
      return;
    }
    
    setOrders(allOrders); // Guarda a lista completa de pedidos

    // 2. Filtra apenas os pedidos finalizados para os cálculos de resumo
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total_price, 0);
    const orderCount = deliveredOrders.length;

    // 3. Calcula os produtos mais vendidos a partir dos pedidos finalizados
    const deliveredOrderItems = deliveredOrders.flatMap(o => o.order_items);
    const productCount = deliveredOrderItems.reduce((acc, item) => {
      if (item.products) {
        acc[item.products.name] = (acc[item.products.name] || 0) + item.quantity;
      }
      return acc;
    }, {});

    const topProducts = Object.entries(productCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, quantity]) => ({ name, quantity }));

    setReportData({ revenue: totalRevenue, orderCount, topProducts });
    setLoading(false);
  };
  
  // O useEffect agora só tem uma dependência
  useEffect(() => {
    fetchReportData();
  }, [period]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Adiciona o modal ao componente */}
      <OrderDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder} 
        onStatusChange={fetchReportData} // Recarrega os dados se o status for alterado
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
            
            {/* NOVO: Lista detalhada de todos os pedidos do período */}
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