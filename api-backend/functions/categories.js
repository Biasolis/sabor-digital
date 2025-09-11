import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET all categories
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST a new category
router.post('/', async (req, res) => {
    const { error } = await supabase.from('categories').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Categoria criada com sucesso!' });
});

// UPDATE a category
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('categories').update(req.body).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Categoria atualizada com sucesso!' });
});

// DELETE a category
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Categoria apagada com sucesso!' });
});


export default router;