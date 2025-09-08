import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';

const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';
const socket = io(backendUrl);

export default function Connection() {
  const [status, setStatus] = useState('Conectando...');
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
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
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('status', onStatus);
      socket.off('qr', onQr);
    };
  }, []);

  return (
    <div className="whatsapp-status-card">
      <h4>Status da Conexão</h4>
      <p className={`status-indicator status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
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

      {status === 'Erro de Conexão' && (
        <p style={{marginTop: '1rem', color: '#991b1b'}}>
          Não foi possível conectar ao servidor do WhatsApp. Verifique se o serviço `whatsapp-backend` está a rodar no seu terminal.
        </p>
      )}
    </div>
  );
}