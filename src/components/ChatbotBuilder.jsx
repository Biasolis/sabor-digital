import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { supabase } from '../lib/supabaseClient';

const backendUrl = import.meta.env.VITE_CHATBOT_BACKEND_URL || 'http://localhost:3002';

// --- Componentes de Nós Customizados ---

// Nó de Condição
const ConditionNode = ({ data }) => {
  return (
    <div style={{ border: '2px solid #7c3aed', borderRadius: '8px', padding: '10px', background: 'white', width: '200px' }}>
      <Handle type="target" position={Position.Top} />
      <div>
        <strong>Condição</strong>
        <p style={{fontSize: '0.8rem', margin: '4px 0 0', color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
          Se `{data.variable}`<br/> {data.operator} <br/>`{data.value}`
        </p>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 15px'}}>
        <span style={{fontSize: '0.8rem'}}>Sim</span>
        <span style={{fontSize: '0.8rem'}}>Não</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} />
    </div>
  );
};

// Nó de Envio de Mensagem
const SendMessageNode = ({ data }) => {
    return (
        <div style={{ border: '1px solid #10b981', borderRadius: '8px', padding: '10px', background: 'white', width: '200px' }}>
            <Handle type="target" position={Position.Top} />
            <div>
                <strong>Enviar Mensagem</strong>
                <p style={{fontSize: '0.8rem', margin: '4px 0 0', color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                    {data.message}
                </p>
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

// Nó de Pergunta
const QuestionNode = ({ data }) => {
    return (
        <div style={{ border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px', background: 'white', width: '200px' }}>
            <Handle type="target" position={Position.Top} />
            <div>
                <strong>Fazer Pergunta</strong>
                <p style={{fontSize: '0.8rem', margin: '4px 0 0', color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                    "{data.question}"
                </p>
                <p style={{fontSize: '0.7rem', margin: '8px 0 0', color: '#888', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                    (Salvar em: `{data.variable}`)
                </p>
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

// Mapeia os tipos de nós para os componentes customizados
const nodeTypes = { 
    condition: ConditionNode,
    sendMessage: SendMessageNode,
    question: QuestionNode
};


// Estilos
const styles = {
  container: { display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem' },
  flowSelector: { display: 'flex', alignItems: 'center', gap: '1rem' },
  flowActions: { display: 'flex', gap: '1rem' },
  builder: { display: 'flex', height: 'calc(100vh - 26rem)', border: '1px solid #e5e7eb', borderRadius: '0.5rem' },
  sidebar: { width: '250px', padding: '1rem', borderRight: '1px solid #e5e7eb', backgroundColor: '#ffffff', overflowY: 'auto' },
  sidebarTitle: { margin: '0 0 1rem 0', fontSize: '1.1rem' },
  nodeItem: { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginBottom: '0.5rem', cursor: 'grab', backgroundColor: '#f9fafb', textAlign: 'center', fontWeight: '500' },
  canvas: { flexGrow: 1, position: 'relative' },
  propertiesPanel: { width: '300px', padding: '1rem', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', overflowY: 'auto' }
};

let idCounter = 0;
const getId = () => `dndnode_${Date.now()}_${idCounter++}`;

const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [flowName, setFlowName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, []);
  
  useEffect(() => {
      const node = nodes.find(n => n.selected);
      setSelectedNode(node || null);
  }, [nodes]);

  const fetchFlows = async () => {
    const { data, error } = await supabase.from('chatbot_flows').select('*').order('created_at');
    if (error) console.error("Erro ao buscar fluxos:", error);
    else setFlows(data || []);
  };

  const handleSelectFlow = async (flowId) => {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) {
        handleNewFlow();
        return;
    }
    setSelectedFlow(flow);
    setFlowName(flow.name);
    setLoading(true);
    
    const { data: nodesData } = await supabase.from('chatbot_nodes').select('*').eq('flow_id', flow.id);
    const { data: edgesData } = await supabase.from('chatbot_edges').select('*').eq('flow_id', flow.id);
    
    setNodes(nodesData.map(n => ({...n, position: n.position || {x:0, y:0}, data: n.data || {}})) || []);
    setEdges(edgesData || []);
    setLoading(false);
  };

  const handleSaveFlow = async () => {
    if (!flowName) {
      alert("Por favor, dê um nome ao fluxo.");
      return;
    }
    if (!selectedFlow) {
        alert("Crie um novo fluxo antes de salvar.");
        return;
    }
    setLoading(true);
    
    try {
        await fetch(`${backendUrl}/flows/${selectedFlow.id}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes, edges })
        });

        // Avisa o backend para recarregar o fluxo, caso ele estivesse ativo
        if (selectedFlow.is_active) {
            await fetch(`${backendUrl}/reload-flow`, { method: 'POST' });
        }

        alert("Fluxo salvo com sucesso!");
    } catch (e) {
        alert("Erro ao salvar o fluxo: " + e.message);
    } finally {
        setLoading(false);
    }
  };
  
  const handleNewFlow = () => {
    setSelectedFlow(null);
    setFlowName('');
    setNodes([]);
    setEdges([]);
  };

  const handleToggleFlowActive = async (flow) => {
    setLoading(true);
    let newStatus = !flow.is_active;

    if (newStatus) {
        await supabase.from('chatbot_flows').update({ is_active: false }).neq('id', flow.id);
    }

    const { error } = await supabase.from('chatbot_flows').update({ is_active: newStatus }).eq('id', flow.id);
    if (error) alert("Erro ao alterar o status do fluxo.");
    
    await fetch(`${backendUrl}/reload-flow`, { method: 'POST' });
    await fetchFlows();
    setLoading(false);
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      let data;
      switch(type) {
          case 'sendMessage':
              data = { label: 'Enviar Mensagem', message: 'Nova mensagem...' };
              break;
          case 'question':
              data = { label: 'Fazer Pergunta', question: 'Qual a sua resposta?', variable: 'resposta_usuario' };
              break;
          case 'condition':
              data = { label: 'Condição', variable: 'resposta_usuario', operator: 'equals', value: 'sim' };
              break;
          default:
              data = { label: type };
      }

      const newNode = { id: getId(), type, position, data };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );
  
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  const onNodeDataChange = (id, field, value) => {
    setNodes((nds) => nds.map(node => {
        if (node.id === id) {
            return { ...node, data: { ...node.data, [field]: value } };
        }
        return node;
    }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.flowSelector}>
            <select onChange={(e) => handleSelectFlow(e.target.value)} value={selectedFlow?.id || ''}>
                <option value="">-- Selecione ou crie um novo fluxo --</option>
                {flows.map(flow => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
            </select>
            <input type="text" value={flowName} onChange={(e) => setFlowName(e.target.value)} placeholder="Nome do Fluxo" style={{width: '250px'}} disabled />
        </div>
        <div style={styles.flowActions}>
            <button onClick={handleNewFlow} className="btn btn-secondary">Limpar Editor</button>
            <button onClick={handleSaveFlow} className="btn btn-primary" disabled={loading || !selectedFlow}>
                {loading ? 'A salvar...' : 'Salvar Fluxo'}
            </button>
        </div>
      </div>
      
      <div className="product-table-wrapper" style={{marginTop: '1rem', maxHeight: '150px', overflowY: 'auto'}}>
        <table className="product-table">
            <thead><tr><th>Fluxos Salvos</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
                {flows.map(flow => (
                    <tr key={flow.id}>
                        <td>{flow.name}</td>
                        <td>
                            <span className={`status-badge ${flow.is_active ? 'delivered' : 'cancelled'}`}>{flow.is_active ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td className="actions-cell">
                            <button onClick={() => handleToggleFlowActive(flow)} disabled={loading}>{flow.is_active ? 'Desativar' : 'Ativar'}</button>
                            <button onClick={() => handleSelectFlow(flow.id)}>Editar</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div style={styles.builder}>
        <aside style={styles.sidebar}>
          <h5 style={styles.sidebarTitle}>Nós</h5>
          <div style={styles.nodeItem} onDragStart={(e) => onDragStart(e, 'sendMessage')} draggable>Enviar Mensagem</div>
          <div style={styles.nodeItem} onDragStart={(e) => onDragStart(e, 'question')} draggable>Fazer Pergunta</div>
          <div style={styles.nodeItem} onDragStart={(e) => onDragStart(e, 'condition')} draggable>Condição</div>
        </aside>
        <main style={styles.canvas} ref={reactFlowWrapper}>
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} fitView nodeTypes={nodeTypes}>
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
        </main>
        {selectedNode && (
            <aside style={styles.propertiesPanel}>
                <h5>Propriedades do Nó: {selectedNode.data.label}</h5>
                <hr />
                {selectedNode.type === 'sendMessage' && (
                    <div className="form-group"><label>Texto da Mensagem</label><textarea value={selectedNode.data.message} onChange={(e) => onNodeDataChange(selectedNode.id, 'message', e.target.value)} rows="5" placeholder="Use {{variavel}} para usar uma variável."></textarea></div>
                )}
                {selectedNode.type === 'question' && (
                    <>
                        <div className="form-group"><label>Texto da Pergunta</label><textarea value={selectedNode.data.question} onChange={(e) => onNodeDataChange(selectedNode.id, 'question', e.target.value)} rows="5"></textarea></div>
                        <div className="form-group"><label>Guardar resposta na variável</label><input type="text" value={selectedNode.data.variable} onChange={(e) => onNodeDataChange(selectedNode.id, 'variable', e.target.value)} /></div>
                    </>
                )}
                {selectedNode.type === 'condition' && (
                    <>
                        <div className="form-group">
                            <label>Variável a ser verificada</label>
                            <input type="text" value={selectedNode.data.variable} onChange={(e) => onNodeDataChange(selectedNode.id, 'variable', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Operador</label>
                            <select value={selectedNode.data.operator} onChange={(e) => onNodeDataChange(selectedNode.id, 'operator', e.target.value)}>
                                <option value="equals">é igual a</option>
                                <option value="contains">contém</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Valor a ser comparado</label>
                            <input type="text" value={selectedNode.data.value} onChange={(e) => onNodeDataChange(selectedNode.id, 'value', e.target.value)} />
                        </div>
                    </>
                )}
            </aside>
        )}
      </div>
    </div>
  );
};

export default function ChatbotBuilder() {
  return (
    <div>
        <h4>Construtor de Chatbot</h4>
        <p>Crie fluxos de conversa automatizados para o seu WhatsApp.</p>
        <ReactFlowProvider>
            <DnDFlow />
        </ReactFlowProvider>
    </div>
  );
}