import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ReportsDashboard() {
  const [reportData, setReportData] = useState({ revenue: 0, orderCount: 0, topProducts: [] });
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

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

      // 1. Busca todos os pedidos finalizados no período
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price')
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) {
        console.error("Erro ao buscar pedidos para o relatório:", ordersError);
        setLoading(false);
        return;
      }

      // 2. Calcula as métricas básicas
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
      const orderCount = orders.length;

      // 3. Busca os itens dos pedidos para encontrar os mais vendidos
      const orderIds = orders.map(o => o.id);
      let topProducts = [];

      if (orderIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('quantity, products (name)')
          .in('order_id', orderIds);

        if (itemsError) {
          console.error("Erro ao buscar itens do pedido:", itemsError);
        } else {
          const productCount = items.reduce((acc, item) => {
            if (item.products) { // Verifica se o produto não foi apagado
              acc[item.products.name] = (acc[item.products.name] || 0) + item.quantity;
            }
            return acc;
          }, {});

          topProducts = Object.entries(productCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10) // Pega os 10 mais vendidos
            .map(([name, quantity]) => ({ name, quantity }));
        }
      }

      setReportData({ revenue: totalRevenue, orderCount, topProducts });
      setLoading(false);
    };

    fetchReportData();
  }, [period]);

  return (
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
              <h4>Total Arrecadado</h4>
              <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData.revenue)}</p>
            </div>
            <div className="summary-card">
              <h4>Pedidos Finalizados</h4>
              <p>{reportData.orderCount}</p>
            </div>
          </div>

          <h4>Produtos Mais Pedidos</h4>
          <table className="product-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade Vendida</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topProducts.map((product) => (
                <tr key={product.name}>
                  <td>{product.name}</td>
                  <td>{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.topProducts.length === 0 && <p style={{marginTop: '1rem'}}>Nenhum produto vendido no período.</p>}
        </>
      )}
    </div>
  );
}