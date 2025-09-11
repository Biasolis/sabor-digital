import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext'; // 1. Importar o hook

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '' });
  const { addNotification } = useNotification(); // 2. Inicializar o hook

  const fetchData = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiBackendUrl}/api/categories`);
        if (!response.ok) throw new Error('Falha ao buscar categorias');
        const data = await response.json();
        setCategories(data);
    } catch(error) {
        console.error('Erro ao buscar categorias:', error);
        addNotification('Erro ao buscar categorias: ' + error.message, 'error'); // 3. Usar em caso de erro
    }
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
        try {
            const response = await fetch(`${apiBackendUrl}/api/categories/${categoryId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao apagar categoria.');
            addNotification('Categoria apagada com sucesso!', 'success'); // 3. Usar em caso de sucesso
            fetchData();
        } catch (error) {
            addNotification('Erro ao apagar categoria: ' + error.message, 'error'); // 3. Usar em caso de erro
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const url = isEditing ? `${apiBackendUrl}/api/categories/${currentCategory.id}` : `${apiBackendUrl}/api/categories`;
        const method = isEditing ? 'PUT' : 'POST';
        const body = JSON.stringify({ name: currentCategory.name });

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        if (!response.ok) throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'criar'} categoria.`);
        
        addNotification(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, 'success'); // 3. Usar em caso de sucesso
        setShowForm(false);
        fetchData();

    } catch (error) {
        addNotification('Erro ao salvar categoria: ' + error.message, 'error'); // 3. Usar em caso de erro
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