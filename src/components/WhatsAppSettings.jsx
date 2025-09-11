import React, { useState, useEffect } from 'react';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function WhatsAppSettings() {
  const [settings, setSettings] = useState({ send_order_updates: true, process_group_messages: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
          const response = await fetch(`${apiBackendUrl}/api/settings/whatsapp`);
          if (!response.ok && response.status !== 404) throw new Error("Falha ao buscar configurações do WhatsApp.");
          const data = await response.json();
          if (data) {
              setSettings(data);
          }
      } catch (error) {
          console.error('Erro ao buscar configurações do WhatsApp:', error);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSettingChange = async (settingName, value) => {
    const newSettings = { ...settings, [settingName]: value };
    setSettings(newSettings);
    
    try {
        const response = await fetch(`${apiBackendUrl}/api/settings/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 1, [settingName]: value })
        });
        if (!response.ok) throw new Error("Falha ao salvar configuração.");
    } catch (error) {
        alert('Erro ao salvar configuração: ' + error.message);
    }
  };

  if (loading) {
    return <p>A carregar configurações...</p>;
  }

  return (
    <div>
      <h4>Configurações Gerais</h4>
      <p>Controle o comportamento do seu sistema de atendimento via WhatsApp.</p>

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

        <div className="toggle-group">
          <label htmlFor="process_group_messages">
            <strong>Processar mensagens de grupos</strong>
            <p>Se desativado, o sistema irá ignorar todas as mensagens enviadas em grupos.</p>
          </label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              id="process_group_messages" 
              checked={settings.process_group_messages} 
              onChange={(e) => handleSettingChange('process_group_messages', e.target.checked)} 
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}