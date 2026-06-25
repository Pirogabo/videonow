# VideoNow 🎬

![Validate site](https://github.com/PIrogabo/videonow/actions/workflows/validate.yml/badge.svg)
![Version](https://img.shields.io/badge/version-1.0.0-00ae72)

Port web de **VideoNow** — plataforma social de video/chat, con una interfaz inspirada en el clásico diseño "Cosmic Panda" de YouTube (2012), en la paleta de marca de VideoNow (degradado verde `#00f39f → #00ae72`).

> Proyecto estático: HTML + CSS + JS puro. Listo para desplegar en **Vercel** desde **GitHub**. Sin build step.
>
> Reemplaza `TU_USUARIO/TU_REPO` en el badge de arriba por la ruta real de tu repo una vez lo subas.

## 📁 Estructura

```
videonow/
├── index.html          → Home (hero banner + feed + spotlight)
├── watch.html          → Reproductor real (Shaka Player) + comentarios + relacionados
├── channel.html         → Perfil de canal (tabs: Videos / About)
├── search.html          → Resultados de búsqueda
├── browse.html          → Explorar por categoría (filtros)
├── music.html / movies.html / shows.html / live.html
├── education.html / news.html / trending.html / popular.html
├── login.html / register.html   → Auth (con rate limiting + edad mínima)
├── chat.html            → Salas de chat en vivo
├── about.html / terms.html / privacy.html / safety.html
├── 404.html
├── css/main.css         → Todo el sistema de diseño
├── js/
│   ├── data.js          → Datos de ejemplo (videos, canales, chats) — reemplazar por Supabase
│   ├── security.js       → Rate limiter, sanitización, validaciones
│   ├── layout.js         → Header/auth state, modales compartidos
│   └── player.js         → Shaka Player (HLS/DASH/MP4) + subtítulos ASS vía libass-wasm
├── assets/
│   ├── logo.png
│   └── subs/demo-es.vtt  → Subtítulo de ejemplo para el video demo
├── .github/
│   ├── workflows/validate.yml    → CI: valida HTML5 + enlaces internos en cada push
│   └── PULL_REQUEST_TEMPLATE.md
├── vercel.json
├── CHANGELOG.md
└── SETUP.md             → Guía de Supabase + player + checklist de seguridad
```

## 🚀 Deploy rápido

1. Sube esta carpeta a un repo de GitHub.
2. Entra a [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Framework preset: **Other** (es HTML estático, no necesita build command).
4. Deploy. Listo — tu web está en `tu-proyecto.vercel.app`.

## 🎬 Reproductor de video

`watch.html` usa **Shaka Player** real (no un placeholder) para HLS/DASH/MP4, con soporte de subtítulos:
- `.vtt` / `.srt` → pista nativa del navegador.
- `.ass` / `.ssa` → renderizado con **libass-wasm** (cargado solo si el video tiene subtítulos ASS, así no se penaliza el peso de página cuando no hace falta).

Hay un video de ejemplo con una fuente HLS real ya cargada para que puedas probar el reproductor funcionando tal cual. Para tu propio contenido, añade `src` y `subtitles` a la entrada correspondiente en `js/data.js` — todos los detalles y el pipeline de FFmpeg recomendado están en [SETUP.md](./SETUP.md#25-player-de-video-shaka-player--subtítulos-ass).

## 🗄️ Base de datos

Este proyecto usa **datos de ejemplo** en `js/data.js` para que puedas ver el diseño funcionando ya mismo. Para una app real con usuarios persistentes, videos subidos, chats en tiempo real, etc., sigue la guía completa en **[SETUP.md](./SETUP.md)** — usa Supabase (Postgres + Auth + Storage + Realtime, gratis para empezar).

## 🎨 Diseño

- Paleta acento: degradado `#00f39f` (arriba) → `#00ae72` (abajo), usado en botones, barra de progreso de likes, avatares y elementos activos.
- Layout inspirado en YouTube "Cosmic Panda" (2012): header blanco + barra de navegación oscura + sidebar de categorías + lista de videos con thumbnail a la izquierda.
- Tipografía: Arial/Helvetica, sin fuentes externas (carga rápida).

## 🔒 Seguridad ya incluida

- Rate limiting client-side en login, registro, búsqueda, comentarios, chat y subidas.
- Verificación de edad mínima (13+) en registro.
- Sanitización de todo el input de usuario antes de renderizar (anti-XSS básico).
- Checkbox obligatorio de Términos + Privacidad (cookies incluidas) en el registro.
- Ver `SETUP.md` para las medidas que deben implementarse en el servidor (Supabase RLS, rate limiting real con Redis, etc.) — el rate limiting de este repo es solo una primera barrera visual, **no sustituye** la protección del backend.

## 🛠️ Próximos pasos sugeridos

- [ ] Conectar Supabase (Auth + tablas — ver SETUP.md)
- [ ] Subida real de video a Supabase Storage + pipeline FFmpeg → HLS (ver SETUP.md)
- [ ] Chat en tiempo real con Supabase Realtime (websockets)
- [ ] Edge Function de rate limiting con Upstash Redis
- [ ] Banner de cookies (CookieYes / Osano)

## ✅ Estado del release

- HTML5 válido en las 21 páginas (verificado con `html5validator`).
- Todos los enlaces internos comprobados (`.github/workflows/validate.yml` corre esto en cada push).
- Ver [CHANGELOG.md](./CHANGELOG.md) para el detalle de versión.

## 🤝 Contribuir

Antes de mergear cambios a `main`:
1. Trabaja en una rama nueva por feature (`git checkout -b feature/lo-que-sea`).
2. Revisa especialmente dos veces cualquier cambio a `js/security.js` o al flujo de auth.
3. Verifica que `html5validator --root .` pase limpio antes de abrir el PR.
