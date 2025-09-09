import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminProfile() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (password.length < 6) {
        setMessage('Erro: A senha deve ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
    }

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage(`Erro ao atualizar a senha: ${error.message}`);
    } else {
      setMessage('Senha atualizada com sucesso!');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="admin-content">
      <div className="page-header">
        <h2>Meu Perfil</h2>
      </div>
      <p>Atualize as suas informações de login.</p>
      
      <form onSubmit={handlePasswordUpdate} className="product-form" style={{ maxWidth: '600px' }}>
        <h3>Alterar Senha</h3>
        <div className="form-group">
          <label htmlFor="password">Nova Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Deve ter no mínimo 6 caracteres"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar Nova Senha'}
          </button>
        </div>
        {message && <p style={{ marginTop: '1rem', color: message.includes('Erro') ? '#991b1b' : '#166534' }}>{message}</p>}
      </form>
    </div>
  );
}