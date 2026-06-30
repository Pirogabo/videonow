# VideoNow — Setup Guide
## Stack: GitHub + Vercel + Supabase

---

## 1. Supabase

1. Crea cuenta en https://supabase.com → nuevo proyecto.
2. Guarda **Project URL** y **anon public key** (Settings → API).
3. Ve a **SQL Editor** y pega el siguiente schema completo:

```sql
-- ============================================================
-- PROFILES (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 2 AND 30),
  display_name TEXT CHECK (char_length(display_name) <= 50),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  dob DATE NOT NULL,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT min_age_13 CHECK (dob <= (CURRENT_DATE - INTERVAL '13 years'))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- VIDEOS
-- ============================================================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 5000),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  category TEXT DEFAULT 'all',
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published videos are public" ON public.videos FOR SELECT USING (is_published = TRUE AND is_approved = TRUE);
CREATE POLICY "Owner manages own videos" ON public.videos FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Like counts visible" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Auth users like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments visible" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth users comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SUBSCRIPTIONS (follows)
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subs visible" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Auth users sub" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth users unsub" ON public.subscriptions FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- CHAT ROOMS
-- ============================================================
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  description TEXT CHECK (char_length(description) <= 300),
  category TEXT DEFAULT 'general',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public rooms visible" ON public.chat_rooms FOR SELECT USING (is_private = FALSE);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members see messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Auth users send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  video_id UUID REFERENCES public.videos(id),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Mark read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- RATE LIMIT LOG (tracking server-side, complementa Redis)
-- ============================================================
CREATE TABLE public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rate_limit ON public.rate_limit_log (ip_hash, action, created_at);
```

4. Habilita Auth providers: **Authentication → Providers** → activa Email, Google, Facebook (necesitas configurar OAuth apps en Google Cloud Console / Facebook Developers).

5. Crea el bucket de Storage para los videos subidos por usuarios: **Storage → New bucket** → nombre `videos` → marca **Public bucket** (así `getPublicUrl()` funciona sin URLs firmadas). Luego, en **Storage → Policies** para ese bucket, añade:

```sql
-- Cualquiera puede leer (bucket público, pero esta policy es la que de verdad lo permite)
CREATE POLICY "Videos públicos de lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Solo usuarios autenticados pueden subir, y solo dentro de su propia carpeta (su user.id)
CREATE POLICY "Usuarios suben a su propia carpeta"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Solo el propietario puede borrar sus propios archivos
CREATE POLICY "Usuarios borran sus propios videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

> `js/upload.js` sube cada archivo bajo la ruta `{userId}/{timestamp}-{nombre}`, que es justo lo que estas policies esperan para identificar al propietario.

---

## 1.5. Arquitectura: localStorage (modo demo) ↔ Supabase (modo real)

Este proyecto puede correr en dos modos a la vez, según si Supabase está configurado (`isSupabaseReady()` en `js/supabase-init.js`):

| | Sin Supabase configurado | Con Supabase configurado |
|---|---|---|
| Auth (login/registro) | `js/auth.js` → localStorage | `VN_SUPABASE.auth.*` |
| Subida de video | Bloqueada con aviso claro | `js/upload.js` → Supabase Storage real |
| Perfiles, playlists, comentarios, notificaciones, likes/subs, historial | Todo en localStorage | **Sigue en localStorage** (ver nota abajo) |

**Nota importante:** perfiles, playlists, comentarios, notificaciones e interacciones (likes/dislikes/subs/historial) usan **localStorage en ambos modos** — son los módulos `js/auth.js`, `js/playlists.js`, `js/comments.js`, `js/notifications.js` e `js/interactions.js`. Esto es intencional para que la demo funcione completa sin backend, pero significa que **esos datos no persisten entre navegadores ni dispositivos**, y se pierden si el usuario borra los datos del sitio.

Si quieres que estos datos también vivan en Supabase (recomendado para producción real), necesitas:
1. Crear las tablas `profiles`, `comments`, `likes`, `subscriptions`, `notifications` (el SQL completo ya está en este documento, sección "Supabase").
2. Sustituir las funciones de `js/auth.js`, `js/comments.js`, `js/interactions.js`, `js/notifications.js` y `js/playlists.js` por llamadas a `VN_SUPABASE.from('tabla').select/insert/update/delete(...)`.
3. La interfaz pública de cada función (`Auth.login()`, `postComment()`, `toggleVideoLike()`, etc.) puede mantenerse igual — solo cambia la implementación interna — así no hace falta tocar las páginas HTML que las usan.

### Claves de localStorage usadas (referencia rápida)

| Clave | Contenido | Módulo |
|---|---|---|
| `vn_users` | Array de usuarios registrados | `js/auth.js` |
| `vn_session` | Sesión activa (`{userId, loginAt}`) | `js/auth.js` |
| `vn_videos` | Videos subidos por usuarios | `js/data.js`, `js/upload.js` |
| `vn_comments` | `{ [videoId]: [comentarios] }` | `js/comments.js` |
| `vn_notifs_<userId>` | Notificaciones por usuario | `js/notifications.js` |
| `vn_mock_video_stats` | Likes/dislikes/vistas extra sobre el catálogo de ejemplo (no muta `VIDEOS`) | `js/interactions.js` |

---

## 2. Conectar el frontend a Supabase

Reemplaza los `TODO:` en `js/layout.js`, `login.html`, `register.html`, `watch.html` y `chat.html` con llamadas reales. Ejemplo mínimo:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const supabase = window.supabase.createClient(
    'https://TU-PROYECTO.supabase.co',
    'TU-ANON-KEY'
  );

  // Login
  async function realLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { showToast(error.message); return; }
    Auth.login({ email: data.user.email, name: data.user.user_metadata.name });
  }
</script>
```

