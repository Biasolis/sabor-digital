import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET all products
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST a new product
router.post('/', async (req, res) => {
    const { error } = await supabase.from('products').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Produto criado com sucesso!' });
});

// UPDATE a product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('products').update(req.body).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produto atualizado com sucesso!' });
});

// DELETE a product
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produto apagado com sucesso!' });
});

export default router;