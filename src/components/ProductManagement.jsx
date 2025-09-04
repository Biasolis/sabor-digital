import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  
  const [currentProduct, setCurrentProduct] = useState({
    id: null, name: '', description: '', price: '', category_id: '', image_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: productsData, error: productsError } = await supabase.from('products').select('*');
    if (productsError) console.error('Erro ao buscar produtos:', productsError);
    else setProducts(productsData);

    const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*');
    if (categoriesError) console.error('Erro ao buscar categorias:', categoriesError);
    else setCategories(categoriesData);
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
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) alert('Erro ao apagar produto:', error.message);
      else {
        alert('Produto apagado com sucesso!');
        fetchData();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    let imageUrl = currentProduct.image_url;

    // Se um novo arquivo de imagem foi selecionado, faz o upload
    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);
      
      if (uploadError) {
        alert("Erro no upload da imagem: " + uploadError.message);
        setUploading(false);
        return;
      }

      // Obtém o URL público da imagem
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      imageUrl = data.publicUrl;
    }
    
    // Prepara os dados do produto para salvar no banco de dados
    const productData = {
        name: currentProduct.name, 
        description: currentProduct.description, 
        price: currentProduct.price,
        category_id: currentProduct.category_id,
        image_url: imageUrl // Usa o novo URL ou o antigo
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('products').update(productData).eq('id', currentProduct.id));
    } else {
      ({ error } = await supabase.from('products').insert([productData]));
    }

    if (error) {
      alert('Erro ao salvar produto: ' + error.message);
    } else {
      alert(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      setShowForm(false);
      fetchData();
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