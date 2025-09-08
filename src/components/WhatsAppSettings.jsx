import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function WhatsAppSettings() {
  const [settings, setSettings] = useState({ send_order_updates: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        console.error('Erro ao buscar configurações do WhatsApp:', error);
      } else if (data) {
        setSettings(data);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSettingChange = async (settingName, value) => {
    setSettings(prev => ({ ...prev, [settingName]: value }));
    
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert({ id: 1, [settingName]: value });

    if (error) {
      alert('Erro ao salvar configuração: ' + error.message);
    }
  };

  if (loading) {
    return <p>A carregar configurações...</p>;
  }

  return (
    <div>
      <h4>Notificações Automáticas</h4>
      <p>Controle as mensagens que são enviadas automaticamente aos clientes.</p>

      <div className="settings-list">
        <div className="toggle-group">
          <label htmlFor="send_order_updates">
            <strong>Enviar atualizações de status do pedido</strong>
            <p>Notifica o cliente quando o pedido é aceito, sai para entrega, etc.</p>
          </label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              id="send_order_updates" 
              checked={settings.send_order_updates} 
              onChange={(e) => handleSettingChange('send_order_updates', e.target.checked)} 
            />
            <span className="slider"></span>
          </label>
        </div>
        {/* Futuras configurações podem ser adicionadas aqui */}
      </div>
    </div>
  );
}