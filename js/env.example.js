/* ================================================================
   VIDEONOW — CONFIGURACIÓN LOCAL (NO SUBIR CON VALORES REALES)
   ================================================================
   Este proyecto es un sitio 100% estático (HTML/CSS/JS sin build
   step). Eso significa que las "Environment Variables" que configures
   en el dashboard de Vercel NO se inyectan automáticamente en el
   HTML — eso solo pasa en frameworks con build (Next.js, Vite, etc.).

   Por eso este archivo existe: aquí van la URL y la anon key de tu
   proyecto Supabase, como variables JS normales. Es seguro tenerlas
   aquí porque:

     - La "anon key" de Supabase ESTÁ DISEÑADA para ir en el cliente.
       Por sí sola no da acceso a nada — cada tabla está protegida
       por Row Level Security (ver SETUP.md). No es un secreto.

     - La "service_role key" NUNCA debe ir aquí ni en ningún archivo
       que termine en el navegador. Esa sí es secreta de verdad.

   Pasos:
   1. Copia este archivo como `js/env.js` (sin el .example).
   2. Sustituye los valores de abajo por los de tu proyecto
      (Supabase → Settings → API).
   3. `js/env.js` ya está en .gitignore — no se subirá a GitHub,
      así cada persona que clone el repo pone sus propias claves.
   4. Incluye <script src="js/env.js"></script> ANTES de
      <script src="js/supabase-init.js"> en cada página que lo
      necesite (login.html, register.html, watch.html para subidas...).
   ================================================================ */

window.VIDEONOW_ENV = {
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'TU-ANON-KEY-AQUI',
};
