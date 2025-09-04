import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

async function sendWhatsAppPromotion(promotion) {
    const { data: settings } = await supabase.from('store_settings').select('whatsapp_instance_name, whatsapp_promo_template').eq('id', 1).single();
    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
    const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey || !settings?.whatsapp_instance_name) {
        return alert("As configurações da API do WhatsApp não foram encontradas ou estão incompletas.");
    }
    
    const { data: customers, error } = await supabase.from('profiles').select('phone, full_name').eq('accepts_communications', true).not('phone', 'is', null);
    if (error) return alert("Erro ao buscar clientes: " + error.message);
    if (!customers || customers.length === 0) return alert("Nenhum cliente com permissão para receber mensagens foi encontrado.");

    if (!window.confirm(`Tem a certeza que deseja enviar esta promoção para ${customers.length} cliente(s)?`)) return;

    alert(`A iniciar o envio da promoção. Verifique a consola do navegador para o progresso.`);
    
    for(const customer of customers) {
        let message = (settings.whatsapp_promo_template || 'Olá {cliente}! Nova promoção imperdível: *{promocao}*!')
            .replace('{cliente}', customer.full_name)
            .replace('{promocao}', promotion.name || promotion.title)
            .replace('{preco_promocional}', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(promotion.sale_price));
        
        console.log(`SIMULANDO ENVIO PROMO para ${customer.phone}: "${message}"`);
    }
    alert("Envio de promoções (simulado) concluído!");
}


// Secção para gerir Produtos em Promoção
const ProductSales = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) console.error("Erro ao buscar produtos:", error);
        else setProducts(data);
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
        
        const { error } = await supabase.from('products')
            .update({ is_on_sale: !isCurrentlyOnSale })
            .eq('id', product.id);
        
        if(error) alert("Erro ao atualizar promoção: " + error.message);
        else fetchProducts();
    };

    const handleSalePriceChange = async (productId, newPrice) => {
        const { error } = await supabase.from('products')
            .update({ sale_price: newPrice === '' ? null : parseFloat(newPrice) })
            .eq('id', productId);
        
        if(error) alert("Erro ao atualizar preço: " + error.message);
        else {
            setProducts(products.map(p => p.id === productId ? {...p, sale_price: newPrice} : p));
        }
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
                                    {product.is_on_sale && <button onClick={() => sendWhatsAppPromotion(product)}>Enviar via WhatsApp</button>}
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
    const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) console.error("Erro ao buscar promoções:", error);
    else setPromotions(data);
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
    const fileName = `banner_${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('promotion-banners').upload(fileName, newPromo.imageFile);
    if (uploadError) {
      alert("Erro no upload do banner: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('promotion-banners').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('promotions').insert({ title: newPromo.title, image_url: publicUrl });
    if (dbError) {
      alert("Erro ao salvar promoção: " + dbError.message);
    } else {
      alert("Promoção adicionada com sucesso!");
      setNewPromo({ title: '', imageFile: null });
      document.getElementById('image-file-input').value = "";
      fetchPromotions();
    }
    setUploading(false);
  };
  
  const handleDelete = async (promo) => {
    if (window.confirm("Tem a certeza que deseja apagar este banner?")) {
        const fileName = promo.image_url.split('/').pop();
        const { error: storageError } = await supabase.storage.from('promotion-banners').remove([fileName]);
        if(storageError) { alert("Erro ao apagar imagem do armazenamento: " + storageError.message); return; }

        const { error: dbError } = await supabase.from('promotions').delete().eq('id', promo.id);
        if(dbError) { alert("Erro ao apagar registo da promoção: " + dbError.message); }
        else { alert("Promoção apagada com sucesso!"); fetchPromotions(); }
    }
  };

  const toggleActive = async (promo) => {
      const { error } = await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
      if(error) { alert("Erro ao alterar o estado: " + error.message); }
      else { fetchPromotions(); }
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
                  {promo.is_active && <button onClick={() => sendWhatsAppPromotion(promo)}>Enviar via WhatsApp</button>}
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