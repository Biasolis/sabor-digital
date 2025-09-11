import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

const router = Router();

// ROTA ADICIONADA: GET open orders (pending or accepted)
router.get('/open', async (req, res) => {
    const { data: settings } = await supabase.from('store_settings').select('last_opened_at').eq('id', 1).single();
    let query = supabase
      .from('orders')
      .select(`*, contacts ( * ), order_items ( *, products ( * ) )`)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });
    
    if (settings?.last_opened_at) {
        query = query.gte('created_at', settings.last_opened_at);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ROTA ADICIONADA: GET kitchen orders (accepted)
router.get('/kitchen', async (req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(*, products(name))`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ROTA ADICIONADA: GET all orders for the day
router.get('/allday', async (req, res) => {
    const { data: settings } = await supabase.from('store_settings').select('last_opened_at').eq('id', 1).single();
    let query = supabase.from('orders').select(`*, contacts ( full_name )`).order('created_at', { ascending: false });
    if (settings?.last_opened_at) {
        query = query.gte('created_at', settings.last_opened_at);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ROTA ADICIONADA: GET orders for a specific user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(name))`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ROTA ADICIONADA: GET orders for reports by period
router.get('/report', async (req, res) => {
    const { period } = req.query; // 'day', 'week', 'month'
    const today = new Date();
    let startDate = new Date();
    const endDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const { data: allOrders, error } = await supabase
      .from('orders')
      .select('*, contacts(*), order_items(*, products(name))')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
      
    if (error) return res.status(500).json({ error: error.message });
    
    // Calcula o resumo
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    const revenue = deliveredOrders.reduce((sum, order) => sum + order.total_price, 0);
    const orderCount = deliveredOrders.length;
    const productCount = deliveredOrders.flatMap(o => o.order_items).reduce((acc, item) => {
        if (item.products) {
            acc[item.products.name] = (acc[item.products.name] || 0) + item.quantity;
        }
        return acc;
    }, {});
    const topProducts = Object.entries(productCount).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, quantity]) => ({ name, quantity }));

    res.json({ allOrders, summary: { revenue, orderCount, topProducts } });
});


// POST a new order
router.post('/', async (req, res) => {
    const { order, items } = req.body;
    
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

    if (orderError) return res.status(500).json({ error: orderError.message });
    
    const orderItems = items.map(item => ({ ...item, order_id: orderData.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
        // Tenta apagar o pedido criado se os itens falharem
        await supabase.from('orders').delete().eq('id', orderData.id);
        return res.status(500).json({ error: itemsError.message });
    }

    res.status(201).json({ message: 'Pedido criado com sucesso!', order: orderData });
});

// UPDATE order status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

export default router;