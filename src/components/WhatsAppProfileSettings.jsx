import React, { useState } from 'react';

const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

export default function WhatsAppProfileSettings() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [picture, setPicture] = useState(null);
  const [loading, setLoading] = useState(''); // 'name', 'status', 'picture'

  const handleUpdate = async (type) => {
    setLoading(type);
    let body;
    let endpoint;

    try {
      switch (type) {
        case 'name':
          endpoint = 'update-profile-name';
          body = JSON.stringify({ name });
          break;
        case 'status':
          endpoint = 'update-profile-status';
          body = JSON.stringify({ status });
          break;
        case 'picture':
          if (!picture) {
            alert("Por favor, selecione uma imagem.");
            setLoading('');
            return;
          }
          endpoint = 'update-profile-picture';
          body = new FormData();
          body.append('picture', picture);
          break;
        default:
          return;
      }

      const response = await fetch(`${backendUrl}/${endpoint}`, {
        method: 'POST',
        headers: type !== 'picture' ? { 'Content-Type': 'application/json' } : {},
        body: body,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ocorreu um erro.');
      }

      alert(`'${type}' atualizado com sucesso!`);
      if (type === 'name') setName('');
      if (type === 'status') setStatus('');
      if (type === 'picture') setPicture(null);

    } catch (error) {
      alert(`Erro ao atualizar: ${error.message}`);
    } finally {
      setLoading('');
    }
  };

  return (
    <div>
        <h4>Gerir Perfil do WhatsApp</h4>
        <p>Altere o nome, recado (status) e foto de perfil que os seus clientes veem.</p>
        
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate('name'); }} className="product-form" style={{marginTop: '2rem'}}>
            <div className="form-group">
                <label>Nome de Exibição</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Digite o novo nome" 
                    required 
                />
            </div>
            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading === 'name'}>
                    {loading === 'name' ? 'A atualizar...' : 'Atualizar Nome'}
                </button>
            </div>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); handleUpdate('status'); }} className="product-form">
            <div className="form-group">
                <label>Recado / Status</label>
                <input 
                    type="text" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    placeholder="Digite o novo recado" 
                    required 
                />
            </div>
            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading === 'status'}>
                    {loading === 'status' ? 'A atualizar...' : 'Atualizar Recado'}
                </button>
            </div>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); handleUpdate('picture'); }} className="product-form">
            <div className="form-group">
                <label>Foto de Perfil</label>
                <input 
                    type="file" 
                    onChange={(e) => setPicture(e.target.files[0])} 
                    accept="image/*" 
                    required 
                />
            </div>
            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading === 'picture'}>
                    {loading === 'picture' ? 'A enviar...' : 'Atualizar Foto'}
                </button>
            </div>
        </form>
    </div>
  );
}