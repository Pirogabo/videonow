/* ================================================================
   VIDEONOW — SUPABASE INITIALIZATION
   Lee credenciales de variables de entorno (inyectadas por Vercel)
   NO expongas secretos en el código público
   ================================================================ */

// Las credenciales se inyectan desde Vercel en tiempo de build/runtime
// En desarrollo local, lee de window.__ENV__ (inyectado por un script)
const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || 'https://gutvzkryggxiipjzluev.supabase.co';
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || 'sb_publishable_s0HspuTmlJ5W5X4nr9AknQ_KZlh6zhN';

// Crear cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
console.log('✅ Supabase inicializado:', { url: SUPABASE_URL });

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth event:', event, session?.user?.email);
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    Auth.login({ email: session.user.email, name: session.user.user_metadata?.name || session.user.email.split('@')[0] });
  } else if (event === 'SIGNED_OUT') {
    Auth.logout();
  }
});
