import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET all promotions
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET only active promotions
router.get('/active', async (req, res) => {
    const { data, error } = await supabase.from('promotions').select('*').eq('is_active', true);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST a new promotion
router.post('/', async (req, res) => {
    const { error } = await supabase.from('promotions').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Promoção adicionada com sucesso!' });
});

// UPDATE a promotion
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('promotions').update(req.body).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Promoção atualizada com sucesso!' });
});

// DELETE a promotion
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Promoção apagada com sucesso!' });
});

export default router;