import React, { useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import ChatbotBuilder from '../ChatbotBuilder';
import './Chat.css';

// 1. O modal agora recebe onSaveFlow, que é a função que realmente salva
export default function ChatbotEditorModal({ flow, onClose, onSaveFlow }) {
    const builderRef = useRef(); // 2. Cria uma ref para acessar o builder

    const handleSave = () => {
        if (builderRef.current) {
            const flowState = builderRef.current.getFlowState(); // 3. Pega o estado do builder
            onSaveFlow(flow.id, flowState); // 4. Chama a função de salvar passando os dados
        }
    };

    return (
        <div className="cart-modal-overlay modal-overlay-centered" style={{ zIndex: 200, padding: 0 }}>
            <div className="cart-modal-content" style={{ maxWidth: '100%', width: '100%', height: '100%', maxHeight: '100%', borderRadius: 0 }}>
                <div className="cart-header">
                    <h2>Editor de Fluxo do Chatbot: {flow.name}</h2>
                    <div>
                        {/* 5. O botão agora chama a função handleSave interna */}
                        <button onClick={handleSave} className="btn btn-primary" style={{marginRight: '1rem'}}>Salvar Fluxo</button>
                        <button onClick={onClose} className="btn btn-secondary">Fechar</button>
                    </div>
                </div>
                <div className="cart-body" style={{ padding: 0, height: '100%' }}>
                    <ReactFlowProvider>
                        {/* 6. A ref é passada para o componente builder */}
                        <ChatbotBuilder ref={builderRef} flowToEdit={flow} />
                    </ReactFlowProvider>
                </div>
            </div>
        </div>
    );
}