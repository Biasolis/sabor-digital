import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importa as rotas
import productRoutes from './functions/products.js';
import categoryRoutes from './functions/categories.js';
import orderRoutes from './functions/orders.js';
import customerRoutes from './functions/customers.js';
import promotionRoutes from './functions/promotions.js';
import settingRoutes from './functions/settings.js';
import userRoutes from './functions/users.js';
import flowRoutes from './functions/flows.js'; // <-- Linha adicionada

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3003;

// Middleware para logar as requisições (opcional, mas útil para debug)
app.use((req, res, next) => {
  console.log(`[API Backend] Recebida requisição: ${req.method} ${req.url}`);
  next();
});

// Define as rotas da API
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flows', flowRoutes); // <-- Linha adicionada


app.listen(port, () => {
  console.log(`Servidor da API rodando na porta ${port}`);
});