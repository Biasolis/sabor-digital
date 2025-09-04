import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function WhatsAppIntegration() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Lê as credenciais seguras do ambiente
  const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
  const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('store_settings').select('whatsapp_instance_name, whatsapp_status_template, whatsapp_promo_template').eq('id', 1).single();
    if (data) setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };
  
  const handleSave = async () => {
    const { error } = await supabase.from('store_settings').upsert({ 
        id: 1,
        whatsapp_instance_name: settings.whatsapp_instance_name,
        whatsapp_status_template: settings.whatsapp_status_template,
        whatsapp_promo_template: settings.whatsapp_promo_template
     });
    if (error) alert("Erro ao guardar configurações: " + error.message);
    else alert("Configurações guardadas com sucesso!");
  };

  const createInstanceAndConnect = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !settings.whatsapp_instance_name) {
        alert("As variáveis de ambiente da Evolution API (URL e Chave) e o Nome da Instância precisam de estar preenchidos.");
        return;
    }
    setActionLoading(true);
    setQrCode('');
    
    // Passo 1: Tenta criar a instância. Ignoramos erros aqui, pois ela pode já existir.
    try {
        await fetch(`${evolutionApiUrl}/instance/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
            body: JSON.stringify({ instanceName: settings.whatsapp_instance_name, qrcode: true })
        });
    } catch (e) {
        console.warn("Não foi possível criar a instância (pode já existir). A tentar conectar...", e.message);
    }
    
    // Passo 2: Tenta conectar e obter o QR Code ou o estado.
    try {
        const response = await fetch(`${evolutionApiUrl}/instance/connect/${settings.whatsapp_instance_name}`, {
            method: 'GET',
            headers: { 'apikey': evolutionApiKey },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`A API retornou um erro: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Verifica as propriedades de forma segura
        if (data && data.base64) {
            setQrCode(data.base64);
        } else if (data && data.instance && data.instance.state === 'open') {
             alert("A instância já está conectada e pronta para uso!");
        } else if (data && data.instance && data.instance.state === 'connecting') {
            alert("A instância está a conectar. Por favor, aguarde e tente verificar o estado mais tarde.");
        } else {
            console.error("Resposta inesperada da API:", data);
            alert("Não foi possível obter o QR Code. Verifique o estado da sua instância no painel da Evolution API.");
        }
    } catch (e) {
        alert(`Erro ao conectar. Verifique os dados, a configuração de CORS no seu servidor e a API. Detalhe: ${e.message}`);
    }
    setActionLoading(false);
  };
  
  return (
    <>
        <h4>Conexão com WhatsApp</h4>
        <p>Gira a sua instância da Evolution API para enviar notificações.</p>
        <div className="product-form" style={{marginTop: '1rem'}}>
            <div className="form-group"><label>Nome da Instância</label><input type="text" name="whatsapp_instance_name" value={settings.whatsapp_instance_name || ''} onChange={handleInputChange} /></div>
            <div className="form-actions">
                <button onClick={handleSave} className="btn btn-secondary" disabled={actionLoading}>Guardar Nome</button>
                <button onClick={createInstanceAndConnect} className="btn btn-primary" disabled={actionLoading}>{actionLoading ? 'Aguarde...' : 'Criar e Conectar'}</button>
            </div>
            {qrCode && (
                <div style={{textAlign: 'center', marginTop: '1rem'}}>
                    <p>Leia o QR Code com o seu WhatsApp para conectar:</p>
                    <img src={`data:image/jpeg;base64,${qrCode}`} alt="QR Code do WhatsApp" style={{width: '250px', height: '250px'}}/>
                </div>
            )}
        </div>

        <h4 style={{marginTop: '2rem'}}>Modelos de Mensagem</h4>
        <p>Use variáveis como {"{cliente}"}, {"{pedido}"}, {"{status}"}, etc.</p>
        <div className="product-form" style={{marginTop: '1rem'}}>
            <div className="form-group"><label>Atualização de Pedido</label><textarea name="whatsapp_status_template" rows="3" value={settings.whatsapp_status_template || ''} onChange={handleInputChange}></textarea></div>
            <div className="form-group"><label>Mensagem de Promoção</label><textarea name="whatsapp_promo_template" rows="3" value={settings.whatsapp_promo_template || ''} onChange={handleInputChange}></textarea></div>
            <div className="form-actions">
                <button onClick={handleSave} className="btn btn-primary">Guardar Modelos</button>
            </div>
        </div>
    </>
  );
}