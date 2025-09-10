import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

export default function ContactInfo({ chat, onClose }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setContact(null);
    setFormData({});
    setIsEditing(false);

    const fetchContact = async () => {
      if (!chat || chat.id.includes('@g.us')) {
        setContact(null);
        return;
      }
      setLoading(true);
      const phoneNumber = chat.id.split('@')[0];
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone', phoneNumber)
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao buscar contato:", error);
      } else {
        setContact(data);
        setFormData(data || { phone: phoneNumber, full_name: chat.display_name || phoneNumber });
      }
      setLoading(false);
    };

    if (chat) {
      fetchContact();
    }
  }, [chat]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Utilizador não autenticado.");

        const response = await fetch(`${backendUrl}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Falha ao salvar o contato.');
        }
        
        alert("Contato salvo com sucesso!");
        setContact(result);
        setIsEditing(false);

    } catch (error) {
        alert(`Erro ao salvar contato: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const FormContent = () => (
    <form onSubmit={handleSave}>
      <div className="form-group"><label>Nome</label><input type="text" name="full_name" value={formData.full_name || ''} onChange={handleInputChange} required /></div>
      <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>Telefone</label><input type="text" name="phone" value={formData.phone || ''} disabled /></div>
      <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={formData.cpf || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>Endereço</label><input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>Número</label><input type="text" name="number" value={formData.number || ''} onChange={handleInputChange} /></div>
       <div className="form-group"><label>Bairro</label><input type="text" name="neighborhood" value={formData.neighborhood || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>CEP</label><input type="text" name="cep" value={formData.cep || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>Complemento</label><input type="text" name="complement" value={formData.complement || ''} onChange={handleInputChange} /></div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'A salvar...' : 'Salvar'}</button>
        <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
      </div>
    </form>
  );

  if (!chat) return <aside className="contact-info-pane placeholder"><p>Selecione uma conversa para ver os detalhes do contato.</p></aside>;
  if (loading && !contact) return <aside className="contact-info-pane"><p>A carregar dados do contato...</p></aside>;

  return (
    <aside className="contact-info-pane">
      <div className="contact-info-header">
        <h4>{contact ? 'Informações do Contato' : 'Novo Contato'}</h4>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>
      <div className="contact-info-body">
        {isEditing ? (
          <FormContent />
        ) : (
          <>
            {contact ? (
              <>
                <div className="contact-details">
                    <p><strong>Nome:</strong> {contact.full_name || 'N/A'}</p>
                    <p><strong>Email:</strong> {contact.email || 'N/A'}</p>
                    <p><strong>Telefone:</strong> {contact.phone || 'N/A'}</p>
                    <p><strong>CPF:</strong> {contact.cpf || 'N/A'}</p>
                    <p><strong>Endereço:</strong> {contact.address ? `${contact.address}, ${contact.number || ''}` : 'N/A'}</p>
                </div>
                <button className="btn-edit-contact" onClick={() => setIsEditing(true)}>Editar Dados</button>
              </>
            ) : (
              <>
                <p>Nenhum contato salvo para este número.</p>
                <button className="btn-edit-contact" onClick={() => setIsEditing(true)}>Criar Contato</button>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}