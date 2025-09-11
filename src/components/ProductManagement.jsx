import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../contexts/NotificationContext'; // 1. Importar o hook de notificação

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const { addNotification } = useNotification(); // 2. Inicializar o hook

  const [currentProduct, setCurrentProduct] = useState({
    id: null, name: '', description: '', price: '', category_id: '', image_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
        const [productsRes, categoriesRes] = await Promise.all([
            fetch(`${apiBackendUrl}/api/products`),
            fetch(`${apiBackendUrl}/api/categories`),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        setProducts(productsData);
        setCategories(categoriesData);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        addNotification('Erro ao carregar dados do servidor.', 'error'); // 3. Usar notificação para erros
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentProduct({ id: null, name: '', description: '', price: '', category_id: '', image_url: '' });
    setImageFile(null);
    setShowForm(true);
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Tem certeza que deseja apagar este produto?')) {
        try {
            const response = await fetch(`${apiBackendUrl}/api/products/${productId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao apagar produto.');
            addNotification('Produto apagado com sucesso!', 'success'); // 3. Usar notificação para sucesso
            fetchData();
        } catch (error) {
            addNotification('Erro ao apagar produto: ' + error.message, 'error'); // 3. Usar notificação para erros
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    let imageUrl = currentProduct.image_url;

    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);
      
      if (uploadError) {
        addNotification("Erro no upload da imagem: " + uploadError.message, 'error'); // 3. Usar notificação para erros
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      imageUrl = data.publicUrl;
    }
    
    const productData = {
        name: currentProduct.name, 
        description: currentProduct.description, 
        price: currentProduct.price,
        category_id: currentProduct.category_id,
        image_url: imageUrl
    };

    try {
        const url = isEditing ? `${apiBackendUrl}/api/products/${currentProduct.id}` : `${apiBackendUrl}/api/products`;
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });

        if (!response.ok) throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'criar'} produto.`);
        
        addNotification(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success'); // 3. Usar notificação para sucesso
        setShowForm(false);
        fetchData();

    } catch (error) {
        addNotification('Erro ao salvar produto: ' + error.message, 'error'); // 3. Usar notificação para erros
    }
    setUploading(false);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <>
      <div className="page-header">
        <h4>Gerir Produtos</h4>
        {!showForm && <button className="btn btn-primary" onClick={resetForm}>Adicionar Produto</button>}
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3>{isEditing ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="form-group"><label htmlFor="name">Nome do Produto</label><input type="text" name="name" id="name" value={currentProduct.name} onChange={handleInputChange} required /></div>
          <div className="form-group"><label htmlFor="description">Descrição</label><textarea name="description" id="description" value={currentProduct.description} onChange={handleInputChange}></textarea></div>
          <div className="form-group"><label htmlFor="price">Preço</label><input type="number" name="price" id="price" step="0.01" value={currentProduct.price} onChange={handleInputChange} required /></div>
          <div className="form-group"><label htmlFor="category_id">Categoria</label><select name="category_id" id="category_id" value={currentProduct.category_id} onChange={handleInputChange} required><option value="">Selecione uma categoria</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
          <div className="form-group"><label htmlFor="image">Imagem do Produto</label><input type="file" name="image" id="image" onChange={handleImageChange} accept="image/*" /></div>
          <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'A guardar...' : (isEditing ? 'Salvar Alterações' : 'Criar Produto')}</button><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button></div>
        </form>
      )}

      <table className="product-table">
        <thead><tr><th>Nome</th><th>Preço</th><th>Ações</th></tr></thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</td>
              <td className="actions-cell"><button onClick={() => handleEditClick(product)}>Editar</button><button onClick={() => handleDelete(product.id)}>Apagar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}