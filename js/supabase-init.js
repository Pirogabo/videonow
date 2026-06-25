/* ================================================================
   VIDEONOW — SUPABASE INITIALIZATION
   Lee credenciales de variables de entorno (inyectadas por Vercel)
   NO expongas secretos en el código público
   ================================================================ */

// Las credenciales se inyectan desde Vercel en tiempo de build/runtime
// En desarrollo local, lee de window.__ENV__ (inyectado por un script)
window.SUPABASE_URL = window.__ENV__?.SUPABASE_URL || 'https://gutvzkryggxiipjzluev.supabase.co';
window.SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || 'sb_publishable_s0HspuTmlJ5W5X4nr9AknQ_KZlh6zhN';

// Crear cliente de Supabase globalmente para evitar conflictos de scope
// Verificar si el cliente Supabase ya está inicializado
if (!window.__supabaseClient) {
  // window.supabase.createClient viene de @supabase/supabase-js (debe estar importado)
  if (window.supabase?.createClient) {
    window.__supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    console.log('✅ Supabase inicializado:', { url: window.SUPABASE_URL });
  } else {
    console.error('❌ Supabase JS client not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
  }
}

// Escuchar cambios de autenticación
if (window.__supabaseClient) {
  window.__supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth event:', event, session?.user?.email);
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      Auth.login({ email: session.user.email, name: session.user.user_metadata?.name || session.user.email.split('@')[0] });
    } else if (event === 'SIGNED_OUT') {
      Auth.logout();
    }
  });
}
