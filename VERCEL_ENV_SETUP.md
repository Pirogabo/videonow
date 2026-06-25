# Seguridad en VideoNow

## Variables de Entorno

Los secretos (API keys) deben estar en **Vercel**, NO en el código.

### Cómo funciona:

1. **En Vercel:** Defines variables de entorno (SUPABASE_URL, SUPABASE_ANON_KEY).
2. **En el build:** Vercel inyecta esas variables en tu HTML como `window.__ENV__`.
3. **En el navegador:** `js/supabase-init.js` las lee desde `window.__ENV__`.
4. **En GitHub:** El código es público pero los secretos NO aparecen.

### Paso a paso en Vercel (abajo)

---

## 🔐 Paso a paso: Configurar variables en Vercel

### 1. Ve a tu proyecto en Vercel

- https://vercel.com/dashboard
- Selecciona **videonow**

### 2. Settings → Environment Variables

- Clic en **Settings** (arriba de la página).
- En el menú izquierdo: **Environment Variables**.

### 3. Añade las variables

Clic en **Add New** y crea estas dos:

| Name | Value | Environments |
|------|-------|--------------|
| `SUPABASE_URL` | `https://gutvzkryggxiipjzluev.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `sb_publishable_s0HspuTmlJ5W5X4nr9AknQ_KZlh6zhN` | Production, Preview, Development |

Para cada una:
- Clic en **Add New**.
- Escribe el nombre (ej: `SUPABASE_URL`).
- Escribe el valor (ej: `https://gutvzkryggxiipjzluev.supabase.co`).
- Selecciona **todas** las opciones en "Environments" (Production, Preview, Development).
- Clic en **Save**.

### 4. Redeploy

- Vercel te dice: "Changes saved. Redeploy to apply environment variables?"
- Clic en **Redeploy**.
- Espera 2-3 minutos.

### 5. Prueba

- Ve a tu sitio: `https://videonow-xyz.vercel.app/register.html`
- Abre la consola (F12).
- Deberías ver: `✅ Supabase inicializado: { url: 'https://...' }`

---

## ✅ Checklist

- [ ] Añadiste `SUPABASE_URL` en Vercel
- [ ] Añadiste `SUPABASE_ANON_KEY` en Vercel
- [ ] Hiciste redeploy
- [ ] El login funciona en Vercel
- [ ] GitHub NO muestra tus secretos en el código

¡Listo!
