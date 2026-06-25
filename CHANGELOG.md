# Changelog

Todas las versiones notables de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

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
