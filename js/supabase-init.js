/* ================================================================
   VIDEONOW — INICIALIZACIÓN DE SUPABASE
   ================================================================
   ⚠️ BUG COMÚN QUE ESTE ARCHIVO EVITA A PROPÓSITO:
   La librería @supabase/supabase-js, cuando se carga como <script>
   clásico desde CDN, expone un objeto global `window.supabase` que
   contiene la función `createClient`. Si este archivo declarara:

       const supabase = createClient(URL, KEY);

   …estaríamos reasignando el MISMO nombre `supabase` que la librería
   ya usa como su propio namespace global → en algunos navegadores /
   con cierto orden de carga esto dispara:

       Uncaught SyntaxError: Identifier 'supabase' has already been
       declared

   y al fallar esa línea, el resto del script no se ejecuta, así que
   ninguna página puede usar el cliente → "Cannot read properties of
   undefined (reading 'signUp')" en register.html, etc.

   SOLUCIÓN: el cliente inicializado se guarda bajo un nombre propio,
   `VN_SUPABASE`, que nunca choca con el namespace de la librería.
   Todas las páginas deben usar `VN_SUPABASE`, nunca `supabase`
   directamente, para llamar a auth/storage/etc.
   ================================================================ */

const SUPABASE_URL = window.VIDEONOW_ENV?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.VIDEONOW_ENV?.SUPABASE_ANON_KEY || '';

let VN_SUPABASE = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase && typeof window.supabase.createClient === 'function') {
  VN_SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn(
    '[VideoNow] Supabase no está configurado todavía (faltan SUPABASE_URL / SUPABASE_ANON_KEY ' +
    'o no se cargó el script de la librería antes que este archivo). ' +
    'El login/registro seguirá funcionando con el sistema local de js/auth.js ' +
    'hasta que completes la guía en SETUP.md.'
  );
}

/**
 * Indica si Supabase está realmente disponible para usarse.
 * Las páginas deben comprobar esto antes de llamar a VN_SUPABASE.auth.*
 */
function isSupabaseReady() {
  return VN_SUPABASE !== null;
}
