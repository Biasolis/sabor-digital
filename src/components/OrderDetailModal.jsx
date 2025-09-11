import React from 'react';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';
const whatsappBackendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';

async function triggerWhatsAppStatusUpdate(orderId, token) {
    try {
        await fetch(`${whatsappBackendUrl}/notify/order-update`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId }),
        });
    } catch (error) {
        console.error("Falha ao acionar a notificação de status:", error);
    }
}

export default function OrderDetailModal({ isOpen, onClose, order, onStatusChange }) {
  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus) => {
    try {
        const response = await fetch(`${apiBackendUrl}/api/orders/${order.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Falha ao atualizar status.");
        }
        
        const data = await response.json();
        onStatusChange(); 
        onClose(); 
        
        // Aciona a notificação através do backend do WhatsApp
        if (data) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                triggerWhatsAppStatusUpdate(data.id, session.access_token);
            }
        }
    } catch (error) {
        alert("Erro ao atualizar status: " + error.message);
    }
  };

  return (
    <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}>
      <div className="cart-modal-content" style={{height: 'auto', maxWidth: '700px', borderRadius: '1rem'}} onClick={(e) => e.stopPropagation()}>
        <div className="cart-header"><h2>Detalhes do Pedido #{order.id}</h2><button onClick={onClose}>&times;</button></div>
        <div className="cart-body">
          <div className="order-detail-grid">
            <div className="order-detail-section"><h4>Cliente</h4><p><strong>Nome:</strong> {order.contacts?.full_name || order.in_person_identifier || 'N/A'}</p><p><strong>Telefone:</strong> {order.contacts?.phone || 'Não informado'}</p><p><strong>CPF:</strong> {order.contacts?.cpf || 'Não informado'}</p><p><strong>Morada:</strong> {order.contacts?.address ? `${order.contacts.address}, ${order.contacts.number}` : 'Retirada no local'}</p></div>
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
                  <option value="ready">Pronto</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
            </div>
        </div>
      </div>
    </div>
  );
}