**Nunca** pongas la `service_role` key en el frontend — solo la `anon` key (protegida por RLS).

---

## 2.5. Player de video (Shaka Player + subtítulos ASS)

`js/player.js` integra **Shaka Player** real (HLS/DASH/MP4) en `watch.html`, con soporte opcional de subtítulos `.ass`/`.ssa` vía **libass-wasm** (la versión mantenida de JS SubtitlesOctopus). Ambas librerías se cargan perezosamente desde CDN (jsDelivr) — no añaden peso si el video no las necesita.

### Pipeline recomendado del lado del servidor

```
MKV/MP4 original
      ↓
   FFmpeg                 (transcodifica a HLS, extrae pistas)
      ↓
HLS (master.m3u8)
      ↓
Shaka Player             (reproduce en el navegador)
      ↓
JS SubtitlesOctopus      (solo si hay subtítulos .ass — si son .vtt/.srt, el navegador los pinta nativo)
```

### Cómo declarar un video con su fuente real

En `js/data.js`, cada entrada de `VIDEOS` acepta opcionalmente:

```js
{
  id: 'v1',
  title: '...',
  // ...
  src: 'https://tu-cdn.com/videos/v1/master.m3u8',   // HLS, DASH o MP4 directo
  subtitles: [
    { lang: 'es', label: 'Español',        kind: 'vtt', url: '.../subs_es.vtt', default: true },
    { lang: 'es', label: 'Español (anime)', kind: 'ass', url: '.../subs_es.ass' }
  ]
}
```

Si un video no tiene `src`, el reproductor muestra un aviso en vez de fallar — así puedes ir migrando tu catálogo de ejemplo poco a poco a fuentes reales sin romper nada.

### Comandos de FFmpeg de referencia

```bash
# Extraer pistas de un MKV (video, audios, subtítulos)
ffmpeg -i Pelicula.mkv -map 0:v -c copy video.mp4
ffmpeg -i Pelicula.mkv -map 0:a:0 -c copy audio_es.aac
ffmpeg -i Pelicula.mkv -map 0:s:0 subs_es.ass     # si el sub es ASS
ffmpeg -i Pelicula.mkv -map 0:s:0 subs_es.vtt     # si quieres forzar VTT (pierde estilos avanzados)

# Generar HLS multi-bitrate con audio separado
ffmpeg -i video.mp4 -i audio_es.aac \
  -map 0:v -map 1:a \
  -c:v h264 -c:a aac \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0" \
  stream_%v/playlist.m3u8
```

> ⚠️ Importante: este pipeline es para **el contenido que tus propios usuarios suban a VideoNow** a través del flujo de Upload. No lo uses para transcodificar o redistribuir contenido con copyright de terceros (series, películas, anime, etc.) — eso viola los Términos de Servicio que ya están en `terms.html` y te expone legalmente igual que describías en tus notas de seguridad.

### Subir el video real (cuando conectes Supabase Storage)

