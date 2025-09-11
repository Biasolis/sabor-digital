import { createClient } from '@supabase/supabase-js'

// Acessa as variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exporta o cliente Supabase inicializado
// O frontend agora só precisa da anon key para autenticação.
// As operações de dados serão feitas pelo backend com a service key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);