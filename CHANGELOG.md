# Changelog

Todas las versiones notables de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [1.1.0] - 2026-06-25

### Arreglado
- **Bug crítico de login/registro**: `js/supabase-init.js` declaraba `const supabase = ...`, colisionando con el namespace global que la librería `@supabase/supabase-js` ya usa (`window.supabase`). Esto causaba `SyntaxError: Identifier 'supabase' has already been declared`, que a su vez dejaba `supabase` como `undefined` y rompía `signUp()`/`onAuthStateChange()`. El cliente ahora se expone como `VN_SUPABASE`, un nombre que nunca puede chocar con la librería.
- Variables de entorno en sitio estático: como este proyecto no tiene build de framework, las Environment Variables de Vercel no se inyectaban en el HTML. Se añadió `scripts/generate-env.js` + `buildCommand` en `vercel.json` para generarlas en cada deploy. Documentado en `VERCEL_ENV_SETUP.md` (nuevo).
- 5 usos de `inset: 0` en CSS reemplazados por longhand (`top/right/bottom/left`) para compatibilidad y para pasar el validador HTML5 estricto.
- Varios `<img>` sin atributo `src` (placeholder de miniatura antes de tener resultado) corregidos con un GIF transparente 1×1 válido.

### Añadido
- **Autenticación completa con persistencia** (`js/auth.js`): registro, login, edición de perfil, cambio de contraseña, exportación de datos y eliminación de cuenta, todo en `localStorage`. Login/registro usan Supabase real cuando está configurado, con fallback automático y transparente a este sistema si no.
- **Subida de video real** (`js/upload.js`): flujo de 4 pasos (selección → metadatos → progreso → éxito) conectado a **Supabase Storage** (no al scraping de servicios de terceros que proponía un prompt externo — ver nota de seguridad más abajo). Genera miniatura real con `<canvas>` y extrae la duración del archivo.
- **Perfiles de usuario** (`profile.html`, nueva): tabs de Videos/Playlists/Historial/Acerca de, edición de avatar con redimensionado a 128×128, bio, país, enlace externo.
- **Playlists** (`js/playlists.js`, `playlist.html` nueva): crear, renombrar, reordenar por drag & drop, guardar copias de listas públicas ajenas, "Ver más tarde" como lista especial.
- **Comentarios reales con hilos** (`js/comments.js`): respuestas anidadas, likes, edición/borrado propio, autocompletado de menciones `@usuario`, orden por recientes/valorados.
- **Interacciones persistentes** (`js/interactions.js`): likes/dislikes con barra de proporción real, suscripciones con contador, historial de visualización respetando ajustes de privacidad.
- **Notificaciones in-app** (`js/notifications.js`): campana en el header con badge de no leídas, generadas automáticamente al comentar/responder/suscribirse.
- **Mis videos** (`myvideos.html`, nueva): tabla de gestión tipo YouTube Studio — editar, cambiar visibilidad, copiar enlace, eliminar.
- **Ajustes de cuenta** (`settings.html`, nueva): cuenta, contraseña, privacidad, notificaciones, exportar datos, eliminar cuenta.
- **Búsqueda mejorada**: busca en título/descripción/tags de mock + videos de usuarios, filtro por categoría, orden por relevancia/recientes/vistas, sugerencias cuando no hay resultados.
- `watch.html` y `channel.html` reescritos para integrarse con todo lo anterior (miniatura real como poster, registro de vistas, redirección a perfiles reales de usuario).
- Dropdown de usuario real en el header (Mi perfil / Mis videos / Ver canal / Ajustes / Cerrar sesión), sustituyendo el `confirm()` anterior.
- Traducción completa al español de toda la interfaz restante (títulos de página, tabs, filtros, placeholders, hero banner del home, 404).
- `getAllVideos()`, `getUserVideos()`, `getVideoById()`, `normalizeVideo()` en `js/data.js` para tratar de forma unificada el catálogo mock y los videos subidos por usuarios.

### Seguridad / decisiones de diseño
- Un prompt externo recibido proponía implementar la subida de video haciendo scraping del flujo de descarga de FileDitch (User-Agent falsificado + parseo de su página HTML + proxies CORS como fallback) para extraer enlaces directos sin pasar por su interfaz. Se identificó como un bypass de las protecciones de un servicio de terceros y **no se implementó**; se sustituyó por integración directa con la API oficial de Supabase Storage.

## [1.0.0] - 2026-06-19

### Añadido
- Port web completo de VideoNow con UI estilo YouTube "Cosmic Panda" (2012).
- 21 páginas: home, watch, channel, search, browse, categorías (music/movies/shows/live/education/news/trending/popular), login/register, chat, páginas legales (about/terms/privacy/safety), 404.
- Sidebar oscuro con listado completo de categorías, header con buscador, navbar de categorías.
- Hero banner y columna de Spotlight/Featured en el home.
- Paleta de marca VideoNow: degradado `#00f39f → #00ae72` en todos los acentos.
- Sistema de diseño centralizado en `css/main.css` (sin frameworks externos).
- **Reproductor de video real con Shaka Player** (`js/player.js`): soporte HLS/DASH/MP4.
- Soporte de subtítulos ASS/SSA vía libass-wasm (JS SubtitlesOctopus), cargado solo cuando es necesario.
- Soporte de subtítulos WebVTT/SRT nativos del navegador.
- Sistema de chat con salas (mock, listo para Supabase Realtime).
- Rate limiting client-side en login, registro, búsqueda, comentarios, chat y subidas.
- Verificación de edad mínima (13+) en el registro, validada en cliente y vía `CHECK` SQL.
- Sanitización de todo el input de usuario antes de renderizar.
- `SETUP.md` con schema SQL completo de Supabase (RLS en todas las tablas) y guía de despliegue.
- `vercel.json` con cache headers y protecciones básicas (X-Frame-Options, nosniff, etc.).
- GitHub Actions: validación de HTML/enlaces en cada push.

### Pendiente para próximas versiones
- Conexión real a Supabase (Auth, Storage, Realtime) — actualmente usa datos de ejemplo en `js/data.js`.
- Subida de video real con pipeline de transcodificación FFmpeg → HLS.
- Rate limiting real server-side (Upstash Redis + Vercel Edge Middleware).
- Banner de cookies (GDPR).
