import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// A URL do seu backend local
const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

export default function StoreSettings({ onSettingsUpdate }) {
  const [settings, setSettings] = useState({ store_name: '', store_address: '', phone_number: '', delivery_fee: 0, delivery_time_estimate: '', logo_url: '', primary_color: '#f59e0b', secondary_color: '#4f46e5', show_promotions_section: true, is_open: false });
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

  const handleStoreStatusToggle = async (newStatus) => {
    const optimisticSettings = { ...settings, is_open: newStatus };
    setSettings(optimisticSettings);

    try {
      // Pega a sessão atual para obter o token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Utilizador não autenticado.");

      const response = await fetch(`${backendUrl}/update-store-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_open: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao comunicar com o backend.');
      }

      onSettingsUpdate(result);

    } catch (error) {
      alert("Erro ao alterar o status da loja: " + error.message);
      setSettings(prev => ({ ...prev, is_open: !newStatus }));
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
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      logoUrl = urlData.publicUrl;
    }

    const { is_open, last_opened_at, ...savableSettings } = settings;

    const { data, error } = await supabase.from('store_settings').upsert({ ...savableSettings, id: 1, logo_url: logoUrl }).select().single();
    if (error) {
      alert("Erro ao salvar configurações: " + error.message);
    } else {
      alert("Configurações salvas com sucesso!");
      onSettingsUpdate(data);
    }
    setLoading(false); setUploading(false);
  };

  if (loading && !settings.store_name) return <p>A carregar configurações...</p>;

  return (
    <>
      <div className="product-form" style={{marginTop: 0, boxShadow: 'none', padding: 0}}>
        <div className="toggle-group" style={{padding: '1.5rem', backgroundColor: settings.is_open ? '#ecfdf5' : '#fef2f2', border: `1px solid ${settings.is_open ? '#16a34a' : '#ef4444'}`, borderRadius: '0.75rem'}}>
            <label htmlFor="store_status">
                <strong style={{fontSize: '1.2rem', color: settings.is_open ? '#15803d' : '#b91c1c'}}>
                    A loja está {settings.is_open ? 'Aberta' : 'Fechada'}
                </strong>
                <p>Use este interruptor para abrir a loja e começar a receber novos pedidos, ou para fechar e pausar as operações.</p>
            </label>
            <label className="toggle-switch">
                <input type="checkbox" name="is_open" id="store_status" checked={settings.is_open} onChange={(e) => handleStoreStatusToggle(e.target.checked)} />
                <span className="slider"></span>
            </label>
        </div>
      </div>
      <hr style={{margin: '2rem 0'}} />
      <h4>Informações da Loja</h4>
      <p>Edite os dados e a aparência da sua loja.</p>
      <form onSubmit={handleSubmit} className="product-form" style={{marginTop: '1rem'}}>
        {/* O resto do formulário continua igual... */}
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