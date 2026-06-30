# Configurar variables de entorno en Vercel

Este sitio es **estático puro** (sin Next.js, sin Vite, sin build de un framework). Por eso configurar las "Environment Variables" en el dashboard de Vercel **no basta por sí solo** — necesitas el paso extra que ya está preparado en este repo.

## Cómo funciona aquí

1. `vercel.json` define:
   ```json
   "buildCommand": "node scripts/generate-env.js"
   ```
2. Ese script lee `process.env.SUPABASE_URL` y `process.env.SUPABASE_ANON_KEY` (las que pongas en el dashboard de Vercel) y genera `js/env.js` con ese contenido, **en cada deploy**.
3. `js/env.js` define `window.VIDEONOW_ENV`, que `js/supabase-init.js` lee para crear el cliente de Supabase (guardado como `VN_SUPABASE`, nunca como `supabase` — ver el comentario al principio de ese archivo para el porqué).

## Pasos en el dashboard de Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Añade:
   | Key | Value | Environments |
   |---|---|---|
   | `SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Production, Preview, Development |
   | `SUPABASE_ANON_KEY` | tu anon/public key de Supabase | Production, Preview, Development |
3. **No añadas `SUPABASE_SERVICE_ROLE_KEY` aquí** — esa clave nunca debe llegar al navegador. Si en el futuro necesitas lógica de servidor (Edge Functions de Vercel), va en variables separadas que esas funciones leen server-side, no en este flujo de build estático.
4. Redeploy (Vercel → Deployments → "..." → Redeploy) para que el build vuelva a correr `generate-env.js` con las variables nuevas.

## Cómo verificar que funcionó

Abre la consola del navegador en tu sitio desplegado y ejecuta:
```js
console.log(window.VIDEONOW_ENV);
```
Deberías ver tu URL y anon key (no vacías). Si `isSupabaseReady()` devuelve `false`, revisa:
- Que las variables estén bien escritas (sin espacios, sin comillas extra).
- Que hayas hecho un redeploy *después* de guardarlas (los deploys viejos no las tienen).
- Los logs de build en Vercel — busca la línea `[generate-env] ...`.

## Desarrollo local

No necesitas Vercel para desarrollar localmente:

```bash
cp js/env.example.js js/env.js
# Edita js/env.js con tus valores reales
```

`js/env.js` ya está en `.gitignore`, así que nunca se commitea por accidente.

## Sobre el bug `Identifier 'supabase' has already been declared`

Si ves este error, significa que en algún sitio del código se está haciendo:
```js
const supabase = createClient(...);
```
La librería `@supabase/supabase-js` cargada por `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` ya ocupa el nombre global `supabase` (es `window.supabase.createClient`). Declarar `const supabase = ...` por encima choca con eso.

**Solución ya aplicada en este repo:** el cliente se guarda como `VN_SUPABASE` (ver `js/supabase-init.js`). Si añades código nuevo que necesite Supabase, usa siempre `VN_SUPABASE`, nunca declares tu propia variable `supabase`.
