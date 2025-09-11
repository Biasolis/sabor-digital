import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
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

const apiBackendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:3003';

// --- Nós Customizados (sem alterações) ---
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

const nodeTypes = { condition: ConditionNode, sendMessage: SendMessageNode, question: QuestionNode };


// --- Estilos ---
const styles = {
  builder: { display: 'flex', height: '100%', border: '1px solid #e5e7eb', borderRadius: '0.5rem' },
  sidebar: { width: '250px', padding: '1rem', borderRight: '1px solid #e5e7eb', backgroundColor: '#ffffff', overflowY: 'auto' },
  sidebarTitle: { margin: '0 0 1rem 0', fontSize: '1.1rem' },
  nodeItem: { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginBottom: '0.5rem', cursor: 'grab', backgroundColor: '#f9fafb', textAlign: 'center', fontWeight: '500' },
  canvas: { flexGrow: 1, position: 'relative' },
  propertiesPanel: { width: '300px', padding: '1rem', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', overflowY: 'auto' }
};

let idCounter = 0;
const getId = () => `dndnode_${Date.now()}_${idCounter++}`;

const ChatbotBuilder = forwardRef(({ flowToEdit }, ref) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useImperativeHandle(ref, () => ({
    getFlowState: () => {
      return { nodes, edges };
    },
  }));
  
  useEffect(() => {
      const node = nodes.find(n => n.selected);
      setSelectedNode(node || null);
  }, [nodes]);

  useEffect(() => {
    if (flowToEdit) {
        const loadFlow = async () => {
            try {
                const response = await fetch(`${apiBackendUrl}/api/flows/${flowToEdit.id}/structure`);
                if (!response.ok) throw new Error("Falha ao carregar a estrutura do fluxo.");
                const data = await response.json();
                
                const reactFlowNodes = data.nodes.map(n => ({...n, position: n.position || {x:0, y:0}, data: n.data || {}}));
                const reactFlowEdges = data.edges.map(e => ({
                    id: e.id,
                    source: e.source_node_id,
                    target: e.target_node_id,
                    sourceHandle: e.source_handle,
                    targetHandle: e.target_handle
                }));

                setNodes(reactFlowNodes);
                setEdges(reactFlowEdges);
            } catch (error) {
                console.error("Erro ao carregar fluxo:", error);
                // Opcional: Adicionar uma notificação de erro aqui
            }
        }
        loadFlow();
    }
  }, [flowToEdit, setNodes, setEdges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      let data;
      switch(type) {
          case 'sendMessage': data = { label: 'Enviar Mensagem', message: 'Nova mensagem...' }; break;
          case 'question': data = { label: 'Fazer Pergunta', question: 'Qual a sua resposta?', variable: 'resposta_usuario' }; break;
          case 'condition': data = { label: 'Condição', variable: 'resposta_usuario', operator: 'equals', value: 'sim' }; break;
          default: data = { label: type };
      }

      const newNode = { id: getId(), type, position, data };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
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
  );
});

export default ChatbotBuilder;