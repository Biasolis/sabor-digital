import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    id: null,
    contact_id: null,
    full_name: '', 
    email: '', 
    phone: '', 
    cpf: '', 
    address: '', 
    number: '', 
    cep: '',
    neighborhood: '',
    complement: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiBackendUrl}/api/customers`);
        if (!response.ok) throw new Error("Falha ao buscar clientes");
        const data = await response.json();
        setCustomers(data);
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentCustomer({ id: null, contact_id: null, full_name: '', email: '', phone: '', cpf: '', address: '', number: '', cep: '', neighborhood: '', complement: '' });
  };

  const handleNewClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customer) => {
    if (window.confirm(`Tem a certeza que deseja apagar o cliente ${customer.full_name}? Esta ação não pode ser desfeita e irá remover o seu login.`)) {
        try {
            const response = await fetch(`${apiBackendUrl}/api/customers/${customer.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Falha ao apagar cliente.");
            alert('Cliente apagado com sucesso.');
            fetchCustomers();
        } catch (error) {
            alert('Erro ao apagar cliente: ' + error.message);
        }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isEditing) {
        const { id, contact_id, ...contactData } = currentCustomer;
        try {
            const response = await fetch(`${apiBackendUrl}/api/customers/${contact_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            if (!response.ok) throw new Error("Falha ao atualizar cliente.");
            alert('Cliente atualizado com sucesso!');
            setShowForm(false);
            fetchCustomers();
        } catch (error) {
            alert('Erro ao atualizar cliente: ' + error.message);
        }
    } else {
      // A lógica de criação de usuário ainda precisa do Supabase no frontend por causa da autenticação
      // ou ser movida para um endpoint de backend que usa o admin key.
      // Por simplicidade, mantemos a criação aqui por enquanto, mas o ideal seria uma rota no backend.
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: currentCustomer.email,
        password: Math.random().toString(36).slice(-8),
        options: { data: { full_name: currentCustomer.full_name, role: 'customer' }, phone: currentCustomer.phone }
      });
      
      if (adminSession) { await supabase.auth.setSession(adminSession); }
      
      if (authError) {
        alert('Erro ao criar o utilizador: ' + authError.message);
      } else if (authData.user){
        // Após criar o user, buscamos o contact_id e atualizamos com os dados do formulário
        const { data: profileData } = await supabase.from('profiles').select('contact_id').eq('id', authData.user.id).single();
        if (profileData) {
            const { id, ...contactData } = currentCustomer; // remove o id nulo
            const response = await fetch(`${apiBackendUrl}/api/customers/${profileData.contact_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            if(!response.ok) alert('Utilizador criado, mas falha ao salvar detalhes do contato.');
            else {
              alert('Cliente criado com sucesso!');
              setShowForm(false);
              fetchCustomers();
            }
        }
      }
    }
    setLoading(false);
    resetForm();
  };

  return (
    <div className="admin-content">
      <div className="page-header">
        <h2>Gestão de Clientes</h2>
        {!showForm && <button className="btn btn-primary" onClick={handleNewClick}>Novo Cliente</button>}
      </div>
      <p>Adicione, edite ou remova os clientes cadastrados.</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <div className="form-group"><label>Nome Completo</label><input type="text" name="full_name" value={currentCustomer.full_name || ''} onChange={handleInputChange} required /></div>
          <div className="form-group"><label>E-mail (Login)</label><input type="email" name="email" value={currentCustomer.email || ''} onChange={handleInputChange} required disabled={isEditing} /></div>
          <div className="form-group"><label>Telefone</label><input type="text" name="phone" value={currentCustomer.phone || ''} onChange={handleInputChange} /></div>
          <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={currentCustomer.cpf || ''} onChange={handleInputChange} /></div>
          <div className="form-group"><label>Morada</label><input type="text" name="address" value={currentCustomer.address || ''} onChange={handleInputChange} /></div>
          <div className="form-group"><label>Número</label><input type="text" name="number" value={currentCustomer.number || ''} onChange={handleInputChange} /></div>
          <div className="form-group"><label>Bairro</label><input type="text" name="neighborhood" value={currentCustomer.neighborhood || ''} onChange={handleInputChange} /></div>
          <div className="form-group"><label>CEP</label><input type="text" name="cep" value={currentCustomer.cep || ''} onChange={handleInputChange} /></div>
          <div className="form-group"><label>Complemento</label><input type="text" name="complement" value={currentCustomer.complement || ''} onChange={handleInputChange} /></div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'A salvar...' : (isEditing ? 'Salvar' : 'Criar')}</button>
            <button type="button" className="btn btn-secondary" onClick={() => {setShowForm(false); resetForm();}}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.full_name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td className="actions-cell">
                  <button onClick={() => handleEditClick(customer)}>Editar</button>
                  <button onClick={() => handleDelete(customer)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}