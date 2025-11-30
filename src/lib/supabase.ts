import { createClient } from '@supabase/supabase-js';

// Estas variables deben estar en .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('products').select('count');
    if (error) throw error;
    console.log('✅ Supabase conectado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error);
    return false;
  }
};
