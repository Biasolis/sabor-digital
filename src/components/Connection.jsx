import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';

const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

export default function Connection() {
  const [status, setStatus] = useState('Desconectado'); // O estado inicial agora é 'Desconectado'
  const [qrCode, setQrCode] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  useEffect(() => {
    const socket = io(backendUrl);

    const onConnect = () => {
      console.log('Conectado ao servidor de WhatsApp via Socket.IO');
      socket.emit('get-status');
    };

    const onConnectError = (err) => {
      console.error('Falha na conexão com o Socket.IO:', err);
      setStatus('Erro de Conexão');
    };

    const onStatus = (newStatus) => {
      setStatus(newStatus.status);
      if (newStatus.status === 'Conectado') {
        setQrCode('');
      }
    };

    const onQr = (qr) => {
      setStatus('Aguardando leitura do QR Code');
      setQrCode(qr);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('status', onStatus);
    socket.on('qr', onQr);

    return () => {
      console.log('A desligar listeners do Socket.IO...');
      socket.disconnect();
    };
  }, []);

  const handleConnect = async () => {
    setIsActionLoading(true);
    setStatus('Conectando...');
    try {
      await fetch(`${backendUrl}/connect`, { method: 'POST' });
    } catch (error) {
      console.error("Erro ao tentar conectar:", error);
      setStatus('Erro de Conexão');
    }
    setIsActionLoading(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem a certeza que deseja desconectar a sessão do WhatsApp?')) return;
    setIsActionLoading(true);
    try {
      await fetch(`${backendUrl}/disconnect`, { method: 'POST' });
    } catch (error) {
      console.error("Erro ao tentar desconectar:", error);
      setStatus('Erro de Conexão');
    }
    setIsActionLoading(false);
  };

  return (
    <div className="whatsapp-status-card">
      <h4>Status da Conexão</h4>
      <p className={`status-indicator status-${status.toLowerCase().replace(/[\s()]/g, '-')}`}>
        {status}
      </p>
      
      {qrCode && (
        <div className="qr-code-container">
          <p>Escaneie o código abaixo com seu celular em WhatsApp &gt; Aparelhos Conectados:</p>
          <div style={{ background: 'white', padding: '16px', display: 'inline-block', borderRadius: '8px' }}>
            <QRCode value={qrCode} />
          </div>
        </div>
      )}

      <div className="connection-actions">
        {status === 'Desconectado' && (
          <button className="btn btn-primary" onClick={handleConnect} disabled={isActionLoading}>
            {isActionLoading ? 'A iniciar...' : 'Conectar WhatsApp'}
          </button>
        )}
        {status === 'Conectado' && (
          <button className="btn btn-secondary" onClick={handleDisconnect} disabled={isActionLoading}>
            {isActionLoading ? 'A desconectar...' : 'Desconectar'}
          </button>
        )}
      </div>

      {status === 'Erro de Conexão' && (
        <p style={{marginTop: '1rem', color: '#991b1b'}}>
          Não foi possível conectar ao servidor do WhatsApp. Verifique se o serviço `whatsapp-backend` está a rodar.
        </p>
      )}
    </div>
  );
}