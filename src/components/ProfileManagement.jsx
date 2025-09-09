import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validateCPF } from '../utils/cpfValidator';

export default function ProfileManagement({ isOpen, onClose, session, onProfileUpdate }) {
  const [contact, setContact] = useState({ full_name: '', address: '', phone: '', cep: '', number: '', neighborhood: '', complement: '', cpf: '', accepts_communications: false });
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchAddressFromCep = async (cep) => {
    if (cep.length !== 8) return;
    try {
      setLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setContact(prev => ({ ...prev, address: data.logouro, neighborhood: data.bairro, }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchProfileData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*, contacts(*)')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error("Erro ao buscar perfil:", error);
      } else if (data) {
        setProfile(data);
        if (data.contacts) {
          setContact(data.contacts);
        }
      }
      setLoading(false);
    };
    fetchProfileData();
  }, [isOpen, session.user.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setContact(prev => ({ ...prev, [name]: newValue }));
    
    if (name === 'cep') {
      const cleanedValue = value.replace(/\D/g, '');
      if (cleanedValue.length === 8) {
        fetchAddressFromCep(cleanedValue);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (contact.cpf && !validateCPF(contact.cpf)) {
      alert("O CPF inserido não é válido. Por favor, verifique.");
      return;
    }
    setLoading(true);
    
    // Os dados do formulário agora atualizam a tabela 'contacts'
    const { error } = await supabase
      .from('contacts')
      .update({
        full_name: contact.full_name,
        address: contact.address,
        phone: contact.phone,
        cep: contact.cep,
        number: contact.number,
        neighborhood: contact.neighborhood,
        complement: contact.complement,
        cpf: contact.cpf,
        accepts_communications: contact.accepts_communications
      })
      .eq('id', profile.contact_id); // Usa o contact_id do perfil para encontrar o registo certo

    if (error) {
      alert("Erro ao atualizar perfil: " + error.message);
    } else {
      alert("Perfil atualizado com sucesso!");
      onProfileUpdate();
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}>
      <div className="cart-modal-content" style={{width: '100%', maxWidth: '700px', height: 'auto'}} onClick={(e) => e.stopPropagation()}>
        <div className="cart-header"><h2>Meu Perfil</h2><button onClick={onClose}>&times;</button></div>
        <div className="cart-body">
          {loading && !contact.full_name ? <p>A carregar...</p> : (
            <form onSubmit={handleSubmit} className="product-form" style={{marginTop: 0, boxShadow: 'none', padding: 0}}>
              <p style={{color: '#6b7280', marginBottom: '1rem'}}>Preencha os seus dados para podermos processar o seu pedido.</p>
              <div className="profile-form-grid">
                <div className="form-group"><label>Nome Completo</label><input type="text" name="full_name" value={contact.full_name || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={contact.cpf || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Telefone</label><input type="text" name="phone" value={contact.phone || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>CEP</label><input type="text" name="cep" value={contact.cep || ''} onChange={handleInputChange} maxLength="8" required /></div>
                <div className="form-group"><label>Morada</label><input type="text" name="address" value={contact.address || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Número</label><input type="text" name="number" value={contact.number || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Bairro</label><input type="text" name="neighborhood" value={contact.neighborhood || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Complemento</label><input type="text" name="complement" value={contact.complement || ''} onChange={handleInputChange} /></div>
              </div>
              <div className="toggle-group">
                  <label htmlFor="accepts_communications">Aceito receber promoções por e-mail e WhatsApp</label>
                  <label className="toggle-switch">
                      <input type="checkbox" name="accepts_communications" id="accepts_communications" checked={contact.accepts_communications} onChange={handleInputChange} />
                      <span className="slider"></span>
                  </label>
              </div>
              <div className="form-actions" style={{justifyContent: 'flex-end'}}>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'A guardar...' : 'Guardar Alterações'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}