/* ================================================================
   VIDEONOW — SUPABASE INITIALIZATION
   Configura el cliente de Supabase con credenciales reales.
   ================================================================ */

const SUPABASE_URL = 'https://gutvzkryggxiipjzluev.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_s0HspuTmlJ5W5X4nr9AknQ_KZlh6zhN';

// Crear cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
console.log('✅ Supabase inicializado:', { url: SUPABASE_URL });
