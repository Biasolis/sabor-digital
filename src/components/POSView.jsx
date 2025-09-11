import React, { useState, useEffect, useMemo } from 'react';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function POSView({ session }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [identifier, setIdentifier] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
            fetch(`${apiBackendUrl}/api/products`),
            fetch(`${apiBackendUrl}/api/categories`)
        ]);
        if (productsResponse.ok) setProducts(await productsResponse.json());
        if (categoriesResponse.ok) setCategories(await categoriesResponse.json());
      } catch (error) {
          console.error("Erro ao buscar dados para o PDV:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddToOrder = (product) => {
    setCurrentOrder(prevOrder => {
      const existing = prevOrder.find(item => item.id === product.id);
      if (existing) {
        return prevOrder.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevOrder, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromOrder = (productId) => {
    setCurrentOrder(prevOrder => prevOrder.filter(item => item.id !== productId));
  };

  const total = useMemo(() => currentOrder.reduce((sum, item) => sum + (item.is_on_sale ? item.sale_price : item.price) * item.quantity, 0), [currentOrder]);

  const handleFinalizeOrder = async () => {
    if (currentOrder.length === 0) {
      alert("Adicione pelo menos um item ao pedido.");
      return;
    }
    if (!identifier) {
      alert("Por favor, insira o nome do cliente ou o número da mesa.");
      return;
    }
    
    setPlacingOrder(true);

    const orderPayload = {
        order: {
            user_id: session.user.id,
            total_price: total,
            status: 'accepted',
            delivery_type: 'in_person',
            payment_method: 'pending',
            payment_status: 'pending',
            in_person_identifier: identifier
        },
        items: currentOrder.map(item => ({
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
        if (!response.ok) throw new Error("Falha ao criar o pedido no PDV.");

        alert(`Pedido para "${identifier}" criado com sucesso!`);
        setCurrentOrder([]);
        setIdentifier('');
    } catch (error) {
        alert('Erro ao criar pedido: ' + error.message);
    }
    setPlacingOrder(false);
  };
  
  const filteredProducts = products
    .filter(p => selectedCategory ? p.category_id === selectedCategory : true)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pos-view">
      <main className="pos-menu">
        <div className="search-container">
            <input 
                type="text" 
                placeholder="Pesquisar produto..." 
                className="search-input" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="category-filters" style={{marginBottom: '1rem'}}>
            <button onClick={() => setSelectedCategory(null)} className={`category-btn ${selectedCategory === null ? 'active' : ''}`}>Todos</button>
            {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}>{cat.name}</button>
            ))}
        </div>
        {loading ? <p>A carregar cardápio...</p> : (
          <div className="pos-products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="pos-product-card" onClick={() => handleAddToOrder(product)}>
                <div className="item-image-placeholder" style={{height: '6rem', backgroundImage: `url(${product.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>{!product.image_url && 'Imagem'}</div>
                <h5>{product.name}</h5>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.is_on_sale ? product.sale_price : product.price)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      <aside className="pos-order">
        <div className="pos-order-header form-group">
            <label>Nome do Cliente / Nº da Mesa</label>
            <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </div>
        <div className="pos-order-body">
            {currentOrder.length === 0 ? <p style={{textAlign: 'center', color: '#6b7280'}}>Nenhum item adicionado.</p> : 
                currentOrder.map(item => (
                    <div key={item.id} className="cart-item">
                        <div className="cart-item-details">
                            <h4>{item.name}</h4>
                            <div className="cart-item-actions">
                                <span>Qtd: {item.quantity}</span>
                                <button style={{color: '#dc2626', fontSize: '0.8rem'}} onClick={() => handleRemoveFromOrder(item.id)}>Remover</button>
                            </div>
                        </div>
                        <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.is_on_sale ? item.sale_price : item.price) * item.quantity)}</p>
                    </div>
                ))
            }
        </div>
        <div className="pos-order-footer">
            <div className="cart-total">
                <span>Total</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
            </div>
            <button className="btn btn-primary" onClick={handleFinalizeOrder} disabled={placingOrder}>
                {placingOrder ? 'A finalizar...' : 'Finalizar Pedido'}
            </button>
        </div>
      </aside>
    </div>
  );
}