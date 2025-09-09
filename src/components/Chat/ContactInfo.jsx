import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ContactInfo({ chat, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setProfile(null);
    setFormData({});
    setIsEditing(false);

    const fetchProfile = async () => {
      if (!chat || chat.id.includes('@g.us')) {
        setProfile(null);
        return;
      }
      setLoading(true);
      const phoneNumber = chat.id.split('@')[0];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil:", error);
      } else {
        setProfile(data);
        setFormData(data || { phone: phoneNumber, full_name: chat.display_name || phoneNumber });
      }
      setLoading(false);
    };

    if (chat) {
      fetchProfile();
    }
  }, [chat]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (profile && profile.id) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name, email: formData.email, cpf: formData.cpf,
          address: formData.address, cep: formData.cep, number: formData.number,
        })
        .eq('id', profile.id);

      if (error) {
        alert("Erro ao salvar perfil: " + error.message);
      } else {
        alert("Perfil salvo com sucesso!");
        setProfile(formData);
        setIsEditing(false);
      }
    } else {
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      const phoneNumber = chat.id.split('@')[0];
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email || `${phoneNumber}@internal.sabordigital.app`,
        password: Math.random().toString(36).slice(-12),
        options: { data: { full_name: formData.full_name || chat.display_name || phoneNumber, role: 'customer' } }
      });

      if (adminSession) {
        await supabase.auth.setSession(adminSession);
      }

      if (authError) {
        alert("Erro ao criar utilizador: " + authError.message);
      } else if (authData.user) {
        const { data: newProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            phone: phoneNumber, cpf: formData.cpf, address: formData.address,
            cep: formData.cep, number: formData.number,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          alert("Utilizador criado, mas falha ao salvar detalhes: " + updateError.message);
        } else {
          alert("Cliente criado com sucesso!");
          const { data: refreshedProfile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          setProfile(refreshedProfile);
          setIsEditing(false);
        }
      }
    }
    setLoading(false);
  };

  const FormContent = () => (
    <form onSubmit={handleSave}>
      <div className="form-group"><label>Nome</label><input type="text" name="full_name" value={formData.full_name || ''} onChange={handleInputChange} required /></div>
      <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder={profile ? 'Opcional' : 'Opcional (ou será gerado)'} /></div>
      <div className="form-group"><label>Telefone</label><input type="text" name="phone" value={formData.phone || ''} disabled /></div>
      <div className="form-group"><label>CPF</label><input type="text" name="cpf" value={formData.cpf || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>Endereço</label><input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>Número</label><input type="text" name="number" value={formData.number || ''} onChange={handleInputChange} /></div>
      <div className="form-group"><label>CEP</label><input type="text" name="cep" value={formData.cep || ''} onChange={handleInputChange} /></div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'A salvar...' : 'Salvar'}</button>
        <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
      </div>
    </form>
  );

  if (!chat) return <aside className="contact-info-pane placeholder"><p>Selecione uma conversa para ver os detalhes do contato.</p></aside>;
  if (loading && !profile) return <aside className="contact-info-pane"><p>A carregar dados do contato...</p></aside>;

  return (
    <aside className="contact-info-pane">
      <div className="contact-info-header">
        <h4>{profile ? 'Informações do Cliente' : 'Novo Cliente'}</h4>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>
      <div className="contact-info-body">
        {isEditing ? (
          <FormContent />
        ) : (
          <>
            {profile ? (
              <>
                <div className="contact-details">
                    <p><strong>Nome:</strong> {profile.full_name || 'N/A'}</p>
                    <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
                    <p><strong>Telefone:</strong> {profile.phone || 'N/A'}</p>
                    <p><strong>CPF:</strong> {profile.cpf || 'N/A'}</p>
                    <p><strong>Endereço:</strong> {profile.address ? `${profile.address}, ${profile.number || ''}` : 'N/A'}</p>
                </div>
                <button className="btn-edit-contact" onClick={() => setIsEditing(true)}>Editar Dados</button>
              </>
            ) : (
              <>
                <p>Nenhum perfil de cliente encontrado para este número.</p>
                <button className="btn-edit-contact" onClick={() => setIsEditing(true)}>Criar Cliente</button>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}