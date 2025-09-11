import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';
const whatsappBackendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL || 'http://localhost:3001';


// Esta função agora vive no backend. Vamos chamar a API.
async function sendWhatsAppPromotion(promotion, token) {
    if (!window.confirm(`Tem a certeza que deseja enviar esta promoção para todos os clientes elegíveis?`)) return;

    try {
        const response = await fetch(`${whatsappBackendUrl}/notify/promotion`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ promotion }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Falha ao iniciar envio.');
        alert(result.message);
    } catch (error) {
        console.error("Falha ao acionar a notificação de promoção:", error);
        alert("Erro ao enviar promoção: " + error.message);
    }
}


// Secção para gerir Produtos em Promoção
const ProductSales = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBackendUrl}/api/products`);
            if (!response.ok) throw new Error("Falha ao buscar produtos.");
            const data = await response.json();
            setProducts(data);
        } catch(error) {
            console.error("Erro ao buscar produtos:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);
    
    const handleToggleSale = async (product) => {
        const isCurrentlyOnSale = product.is_on_sale;
        if (!isCurrentlyOnSale && (!product.sale_price || product.sale_price <= 0)) {
            alert("Por favor, defina um preço promocional válido antes de ativar a promoção.");
            return;
        }
        
        try {
            const response = await fetch(`${apiBackendUrl}/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_on_sale: !isCurrentlyOnSale })
            });
            if (!response.ok) throw new Error("Falha ao atualizar promoção.");
            fetchProducts();
        } catch (error) {
            alert("Erro ao atualizar promoção: " + error.message);
        }
    };

    const handleSalePriceChange = async (productId, newPrice) => {
        try {
            const response = await fetch(`${apiBackendUrl}/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sale_price: newPrice === '' ? null : parseFloat(newPrice) })
            });
            if (!response.ok) throw new Error("Falha ao atualizar preço.");
            setProducts(products.map(p => p.id === productId ? {...p, sale_price: newPrice} : p));
        } catch (error) {
            alert("Erro ao atualizar preço: " + error.message);
        }
    };
    
    const handleSendPromo = async (product) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Sessão inválida. Por favor, faça login novamente.");
            return;
        }
        await sendWhatsAppPromotion(product, session.access_token);
    };

    if (loading) return <p>A carregar produtos...</p>;

    return (
        <>
            <h4>Produtos em Promoção</h4>
            <p>Ative promoções para produtos específicos e defina um preço com desconto.</p>
            <div className="product-table-wrapper">
                <table className="product-table">
                    <thead><tr><th>Produto</th><th>Preço Original</th><th>Preço Promocional</th><th>Promoção Ativa?</th><th>Ações</th></tr></thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</td>
                                <td>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="Ex: 19.90"
                                        defaultValue={product.sale_price || ''}
                                        onBlur={(e) => handleSalePriceChange(product.id, e.target.value)}
                                        style={{maxWidth: '120px'}}
                                    />
                                </td>
                                <td>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={product.is_on_sale} onChange={() => handleToggleSale(product)} />
                                        <span className="slider"></span>
                                    </label>
                                </td>
                                 <td className="actions-cell">
                                    {product.is_on_sale && <button onClick={() => handleSendPromo(product)}>Enviar via WhatsApp</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// Secção para gerir Banners Promocionais
const BannerSales = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newPromo, setNewPromo] = useState({ title: '', imageFile: null });

  const fetchPromotions = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiBackendUrl}/api/promotions`);
        if (!response.ok) throw new Error("Falha ao buscar banners.");
        const data = await response.json();
        setPromotions(data);
    } catch(error) {
        console.error("Erro ao buscar promoções:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewPromo({ ...newPromo, imageFile: e.target.files[0] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newPromo.imageFile) {
      alert("Por favor, selecione uma imagem para o banner.");
      return;
    }
    setUploading(true);
    let imageUrl = '';
    try {
        const fileName = `banner_${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from('promotion-banners').upload(fileName, newPromo.imageFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('promotion-banners').getPublicUrl(fileName);
        imageUrl = publicUrl;

        const response = await fetch(`${apiBackendUrl}/api/promotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newPromo.title, image_url: imageUrl })
        });
        if (!response.ok) throw new Error("Falha ao salvar o banner no banco de dados.");

        alert("Promoção adicionada com sucesso!");
        setNewPromo({ title: '', imageFile: null });
        document.getElementById('image-file-input').value = "";
        fetchPromotions();
    } catch (error) {
        alert("Erro: " + error.message);
    }
    setUploading(false);
  };
  
  const handleDelete = async (promo) => {
    if (window.confirm("Tem a certeza que deseja apagar este banner?")) {
        try {
            const fileName = promo.image_url.split('/').pop();
            const { error: storageError } = await supabase.storage.from('promotion-banners').remove([fileName]);
            if(storageError) throw storageError;

            const response = await fetch(`${apiBackendUrl}/api/promotions/${promo.id}`, { method: 'DELETE' });
            if(!response.ok) throw new Error("Falha ao apagar o registro do banner.");

            alert("Promoção apagada com sucesso!"); 
            fetchPromotions();
        } catch (error) {
            alert("Erro ao apagar banner: " + error.message);
        }
    }
  };

  const toggleActive = async (promo) => {
    try {
        const response = await fetch(`${apiBackendUrl}/api/promotions/${promo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !promo.is_active })
        });
        if (!response.ok) throw new Error("Falha ao alterar o estado do banner.");
        fetchPromotions();
    } catch(error) {
        alert("Erro ao alterar o estado: " + error.message);
    }
  };
  
  const handleSendPromo = async (promotion) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Sessão inválida. Por favor, faça login novamente.");
        return;
    }
    await sendWhatsAppPromotion(promotion, session.access_token);
  };

  return (
    <>
      <h4 style={{marginTop: '2rem'}}>Banners Promocionais</h4>
      <p>Faça o upload de banners para exibir no topo do cardápio.</p>
      
      <form onSubmit={handleUpload} className="product-form">
        <h3>Adicionar Novo Banner</h3>
        <div className="form-group"><label>Título (para controlo interno)</label><input type="text" value={newPromo.title} onChange={(e) => setNewPromo({...newPromo, title: e.target.value})} /></div>
        <div className="form-group"><label>Imagem do Banner</label><input type="file" id="image-file-input" onChange={handleFileChange} accept="image/*" required /></div>
        <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'A enviar...' : 'Adicionar Banner'}</button></div>
      </form>

      <table className="product-table">
        <thead><tr><th>Banner</th><th>Título</th><th>Estado</th><th>Ações</th></tr></thead>
        <tbody>
          {promotions.map(promo => (
            <tr key={promo.id}>
              <td><img src={promo.image_url} alt={promo.title} style={{width: '150px', height: 'auto', borderRadius: '0.5rem'}} /></td>
              <td>{promo.title}</td>
              <td>
                <button onClick={() => toggleActive(promo)} className={`btn ${promo.is_active ? 'btn-customer' : 'btn-secondary'}`}>
                    {promo.is_active ? 'Ativo' : 'Inativo'}
                </button>
              </td>
              <td className="actions-cell">
                  {promo.is_active && <button onClick={() => handleSendPromo(promo)}>Enviar via WhatsApp</button>}
                  <button onClick={() => handleDelete(promo)}>Apagar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};


// Componente principal que une os dois
export default function PromotionManagement() {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div className="admin-content">
            <div className="page-header"><h2>Gestão de Promoções</h2></div>
            <div className="submenu-nav">
                <button onClick={() => setActiveTab('products')} className={`submenu-btn ${activeTab === 'products' ? 'active' : ''}`}>Produtos em Promoção</button>
                <button onClick={() => setActiveTab('banners')} className={`submenu-btn ${activeTab === 'banners' ? 'active' : ''}`}>Banners</button>
            </div>
            {activeTab === 'products' ? <ProductSales /> : <BannerSales />}
        </div>
    );
}