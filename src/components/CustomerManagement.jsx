import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      // A linha .order() foi removida daqui, pois a coluna 'created_at' não existe na sua tabela.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');

      if (error) {
        console.error("Erro ao buscar clientes:", error);
      } else {
        setCustomers(data);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  if (loading) return <p>A carregar clientes...</p>;

  return (
    <div className="admin-content">
      <div className="page-header">
        <h2>Gestão de Clientes</h2>
      </div>
      <p>Visualize os dados de todos os clientes cadastrados.</p>

      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Morada</th>
              <th>Comunicações</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.full_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.cpf}</td>
                  <td>{`${customer.address || ''}, ${customer.number || ''}`}</td>
                  <td>{customer.accepts_communications ? 'Sim' : 'Não'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}