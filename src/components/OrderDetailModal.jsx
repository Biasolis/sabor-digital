import React from 'react';
import { supabase } from '../lib/supabaseClient';

async function sendWhatsAppStatusUpdate(order) {
    const { data: settings } = await supabase.from('store_settings').select('whatsapp_instance_name, whatsapp_status_template').eq('id', 1).single();
    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey || !settings?.whatsapp_instance_name || !order.profiles?.phone || !order.profiles.accepts_communications) {
        console.log("Notificação de WhatsApp não enviada (faltam configurações, permissão ou telefone).");
        return;
    }
    
    let message = (settings.whatsapp_status_template || 'Olá {cliente}! O estado do seu pedido #{pedido} foi atualizado para: *{status}*.')
        .replace('{cliente}', order.profiles.full_name)
        .replace('{pedido}', order.id)
        .replace('{status}', order.status);

    console.log(`SIMULANDO ENVIO WHATSAPP para ${order.profiles.phone}: "${message}"`);
}

export default function OrderDetailModal({ isOpen, onClose, order, onStatusChange }) {
  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus) => {
    const { data, error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id).select('*, profiles(*)').single();
    if (error) {
      alert("Erro ao atualizar status: " + error.message);
    } else {
      onStatusChange();
      onClose();
      sendWhatsAppStatusUpdate(data);
    }
  };

  return (
    <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}>
      <div className="cart-modal-content" style={{height: 'auto', maxWidth: '700px', borderRadius: '1rem'}} onClick={(e) => e.stopPropagation()}>
        <div className="cart-header"><h2>Detalhes do Pedido #{order.id}</h2><button onClick={onClose}>&times;</button></div>
        <div className="cart-body">
          <div className="order-detail-grid">
            <div className="order-detail-section"><h4>Cliente</h4><p><strong>Nome:</strong> {order.profiles?.full_name || order.in_person_identifier || 'N/A'}</p><p><strong>Telefone:</strong> {order.profiles?.phone || 'Não informado'}</p><p><strong>CPF:</strong> {order.profiles?.cpf || 'Não informado'}</p><p><strong>Morada:</strong> {order.profiles?.address ? `${order.profiles.address}, ${order.profiles.number}` : 'Retirada no local'}</p></div>
            <div className="order-detail-section"><h4>Pedido</h4><p><strong>Tipo:</strong> {order.delivery_type === 'delivery' ? 'Entrega' : (order.delivery_type === 'pickup' ? 'Retirada' : 'No Local')}</p><p><strong>Pagamento:</strong> {order.payment_method}</p>{order.change_for && <p><strong>Troco para:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.change_for)}</p>}<p><strong>Data:</strong> {new Date(order.created_at).toLocaleString('pt-PT')}</p></div>
          </div>
          <div className="order-detail-section" style={{marginTop: '2rem'}}>
            <h4>Itens do Pedido</h4>
            <table className="order-detail-items-table">
              <thead><tr><th>Qtd.</th><th>Produto</th><th>Preço Unit.</th></tr></thead>
              <tbody>{order.order_items?.map(item => (<tr key={item.id}><td>{item.quantity}x</td><td>{item.products?.name || 'Produto Removido'}</td><td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</td></tr>))}</tbody>
            </table>
             <p style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem'}}>Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)}</p>
          </div>
        </div>
        <div className="cart-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>Alterar Estado:</span>
            <div className='actions-cell'>
                <select className="status-select" defaultValue={order.status} onChange={(e) => handleStatusChange(e.target.value)}>
                  <option value="pending">Pendente</option>
                  <option value="accepted">Em Preparo</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
            </div>
        </div>
      </div>
    </div>
  );
}