```js
// Ejemplo de subida real — sustituye al simulateUpload() de js/layout.js
async function uploadVideo(file) {
  const path = `videos/${Auth.user.id}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from('videos').upload(path, file);
  if (error) { showToast('Error al subir: ' + error.message); return; }

  // Aquí dispararías tu pipeline de FFmpeg (Edge Function, worker, o servicio externo)
  // que transcodifica a HLS y guarda la URL final en la tabla `videos`.
}
```

---

## 3. Vercel

1. Sube esta carpeta a GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Framework preset: **Other** (sitio estático, sin build).
4. Si conectas Supabase desde funciones serverless (Edge Functions de Vercel), variables de entorno:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_key   ← SOLO en backend, nunca en el HTML/JS del cliente
   ```

---

## 4. Checklist de seguridad (basado en tus notas)

### ✅ Ya implementado en este repo
- [x] Edad mínima 13 años en `register.html` (validado en cliente + `CHECK` SQL en `profiles`)
- [x] Checkbox obligatorio de Términos + Privacidad (incluye mención a cookies)
- [x] Rate limiting client-side: login (5/min), registro (3/min), búsqueda (12/min), comentarios (8/min), chat (15/30s), subidas (10/día)
- [x] Sanitización de todo el input antes de pintar en el DOM — nunca `innerHTML` con texto crudo de usuario
- [x] `maxlength` en todos los formularios
- [x] Row Level Security planteado en cada tabla del schema

### 🔧 Pendiente de implementar en backend — esto es lo que de verdad te protege
El rate limiting de este repo (en `js/security.js`) es **solo client-side** — cualquiera puede abrir la consola y desactivarlo. Es una capa de UX, no de seguridad real. Para protección real:

| Riesgo de tu lista | Mitigación |
|---|---|
| Multa $250k por no avisar de cookies | Banner de cookies real (CookieYes / Osano, free tier) + Privacy Policy detallada (ya en `privacy.html`, pero revísala con un abogado si vas en serio) |
| Multa $53k por datos de menores de 13 | `CHECK` SQL ya bloquea el insert; añade verificación de doble opt-in por email |
| Factura de $50k por spam a tu API | **Rate limiting real server-side** con Upstash Redis (gratis, se integra directo con Vercel Edge Functions) |
| Crash por emojis (UTF-8 4 bytes) | Supabase usa Postgres con UTF-8 nativo → emojis funcionan sin configuración extra. Si migras a MySQL alguna vez, usa `utf8mb4`, NO `utf8` |
| DDoS → factura de $50k en AWS | Cloudflare (free tier) como proxy delante de Vercel; Vercel ya tiene protección básica incluida |
| Inyección SQL | Usa siempre el cliente de Supabase (`supabase.from(...)`), que usa prepared statements automáticamente. Nunca concatenes SQL a mano |

### 🛡️ Las 4 que mencionaste explícitamente
- **Authentication** → Supabase Auth (ya cubierto arriba)
- **Rate limiting** → Upstash Redis + Vercel Edge Middleware (ver ejemplo abajo)
- **Row Level Security** → ya en el schema SQL (`ENABLE ROW LEVEL SECURITY` en cada tabla)
- **Server-side validation** → repite SIEMPRE en el backend lo que validas en el cliente (los `CHECK` de SQL ya hacen parte de esto)

#### Ejemplo de rate limiting real con Upstash + Vercel Edge Middleware
```js
// middleware.js (en la raíz, si migras a Next.js, o como Edge Function)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 requests / 60s
});

export default async function middleware(req) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  if (!success) return new Response('Too many requests', { status: 429 });
}
```

### 🧩 Flujo de trabajo con agentes (de tus notas)
Si vas a seguir desarrollando esto con ayuda de agentes de IA (Claude Code, Codex, etc.), las prácticas que mencionaste son sólidas:
- Una rama de git por feature/agente, nunca tocar `main` directo.
- Tener archivos `.md` de reglas (seguridad, calidad, tests) que el agente lea antes de trabajar — puedo generártelos si quieres, dime de qué temas.
- Múltiples pasadas de auditoría antes de mergear (un agente que escribe, otro que audita).

Esto aplica igual de bien aquí: cualquier cambio que toque `js/security.js`, las policies de RLS, o el flujo de auth, vale la pena revisarlo dos veces antes de subirlo a producción.
