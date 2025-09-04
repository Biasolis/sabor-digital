import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*');
    if (error) console.error('Erro ao buscar categorias:', error);
    else setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setCurrentCategory({ ...currentCategory, name: e.target.value });
  };

  const handleNewClick = () => {
    setIsEditing(false);
    setCurrentCategory({ id: null, name: '' });
    setShowForm(true);
  };

  const handleEditClick = (category) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Tem certeza que deseja apagar esta categoria? Isso pode afetar produtos existentes.')) {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) alert('Erro ao apagar categoria: ' + error.message);
      else {
        alert('Categoria apagada com sucesso!');
        fetchData();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let error;

    if (isEditing) {
      ({ error } = await supabase.from('categories').update({ name: currentCategory.name }).eq('id', currentCategory.id));
    } else {
      ({ error } = await supabase.from('categories').insert([{ name: currentCategory.name }]));
    }

    if (error) alert('Erro ao salvar categoria: ' + error.message);
    else {
      alert(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      setShowForm(false);
      fetchData();
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <>
      <div className="page-header">
        <h4>Gerir Categorias</h4>
        {!showForm && <button className="btn btn-primary" onClick={handleNewClick}>Adicionar Categoria</button>}
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <div className="form-group">
            <label htmlFor="name">Nome da Categoria</label>
            <input type="text" name="name" id="name" value={currentCategory.name} onChange={handleInputChange} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar Alterações' : 'Criar Categoria'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <table className="product-table">
        <thead><tr><th>Nome da Categoria</th><th>Ações</th></tr></thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td className="actions-cell">
                <button onClick={() => handleEditClick(cat)}>Editar</button>
                <button onClick={() => handleDelete(cat.id)}>Apagar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}