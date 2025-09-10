import React, { useState, useEffect } from 'react';

const backendUrl = import.meta.env.VITE_CHATBOT_BACKEND_URL || 'http://localhost:3002';

const Modal = ({ children, onClose }) => (
    <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}>
        <div className="cart-modal-content" style={{height: 'auto', maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

export default function ChatbotManager() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFlow, setCurrentFlow] = useState(null);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/flows`);
            const data = await response.json();
            setFlows(data);
        } catch (e) {
            console.error("Erro ao buscar fluxos:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFlows();
    }, []);

    const handleOpenModal = (flow = null) => {
        setCurrentFlow(flow);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentFlow(null);
    };

    const handleSaveFlow = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const flowData = {
            name: formData.get('name'),
            description: formData.get('description'),
            is_active: formData.get('is_active') === 'on',
        };

        const method = currentFlow ? 'PUT' : 'POST';
        const endpoint = currentFlow ? `${backendUrl}/flows/${currentFlow.id}` : `${backendUrl}/flows`;

        await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flowData)
        });
        
        handleCloseModal();
        fetchFlows();
    };

    const handleDeleteFlow = async (flowId) => {
        if (window.confirm("Tem a certeza que deseja excluir este chatbot?")) {
            await fetch(`${backendUrl}/flows/${flowId}`, { method: 'DELETE' });
            fetchFlows();
        }
    };
    
    const handleEditFlow = (flowId) => {
        alert(`A abrir o editor para o fluxo ${flowId} (funcionalidade a ser implementada).`);
    };

    return (
        <div>
            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <form onSubmit={handleSaveFlow}>
                        <div className="cart-header">
                            <h2>{currentFlow ? 'Editar Chatbot' : 'Novo Chatbot'}</h2>
                            <button type="button" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <div className="cart-body">
                            <div className="form-group">
                                <label>Nome do Bot</label>
                                <input name="name" type="text" defaultValue={currentFlow?.name} required />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea name="description" defaultValue={currentFlow?.description} rows="3"></textarea>
                            </div>
                             <div className="form-group">
                                <label>Conexão do WhatsApp (a ser implementado)</label>
                                <input type="text" disabled value="Conexão Padrão" />
                            </div>
                            <div className="toggle-group">
                                <label>Ligar/Desligar Bot</label>
                                <label className="toggle-switch">
                                    <input name="is_active" type="checkbox" defaultChecked={currentFlow?.is_active} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                        <div className="cart-footer">
                            <button type="submit" className="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </Modal>
            )}

            <div className="page-header">
                <h4>Gestão de Chatbots</h4>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>Novo Chatbot</button>
            </div>
            <div className="product-table-wrapper">
                <table className="product-table">
                    <thead><tr><th>Nome</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {flows.map(flow => (
                            <tr key={flow.id}>
                                <td>{flow.name}</td>
                                <td><span className={`status-badge ${flow.is_active ? 'delivered' : 'cancelled'}`}>{flow.is_active ? 'Ativo' : 'Inativo'}</span></td>
                                <td className="actions-cell">
                                    <button onClick={() => handleEditFlow(flow.id)}>Editar Fluxo</button>
                                    <button onClick={() => handleOpenModal(flow)}>Configurações</button>
                                    <button onClick={() => handleDeleteFlow(flow.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}