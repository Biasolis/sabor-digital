import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function StoreSettings() {
  const [settings, setSettings] = useState({ store_name: '', store_address: '', phone_number: '', delivery_fee: 0, delivery_time_estimate: '', logo_url: '', primary_color: '#f59e0b', secondary_color: '#4f46e5', show_promotions_section: true });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar configurações:", error);
      } else if (data) {
        setSettings(data);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setUploading(true);
    let logoUrl = settings.logo_url;
    if (logoFile) {
      const fileName = `logo_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile, { upsert: true });
      if (uploadError) { alert("Erro no upload do logótipo: " + uploadError.message); setUploading(false); setLoading(false); return; }
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      logoUrl = data.publicUrl;
    }

    const { error } = await supabase.from('store_settings').upsert({ ...settings, id: 1, logo_url: logoUrl });
    if (error) {
      alert("Erro ao salvar configurações: " + error.message);
    } else {
      alert("Configurações salvas com sucesso! A página será recarregada para aplicar as alterações.");
      window.location.reload();
    }
    setLoading(false); setUploading(false);
  };

  if (loading && !settings.store_name) return <p>A carregar configurações...</p>;

  return (
    <>
      <h4>Informações da Loja</h4>
      <p>Edite os dados e a aparência da sua loja.</p>
      <form onSubmit={handleSubmit} className="product-form" style={{marginTop: '1rem'}}>
        <div className="form-group"><label>Nome da Loja</label><input type="text" name="store_name" value={settings.store_name || ''} onChange={handleInputChange} /></div>
        <div className="form-group"><label>Logótipo</label><input type="file" name="logo" onChange={handleLogoChange} accept="image/*" /></div>
        <div className="form-group"><label>Cor Primária</label><input type="color" name="primary_color" value={settings.primary_color || '#f59e0b'} onChange={handleInputChange} /></div>
        <div className="form-group"><label>Cor Secundária</label><input type="color" name="secondary_color" value={settings.secondary_color || '#4f46e5'} onChange={handleInputChange} /></div>
        <div className="toggle-group" style={{borderTop: 'none', paddingTop: 0}}>
            <label htmlFor="show_promotions_section">Mostrar secção "Promoções"</label>
            <label className="toggle-switch">
                <input type="checkbox" name="show_promotions_section" id="show_promotions_section" checked={settings.show_promotions_section} onChange={handleInputChange} />
                <span className="slider"></span>
            </label>
        </div>
        <hr/>
        <div className="form-group"><label>Morada</label><input type="text" name="store_address" value={settings.store_address || ''} onChange={handleInputChange} /></div>
        <div className="form-group"><label>Telefone</label><input type="text" name="phone_number" value={settings.phone_number || ''} onChange={handleInputChange} /></div>
        <div className="form-group"><label>Valor do Frete (R$)</label><input type="number" step="0.01" name="delivery_fee" value={settings.delivery_fee || 0} onChange={handleInputChange} /></div>
        <div className="form-group"><label>Tempo de Entrega</label><input type="text" name="delivery_time_estimate" value={settings.delivery_time_estimate || ''} onChange={handleInputChange} /></div>
        
        <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'A guardar...' : 'Guardar Alterações'}</button></div>
      </form>
    </>
  );
};
