/**
 * VIDEONOW — Generador de js/env.js en build time (Vercel)
 *
 * Este proyecto es HTML/CSS/JS estático puro, sin framework de build.
 * Vercel no inyecta "Environment Variables" del dashboard en archivos
 * estáticos automáticamente — eso solo ocurre con frameworks (Next.js,
 * Vite, etc.) que las leen vía proceso de build.
 *
 * Por eso este script actúa como un "build" mínimo: Vercel lo ejecuta
 * (ver "buildCommand" en vercel.json) y simplemente escribe js/env.js
 * con los valores que hayas puesto en:
 *   Vercel → tu proyecto → Settings → Environment Variables
 *     - SUPABASE_URL
 *     - SUPABASE_ANON_KEY
 *
 * En local, NO necesitas ejecutar esto: copia js/env.example.js como
 * js/env.js y pon tus valores a mano (ver ese archivo para más detalle).
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[generate-env] Aviso: SUPABASE_URL o SUPABASE_ANON_KEY no están definidas ' +
    'en las Environment Variables de Vercel. El sitio se desplegará igual, pero ' +
    'login/registro con Supabase no funcionará hasta que las configures y ' +
    'vuelvas a desplegar. Ver SETUP.md y VERCEL_ENV_SETUP.md.'
  );
}

const content = `/* Generado automáticamente en build time por scripts/generate-env.js — no editar a mano. */
window.VIDEONOW_ENV = {
  SUPABASE_URL: ${JSON.stringify(SUPABASE_URL)},
  SUPABASE_ANON_KEY: ${JSON.stringify(SUPABASE_ANON_KEY)},
};
`;

const outPath = path.join(__dirname, '..', 'js', 'env.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[generate-env] js/env.js generado correctamente.');
