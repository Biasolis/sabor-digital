import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validateCPF } from '../utils/cpfValidator';

export default function ProfileManagement({ isOpen, onClose, session, onProfileUpdate }) {
  const [profile, setProfile] = useState({ full_name: '', address: '', phone: '', cep: '', number: '', neighborhood: '', complement: '', cpf: '', accepts_communications: false });
  const [loading, setLoading] = useState(false);

  const fetchAddressFromCep = async (cep) => {
    if (cep.length !== 8) return;
    try {
      setLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setProfile(prev => ({ ...prev, address: data.logradouro, neighborhood: data.bairro, }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) console.error("Erro ao buscar perfil:", error);
      else if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [isOpen, session.user.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        setProfile({ ...profile, [name]: checked });
    } else {
        const cleanedValue = name === 'cep' ? value.replace(/\D/g, '') : value;
        setProfile({ ...profile, [name]: cleanedValue });
        if (name === 'cep') {
          fetchAddressFromCep(cleanedValue);
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCPF(profile.cpf)) {
      alert("O CPF inserido não é válido. Por favor, verifique.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name, address: profile.address, phone: profile.phone,
      cep: profile.cep, number: profile.number, neighborhood: profile.neighborhood,
      complement: profile.complement, cpf: profile.cpf,
      accepts_communications: profile.accepts_communications
    }).eq('id', session.user.id);

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
          {loading && !profile.full_name ? <p>A carregar...</p> : (
            <form onSubmit={handleSubmit} className="product-form" style={{marginTop: 0, boxShadow: 'none', padding: 0}}>
              <p style={{color: '#6b7280', marginBottom: '1rem'}}>Preencha os seus dados para podermos processar o seu pedido.</p>
              <div className="profile-form-grid">
                <div className="form-group"><label>Nome Completo</label><input type="text" name="full_name" value={profile.full_name || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={profile.cpf || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Telefone</label><input type="text" name="phone" value={profile.phone || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>CEP</label><input type="text" name="cep" value={profile.cep || ''} onChange={handleInputChange} maxLength="8" required /></div>
                <div className="form-group"><label>Morada</label><input type="text" name="address" value={profile.address || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Número</label><input type="text" name="number" value={profile.number || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Bairro</label><input type="text" name="neighborhood" value={profile.neighborhood || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Complemento</label><input type="text" name="complement" value={profile.complement || ''} onChange={handleInputChange} /></div>
              </div>
              <div className="toggle-group">
                  <label htmlFor="accepts_communications">Aceito receber promoções por e-mail e WhatsApp</label>
                  <label className="toggle-switch">
                      <input type="checkbox" name="accepts_communications" id="accepts_communications" checked={profile.accepts_communications} onChange={handleInputChange} />
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