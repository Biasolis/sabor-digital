import React, { useState, useMemo } from 'react';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function CheckoutModal({ isOpen, onClose, cart, session, storeSettings, onOrderPlaced, profile }) {
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [changeFor, setChangeFor] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.is_on_sale ? item.sale_price : item.price) * item.quantity, 0), [cart]);
  const deliveryFee = deliveryType === 'delivery' ? (storeSettings?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'cash' && changeFor && parseFloat(changeFor) < total) {
      alert("O valor do troco deve ser maior ou igual ao total do pedido.");
      return;
    }
    
    setPlacingOrder(true);

    const orderPayload = {
        order: {
            user_id: session.user.id,
            contact_id: profile.contact_id,
            total_price: total, 
            status: 'pending',
            delivery_type: deliveryType, 
            payment_method: paymentMethod,
            change_for: paymentMethod === 'cash' ? changeFor : null
        },
        items: cart.map(item => ({
            product_id: item.id, 
            quantity: item.quantity, 
            price: item.is_on_sale ? item.sale_price : item.price 
        }))
    };

    try {
        const response = await fetch(`${apiBackendUrl}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Falha ao criar o pedido.");
        }

        alert('Pedido realizado com sucesso!');
        onOrderPlaced();

    } catch (error) {
        alert('Erro ao criar o pedido: ' + error.message);
    } finally {
        setPlacingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}>
      <div className="cart-modal-content" style={{height: 'auto', maxWidth: '500px', borderRadius: '1rem'}} onClick={(e) => e.stopPropagation()}>
        <div className="cart-header"><h2>Finalizar Pedido</h2><button onClick={onClose}>&times;</button></div>
        <div className="cart-body">
          <div className="checkout-options">
            <div className="checkout-section">
              <h4>1. Opção de Entrega</h4>
              <div className="radio-group">
                <label className={`radio-label ${deliveryType === 'delivery' ? 'selected' : ''}`}><input type="radio" name="delivery" value="delivery" checked={deliveryType === 'delivery'} onChange={(e) => setDeliveryType(e.target.value)} /> Entrega</label>
                <label className={`radio-label ${deliveryType === 'pickup' ? 'selected' : ''}`}><input type="radio" name="delivery" value="pickup" checked={deliveryType === 'pickup'} onChange={(e) => setDeliveryType(e.target.value)} /> Retirada</label>
              </div>
            </div>
            <div className="checkout-section">
              <h4>2. Forma de Pagamento</h4>
              <div className="radio-group">
                <label className={`radio-label ${paymentMethod === 'card' ? 'selected' : ''}`}><input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} /> Cartão</label>
                <label className={`radio-label ${paymentMethod === 'cash' ? 'selected' : ''}`}><input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} /> Dinheiro</label>
              </div>
              {paymentMethod === 'cash' && (
                <div className="form-group" style={{marginTop: '1rem'}}>
                  <label>Precisa de troco? Para quanto?</label>
                  <input type="number" placeholder="Ex: 50.00 (opcional)" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="cart-footer">
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Subtotal</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span></div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Frete</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span></div>
          </div>
          <div className="cart-total" style={{marginTop: '1rem'}}><span>Total</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span></div>
          <button onClick={handlePlaceOrder} className="btn btn-customer" disabled={placingOrder}>{placingOrder ? 'A finalizar...' : 'Finalizar Pedido'}</button>
        </div>
      </div>
    </div>
  );
}