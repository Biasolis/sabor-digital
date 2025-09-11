import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET store settings
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// UPSERT store settings
router.post('/', async (req, res) => {
    const { data, error } = await supabase.from('store_settings').upsert(req.body).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// UPDATE store status
router.post('/status', async (req, res) => {
    const { is_open } = req.body;
    const updateData = { id: 1, is_open };
    if (is_open) updateData.last_opened_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('store_settings').upsert(updateData).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET whatsapp settings
router.get('/whatsapp', async (req, res) => {
    const { data, error } = await supabase.from('whatsapp_settings').select('*').eq('id', 1).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// UPSERT whatsapp settings
router.post('/whatsapp', async (req, res) => {
    const { error } = await supabase.from('whatsapp_settings').upsert(req.body);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: 'Configuração salva com sucesso.' });
});

export default router;