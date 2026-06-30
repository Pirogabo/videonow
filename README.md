# VideoNow 🎬

![Validate site](https://github.com/TU_USUARIO/TU_REPO/actions/workflows/validate.yml/badge.svg)
![Version](https://img.shields.io/badge/version-1.1.0-00ae72)

Plataforma social de video — interfaz inspirada en el "Cosmic Panda" de YouTube (2012), con la paleta de marca de VideoNow (degradado `#00f39f → #00ae72`). Incluye autenticación, subida real de video, perfiles, playlists, comentarios con hilos, notificaciones y un reproductor real con Shaka Player.

> Sitio estático (HTML/CSS/JS puro) con un único paso de build mínimo para inyectar las claves de Supabase. Desplegable en **Vercel** desde **GitHub**.
>
> Reemplaza `TU_USUARIO/TU_REPO` en el badge de arriba por la ruta real de tu repo.

## 📁 Estructura

```
videonow/
├── index.html, watch.html, channel.html, profile.html, playlist.html
├── myvideos.html, settings.html, search.html, browse.html, chat.html
├── login.html, register.html
├── music.html / movies.html / shows.html / live.html
├── education.html / news.html / trending.html / popular.html
├── about.html / terms.html / privacy.html / safety.html / 404.html
│
├── css/main.css           → Sistema de diseño completo
│
├── js/
│   ├── supabase-init.js    → Cliente Supabase como VN_SUPABASE (evita el bug del nombre global)
│   ├── auth.js             → Auth con localStorage (fallback) + integración Supabase Auth
│   ├── data.js             → Catálogo mock + getAllVideos()/getUserVideos()
│   ├── upload.js           → Subida real a Supabase Storage + miniatura por canvas
│   ├── comments.js         → Comentarios con hilos, likes, edición, menciones @
│   ├── playlists.js        → CRUD de listas de reproducción + "Ver más tarde"
│   ├── interactions.js     → Likes/dislikes/suscripciones/historial persistentes
│   ├── notifications.js    → Notificaciones in-app (campana del header)
│   ├── security.js         → Rate limiter, sanitización, validaciones
│   ├── layout.js           → Header, dropdown de usuario, modal de subida (4 pasos)
│   └── player.js           → Shaka Player (HLS/DASH/MP4) + subtítulos ASS vía libass-wasm
│
├── assets/logo.png, assets/subs/demo-es.vtt
├── scripts/generate-env.js → Genera js/env.js en build time (Vercel)
├── js/env.example.js       → Plantilla para desarrollo local (copiar a js/env.js)
├── .github/workflows/validate.yml
├── vercel.json, .env.example
├── VERCEL_ENV_SETUP.md     → Cómo configurar SUPABASE_URL/ANON_KEY en Vercel
├── SETUP.md                → Schema SQL, Storage, player, arquitectura localStorage↔Supabase
└── CHANGELOG.md
```

## 🚀 Deploy rápido

1. Sube esta carpeta a un repo de GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. **Settings → Environment Variables**: añade `SUPABASE_URL` y `SUPABASE_ANON_KEY` (ver [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)).
4. Deploy. El `buildCommand` de `vercel.json` genera `js/env.js` automáticamente con esas variables.

Si no configuras Supabase, el sitio funciona igual: login/registro caen automáticamente al sistema local con `localStorage` (ver `js/auth.js`), aunque la subida de video quedará bloqueada hasta que conectes Storage.

## ✨ Funcionalidades

- **Auth real o local** — Supabase Auth cuando está configurado, con fallback automático y transparente a un sistema completo en `localStorage` (registro, login, edición de perfil, cambio de contraseña, exportar/eliminar cuenta).
- **Subida de video** — flujo de 4 pasos (archivo → metadatos → progreso → éxito), miniatura generada con `<canvas>` desde el propio video, subida real a Supabase Storage con políticas RLS por carpeta de usuario.
- **Perfiles** (`profile.html`) — tabs de Videos / Playlists / Historial (propio) / Acerca de, edición de avatar (redimensionado a 128×128), bio, país, enlace externo.
- **Playlists** (`playlist.html`) — crear, renombrar, reordenar con drag & drop, guardar copias de listas públicas ajenas.
- **Comentarios reales** — hilos de respuesta, likes, edición/borrado del propio comentario, autocompletado de menciones `@usuario`, orden por recientes/valorados.
- **Interacciones persistentes** — likes/dislikes con barra de proporción, suscripciones con contador real, historial de visualización (respeta el ajuste de privacidad), "Ver más tarde".
- **Notificaciones** — campana en el header con contador de no leídas; se generan al comentar, responder o suscribirse, respetando las preferencias de cada usuario.
- **Mis videos** (`myvideos.html`) — tabla de gestión estilo YouTube Studio: editar metadatos, cambiar visibilidad, copiar enlace, eliminar.
- **Ajustes** (`settings.html`) — cuenta, contraseña, privacidad, notificaciones, exportar datos (JSON) y eliminar cuenta.
- **Búsqueda** (`search.html`) — busca en título/descripción/tags de todo el catálogo (mock + subido por usuarios), filtro por categoría, orden por relevancia/recientes/vistas, sugerencias cuando no hay resultados.

## 🎬 Reproductor de video

`watch.html` usa **Shaka Player** real para HLS/DASH/MP4, con subtítulos `.vtt`/`.srt` nativos del navegador y `.ass`/`.ssa` vía **libass-wasm** (cargado solo cuando el video realmente tiene subtítulos ASS). Si el enlace de un video caduca o falla, se muestra un aviso claro en vez de romper la página. Detalles del pipeline de FFmpeg recomendado en [SETUP.md](./SETUP.md#25-player-de-video-shaka-player--subtítulos-ass).

## 🗄️ Base de datos y arquitectura

Perfiles, playlists, comentarios, notificaciones e interacciones viven en `localStorage` (funcionan sin backend, pero no sincronizan entre dispositivos). Auth y el archivo de video en sí usan Supabase real cuando está configurado. El detalle completo de qué vive dónde, y cómo migrar cada pieza a Supabase si quieres persistencia total, está en [SETUP.md → sección 1.5](./SETUP.md#15-arquitectura-localstorage-modo-demo--supabase-modo-real).

## 🎨 Diseño

- Acento: degradado `#00f39f → #00ae72` en botones, barra de likes, avatares y elementos activos.
- Layout "Cosmic Panda" (2012): header blanco + navbar oscuro + sidebar de categorías + lista de videos con thumbnail a la izquierda.
- Arial/Helvetica, sin fuentes externas.

## 🔒 Seguridad

- Rate limiting client-side en login, registro, búsqueda, comentarios, chat, subidas y likes.
- Edad mínima 13 años verificada en registro.
- Sanitización de todo input de usuario antes de renderizar.
- Checkbox obligatorio de Términos + Privacidad en el registro.
- Cliente de Supabase aislado como `VN_SUPABASE` para evitar colisiones de nombre con la librería (ver comentario en `js/supabase-init.js`).
- El detalle de qué falta para producción real (rate limiting server-side, RLS completo, etc.) está en `SETUP.md`.

## 🛠️ Próximos pasos sugeridos

- [ ] Migrar comentarios/notificaciones/interacciones de localStorage a tablas Supabase (esquema ya documentado en SETUP.md)
- [ ] Chat en tiempo real con Supabase Realtime
- [ ] Edge Function de rate limiting con Upstash Redis
- [ ] Banner de cookies (CookieYes / Osano)
- [ ] OAuth real de Google/Facebook (los botones ya están, falta configurar las apps OAuth)

## ✅ Estado del release

- HTML5 válido en las 25 páginas (`html5validator --root .`).
- Sintaxis verificada en los 13 módulos JS y en cada script inline de cada página.
- Enlaces internos comprobados automáticamente en cada push (`.github/workflows/validate.yml`).
- Ver [CHANGELOG.md](./CHANGELOG.md).

## 🤝 Contribuir

1. Rama nueva por feature (`git checkout -b feature/lo-que-sea`).
2. Revisa dos veces cualquier cambio a `js/security.js`, `js/auth.js` o el flujo de auth en general.
3. Nunca declares una variable `supabase` propia — usa siempre `VN_SUPABASE` (ver `js/supabase-init.js`).
4. Verifica `html5validator --root .` limpio antes de abrir el PR.
