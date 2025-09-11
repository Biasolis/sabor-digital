import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET all flows
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('chatbot_flows').select('*').order('created_at');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET A ESTRUTURA (NÓS E ARESTAS) DE UM FLUXO ESPECÍFICO - ROTA ADICIONADA
router.get('/:id/structure', async (req, res) => {
    try {
        const { id: flow_id } = req.params;
        const { data: nodesData, error: nodesError } = await supabase.from('chatbot_nodes').select('*').eq('flow_id', flow_id);
        if (nodesError) throw nodesError;

        const { data: edgesData, error: edgesError } = await supabase.from('chatbot_edges').select('*').eq('flow_id', flow_id);
        if (edgesError) throw edgesError;
        
        res.status(200).json({ nodes: nodesData || [], edges: edgesData || [] });

    } catch (error) {
        console.error('Get flow structure error:', error);
        res.status(500).json({ error: error.message });
    }
});


// POST a new flow
router.post('/', async (req, res) => {
    try {
        const { name, description, is_active } = req.body;
        const { data, error } = await supabase.from('chatbot_flows').insert({ name, description, is_active }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE a flow
router.put('/:id', async (req, res) => {
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

// DELETE a flow
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('chatbot_flows').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ message: 'Fluxo excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST to save the structure (nodes and edges) of a flow
router.post('/:id/save', async (req, res) => {
    try {
        const { id: flow_id } = req.params;
        const { nodes, edges } = req.body;

        await supabase.from('chatbot_edges').delete().eq('flow_id', flow_id);
        await supabase.from('chatbot_nodes').delete().eq('flow_id', flow_id);

        if (nodes && nodes.length > 0) {
            const nodesToInsert = nodes.map(({ selected, dragging, ...node }) => ({
                id: node.id,
                flow_id: flow_id,
                type: node.type,
                data: node.data,
                position: node.position
            }));
            const { error: nodeError } = await supabase.from('chatbot_nodes').insert(nodesToInsert);
            if (nodeError) throw nodeError;
        }

        if (edges && edges.length > 0) {
            const edgesToInsert = edges.map(({ selected, ...edge }) => ({
                id: edge.id,
                flow_id: flow_id,
                source_node_id: edge.source,
                target_node_id: edge.target,
                source_handle: edge.sourceHandle,
                target_handle: edge.targetHandle
            }));
            const { error: edgeError } = await supabase.from('chatbot_edges').insert(edgesToInsert);
            if (edgeError) throw edgeError;
        }

        res.status(200).json({ message: 'Estrutura do fluxo salva com sucesso.' });
    } catch (error) {
        console.error('Save flow error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;