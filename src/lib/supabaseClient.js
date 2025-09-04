import { createClient } from '@supabase/supabase-js'

// Acessa as variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exporta o cliente Supabase inicializado
export const supabase = createClient(supabaseUrl, supabaseAnonKey);