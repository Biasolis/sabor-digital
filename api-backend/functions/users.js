import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// GET team users
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, contacts(email, full_name)')
    .in('role', ['admin', 'caixa', 'garcom', 'cozinha']);
  
  if (error) return res.status(500).json({ error: error.message });
  
  // Formata os dados para o frontend
  const formattedUsers = data.map(u => ({
      id: u.id,
      email: u.contacts.email,
      full_name: u.contacts.full_name,
      role: u.role
  }));

  res.json(formattedUsers);
});

// UPDATE user role
router.put('/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const { error: adminError } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: { role: role }
    });
    const { error: profileError } = await supabase.from('profiles').update({ role: role }).eq('id', id);

    if (adminError || profileError) {
        return res.status(500).json({ error: adminError?.message || profileError?.message });
    }
    res.json({ message: 'Função atualizada com sucesso!' });
});

// INVITE a new user
router.post('/invite', async (req, res) => {
    const { email, role } = req.body;
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: role, full_name: `Funcionário ${email.split('@')[0]}` }
    });

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Convite enviado com sucesso!' });
});

export default router;