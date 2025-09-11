import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET all customers
router.get('/', async (req, res) => {
  const { data, error } = await supabase
      .from('profiles')
      .select('*, contacts(*)')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
      
  if (error) return res.status(500).json({ error: error.message });

  const formattedCustomers = data.map(p => ({
    id: p.id,
    contact_id: p.contact_id,
    email: p.contacts?.email,
    ...p.contacts
  }));
  res.json(formattedCustomers);
});

// UPDATE a customer
router.put('/:contact_id', async (req, res) => {
    const { contact_id } = req.params;
    const { error } = await supabase
        .from('contacts')
        .update(req.body)
        .eq('id', contact_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Cliente atualizado com sucesso!' });
});

// DELETE a customer (user)
router.delete('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { error } = await supabase.auth.admin.deleteUser(user_id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Cliente apagado com sucesso!' });
});


export default router;