import React, { useState, useEffect } from 'react';
import ChatbotEditorModal from './Chat/ChatbotEditorModal';
import { useNotification } from '../contexts/NotificationContext';

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';
const chatbotBackendUrl = import.meta.env.VITE_CHATBOT_BACKEND_URL || 'http://localhost:3002';

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
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentFlow, setCurrentFlow] = useState(null);
    const { addNotification } = useNotification();

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBackendUrl}/api/flows`);
            if (!response.ok) throw new Error("Falha ao buscar fluxos.");
            const data = await response.json();
            setFlows(data);
        } catch (e) {
            addNotification("Erro ao buscar fluxos: " + e.message, 'error');
        }
        setLoading(false);
    };

    useEffect(() => { fetchFlows(); }, []);

    const handleOpenModal = (flow = null) => { setCurrentFlow(flow); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setCurrentFlow(null); };
    const handleOpenEditor = (flow) => { setCurrentFlow(flow); setIsEditorOpen(true); };
    const handleCloseEditor = () => { setIsEditorOpen(false); setCurrentFlow(null); };

    const handleSaveFlowSettings = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const flowData = { name: formData.get('name'), description: formData.get('description'), is_active: formData.get('is_active') === 'on' };
        const method = currentFlow?.id ? 'PUT' : 'POST';
        const endpoint = currentFlow?.id ? `${apiBackendUrl}/api/flows/${currentFlow.id}` : `${apiBackendUrl}/api/flows`;

        try {
            const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flowData) });
            if (!response.ok) throw new Error("Falha ao salvar configurações do fluxo.");
            addNotification("Configurações salvas com sucesso!", 'success');
            handleCloseModal();
            fetchFlows();
        } catch(e) {
            addNotification(e.message, 'error');
        }
    };
    
    const handleSaveFlowStructure = async (flowId, flowState) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBackendUrl}/api/flows/${flowId}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flowState)
            });
            if (!response.ok) throw new Error("Falha ao salvar a estrutura do fluxo.");

            const current = flows.find(f => f.id === flowId);
            if (current?.is_active) {
                await fetch(`${chatbotBackendUrl}/reload-flow`, { method: 'POST' });
            }

            addNotification("Fluxo salvo com sucesso!", 'success');
            handleCloseEditor();
        } catch (e) {
            addNotification("Erro ao salvar o fluxo: " + e.message, 'error');
        }
        setLoading(false);
    };

    const handleDeleteFlow = async (flowId) => {
        if (window.confirm("Tem a certeza que deseja excluir este chatbot?")) {
            try {
                const response = await fetch(`${apiBackendUrl}/api/flows/${flowId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error("Falha ao excluir o fluxo.");
                addNotification("Fluxo excluído com sucesso.", 'success');
                fetchFlows();
            } catch(e) {
                addNotification(e.message, 'error');
            }
        }
    };
    
    return (
        <div>
            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <form onSubmit={handleSaveFlowSettings}>
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
            
            {isEditorOpen && (
                <ChatbotEditorModal 
                    flow={currentFlow}
                    onClose={handleCloseEditor}
                    onSaveFlow={handleSaveFlowStructure}
                />
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
                                    <button onClick={() => handleOpenEditor(flow)}>Editar Fluxo</button>
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