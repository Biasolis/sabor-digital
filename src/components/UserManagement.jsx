import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Componente para a lista de utilizadores existentes
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', ['admin', 'caixa', 'garcom']);
    
    if (error) console.error("Erro ao buscar utilizadores:", error);
    else setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
    });
    
    // Também atualiza a tabela de perfis para consistência
    const { error: profileError } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);

    if (error || profileError) {
      alert("Erro ao atualizar função: " + (error?.message || profileError?.message));
    } else {
      alert("Função atualizada com sucesso!");
      fetchUsers();
    }
  };

  const handlePasswordReset = async (email) => {
    if(window.confirm(`Tem a certeza que deseja enviar um e-mail de redefinição de senha para ${email}?`)){
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if(error) alert("Erro ao enviar e-mail: " + error.message);
        else alert("E-mail de redefinição de senha enviado com sucesso!");
    }
  };

  if (loading) return <p>A carregar utilizadores...</p>;

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>E-mail</th>
          <th>Função Atual</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>
              <select defaultValue={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}>
                <option value="caixa">Caixa</option>
                <option value="garcom">Garçom</option>
                <option value="admin">Administrador</option>
              </select>
            </td>
            <td className="actions-cell">
              <button onClick={() => handlePasswordReset(user.email)}>Redefinir Senha</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Componente para convidar um novo utilizador
const InviteUser = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('caixa');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: temporaryPassword,
      options: { data: { role: role, full_name: `Funcionário ${email.split('@')[0]}` } }
    });
    if (error) alert("Erro ao criar utilizador: " + error.message);
    else {
      alert(`Utilizador criado para ${email}! Um e-mail de confirmação com um link para definir a senha foi enviado.`);
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleCreateUser} className="product-form" style={{marginTop: '2rem'}}>
      <h3>Convidar Novo Utilizador</h3>
      <div className="form-group"><label htmlFor="email">E-mail do Utilizador</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="form-group"><label htmlFor="role">Função</label><select id="role" value={role} onChange={(e) => setRole(e.target.value)}><option value="caixa">Caixa</option><option value="garcom">Garçom</option><option value="admin">Administrador</option></select></div>
      <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'A criar...' : 'Criar e Convidar'}</button></div>
    </form>
  );
};

// Componente principal que une os dois
export default function UserManagement() {
    return (
        <div className="admin-content">
            <div className="page-header"><h2>Gestão de Utilizadores</h2></div>
            <p>Visualize, edite e convide membros da equipa.</p>
            <UserList />
            <InviteUser />
        </div>
    );
}