import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// --- Configuração do Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Key are required. Check your .env file.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3002;

// --- LÓGICA DO CHATBOT ---
let activeFlow = null;
const userStates = new Map(); // Guarda o estado: { chatId: { currentNodeId, variables: {} } }

const loadActiveFlow = async () => {
    console.log("A carregar fluxo de chatbot ativo...");
    const { data: flow, error } = await supabase
        .from('chatbot_flows')
        .select('*, nodes:chatbot_nodes(*), edges:chatbot_edges(*)')
        .eq('is_active', true)
        .maybeSingle();

    if (error) console.error("Erro ao carregar fluxo:", error);
    
    if (flow) {
        console.log(`Fluxo "${flow.name}" carregado com sucesso.`);
        activeFlow = flow;
    } else {
        console.log("Nenhum fluxo de chatbot ativo encontrado.");
        activeFlow = null;
    }
};

app.post('/process-message', async (req, res) => {
    const { chatId, messageBody } = req.body;
    if (!activeFlow) return res.json({ replies: [] });

    let state = userStates.get(chatId) || { currentNodeId: null, variables: {} };
    let replies = [];
    let currentNodeId;

    if (!state.currentNodeId) {
        const startNode = activeFlow.nodes.find(n => n.type === 'start');
        if (!startNode) return res.json({ replies: [] });
        currentNodeId = startNode.id;
        state.currentNodeId = startNode.id;
    } else {
        const previousNode = activeFlow.nodes.find(n => n.id === state.currentNodeId);
        if (previousNode && previousNode.type === 'question') {
            const variableName = previousNode.data?.variable || 'last_reply';
            state.variables[variableName] = messageBody.trim();
        }
        
        let nextEdge;
        if (previousNode && previousNode.type === 'condition') {
            const { variable, operator, value } = previousNode.data;
            const variableValue = state.variables[variable] || '';
            let conditionResult = false;

            if (operator === 'equals') conditionResult = variableValue.toLowerCase() === value.toLowerCase();
            else if (operator === 'contains') conditionResult = variableValue.toLowerCase().includes(value.toLowerCase());
            
            const sourceHandle = conditionResult ? 'true' : 'false';
            nextEdge = activeFlow.edges.find(e => e.source_node_id === state.currentNodeId && e.source_handle === sourceHandle);
        } else {
            nextEdge = activeFlow.edges.find(e => e.source_node_id === state.currentNodeId);
        }
        
        if (nextEdge) {
            currentNodeId = nextEdge.target_node_id;
        } else {
            userStates.delete(chatId);
            return res.json({ replies: [] });
        }
    }

    let keepProcessing = true;
    while (keepProcessing) {
        const currentNode = activeFlow.nodes.find(n => n.id === currentNodeId);
        if (!currentNode) {
            userStates.delete(chatId);
            keepProcessing = false;
            continue;
        }

        let nextEdge;
        switch (currentNode.type) {
            case 'sendMessage': {
                let messageToSend = currentNode.data?.message || '';
                for (const key in state.variables) {
                    messageToSend = messageToSend.replace(new RegExp(`{{${key}}}`, 'g'), state.variables[key]);
                }
                replies.push({ type: 'text', content: messageToSend });
                nextEdge = activeFlow.edges.find(e => e.source_node_id === currentNodeId);
                break;
            }
            case 'question': {
                let questionToSend = currentNode.data?.question || '';
                for (const key in state.variables) {
                    questionToSend = questionToSend.replace(new RegExp(`{{${key}}}`, 'g'), state.variables[key]);
                }
                replies.push({ type: 'text', content: questionToSend });
                state.currentNodeId = currentNode.id;
                keepProcessing = false; 
                break;
            }
            case 'condition': {
                const { variable, operator, value } = currentNode.data;
                const variableValue = state.variables[variable] || '';
                let conditionResult = false;
                if (operator === 'equals') conditionResult = variableValue.toLowerCase() === value.toLowerCase();
                else if (operator === 'contains') conditionResult = variableValue.toLowerCase().includes(value.toLowerCase());
                
                const sourceHandle = conditionResult ? 'true' : 'false';
                nextEdge = activeFlow.edges.find(e => e.source_node_id === currentNodeId && e.source_handle === sourceHandle);
                break;
            }
        }
        
        if (keepProcessing) {
            if (nextEdge) {
                currentNodeId = nextEdge.target_node_id;
                state.currentNodeId = currentNodeId;
            } else {
                userStates.delete(chatId);
                keepProcessing = false;
            }
        }
    }

    if (userStates.has(chatId) || (replies.length > 0 && state.currentNodeId)) {
        userStates.set(chatId, state);
    }
    
    res.json({ replies });
});

app.post('/reload-flow', (req, res) => {
    loadActiveFlow();
    res.status(200).json({ message: 'Fluxo recarregado com sucesso.' });
});

// --- ROTAS CRUD PARA GERIR OS FLUXOS ---
app.get('/flows', async (req, res) => {
    try {
        const { data, error } = await supabase.from('chatbot_flows').select('*').order('created_at');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/flows', async (req, res) => {
    try {
        const { name, description, is_active } = req.body;
        const { data, error } = await supabase.from('chatbot_flows').insert({ name, description, is_active }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/flows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;
        const { data, error } = await supabase.from('chatbot_flows').update({ name, description, is_active, updated_at: new Date() }).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/flows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('chatbot_flows').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ message: 'Fluxo excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/flows/:id/save', async (req, res) => {
    try {
        const { id: flow_id } = req.params;
        const { nodes, edges } = req.body;

        await supabase.from('chatbot_edges').delete().eq('flow_id', flow_id);
        await supabase.from('chatbot_nodes').delete().eq('flow_id', flow_id);

        if (nodes && nodes.length > 0) {
            const nodesToInsert = nodes.map(({ selected, ...node }) => ({ flow_id, ...node }));
            await supabase.from('chatbot_nodes').insert(nodesToInsert);
        }
        if (edges && edges.length > 0) {
            const edgesToInsert = edges.map(({ selected, ...edge }) => ({ flow_id, source_handle: edge.sourceHandle, target_handle: edge.targetHandle, ...edge }));
            await supabase.from('chatbot_edges').insert(edgesToInsert);
        }

        res.status(200).json({ message: 'Estrutura do fluxo salva com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
  loadActiveFlow();
  console.log(`Servidor do Chatbot rodando na porta ${port}`);
});