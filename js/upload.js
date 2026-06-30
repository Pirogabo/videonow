/* ================================================================
   VIDEONOW — SUBIDA DE VIDEOS
   Usa la API oficial de Supabase Storage (cliente VN_SUPABASE, ver
   js/supabase-init.js). Si Supabase no está configurado todavía,
   avisa con claridad en vez de fallar en silencio.

   Límite: 100 GB en teoría de producto, pero en la práctica el plan
   gratuito de Supabase Storage tiene límites mucho menores (revisa
   tu plan). Validamos aquí un límite configurable.
   ================================================================ */

const UPLOAD_MAX_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB (límite de producto; tu plan real de Supabase puede ser menor)
const UPLOAD_ALLOWED_EXT = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
const UPLOAD_BUCKET = 'videos';

function isAllowedVideoFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return UPLOAD_ALLOWED_EXT.includes(ext);
}

/**
 * Genera una miniatura (data URL JPEG) capturando un frame del video.
 */
async function generateThumb(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(video.src);

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    });
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 180);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
    video.addEventListener('error', () => { cleanup(); reject(new Error('No se pudo leer el archivo de video.')); });
    video.load();
  });
}

/** Devuelve "M:SS" a partir de la duración real del archivo. */
async function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.addEventListener('loadedmetadata', () => {
      const total = Math.floor(video.duration || 0);
      const mins = Math.floor(total / 60);
      const secs = total % 60;
      URL.revokeObjectURL(video.src);
      resolve(`${mins}:${String(secs).padStart(2, '0')}`);
    });
    video.addEventListener('error', () => resolve('0:00'));
  });
}

/**
 * Sube el archivo de video a Supabase Storage.
 * onProgress(pct, phase) — phase: 'uploading' | 'done' | 'error'
 * Retorna { ok: true, publicUrl } o { ok: false, error }
 */
async function uploadVideoFile(file, onProgress) {
  if (!isSupabaseReady()) {
    return { ok: false, error: 'Supabase no está configurado todavía. Revisa SETUP.md y VERCEL_ENV_SETUP.md.' };
  }
  if (!Auth.isLoggedIn()) {
    return { ok: false, error: 'Inicia sesión para subir videos.' };
  }
  if (!isAllowedVideoFile(file)) {
    return { ok: false, error: 'Formato no permitido. Usa MP4, WebM, MOV, MKV o AVI.' };
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera el límite de 100 GB.' };
  }

  const path = `${Auth.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    if (onProgress) onProgress(5, 'uploading');

    // El SDK JS de Supabase Storage no expone progreso granular de subida
    // en su API pública estable, así que mostramos un progreso indicativo
    // y confirmamos el resultado real al terminar.
    const progressTimer = setInterval(() => {
      if (onProgress) onProgress(Math.min(90, 5 + Math.random() * 15 + 10), 'uploading');
    }, 600);

    const { data, error } = await VN_SUPABASE
      .storage
      .from(UPLOAD_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    clearInterval(progressTimer);

    if (error) {
      if (onProgress) onProgress(0, 'error');
      return { ok: false, error: 'Error al subir: ' + error.message };
    }

    const { data: urlData } = VN_SUPABASE.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
    if (onProgress) onProgress(100, 'done');

    return { ok: true, publicUrl: urlData.publicUrl, path };
  } catch (err) {
    if (onProgress) onProgress(0, 'error');
    return { ok: false, error: 'Error inesperado: ' + (err.message || err) };
  }
}

/**
 * Flujo completo: genera miniatura + duración, sube el archivo, y guarda
 * los metadatos del video en localStorage ("vn_videos").
 */
async function publishVideo(file, metadata, onProgress) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para subir videos.' };

  let thumb = null, duration = '0:00';
  try {
    if (onProgress) onProgress(2, 'processing');
    [thumb, duration] = await Promise.all([
      generateThumb(file).catch(() => null),
      getVideoDuration(file).catch(() => '0:00'),
    ]);
  } catch (e) { /* no-op — seguimos sin miniatura si falla */ }

  const uploadResult = await uploadVideoFile(file, onProgress);
  if (!uploadResult.ok) return uploadResult;

  const video = {
    id: 'uv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    title: metadata.title.slice(0, 100),
    desc: (metadata.desc || '').slice(0, 5000),
    cat: metadata.cat || 'other',
    tags: (metadata.tags || []).slice(0, 10),
    visibility: metadata.visibility || 'public',
    src: uploadResult.publicUrl,
    storagePath: uploadResult.path,
    uploadedBy: Auth.user.id,
    channelName: Auth.user.name,
    views: 0,
    likes: 0,
    dislikes: 0,
    duration,
    thumb,
    createdAt: new Date().toISOString(),
  };

  const videos = getUserVideos();
  videos.push(video);
  saveUserVideos(videos);

  Auth.updateUser({ videosUploaded: (Auth.user.videosUploaded || 0) + 1 });

  return { ok: true, video };
}

function deleteUserVideo(videoId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'No has iniciado sesión.' };
  const videos = getUserVideos();
  const video = videos.find(v => v.id === videoId);
  if (!video) return { ok: false, error: 'Video no encontrado.' };
  if (video.uploadedBy !== Auth.user.id) return { ok: false, error: 'Solo puedes eliminar tus propios videos.' };

  saveUserVideos(videos.filter(v => v.id !== videoId));

  // Intentar borrar también el archivo de Storage (no bloqueante si falla)
  if (isSupabaseReady() && video.storagePath) {
    VN_SUPABASE.storage.from(UPLOAD_BUCKET).remove([video.storagePath]).catch(() => {});
  }

  Auth.updateUser({ videosUploaded: Math.max(0, (Auth.user.videosUploaded || 1) - 1) });
  return { ok: true };
}

function updateUserVideo(videoId, fields) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'No has iniciado sesión.' };
  const videos = getUserVideos();
  const idx = videos.findIndex(v => v.id === videoId);
  if (idx === -1) return { ok: false, error: 'Video no encontrado.' };
  if (videos[idx].uploadedBy !== Auth.user.id) return { ok: false, error: 'Solo puedes editar tus propios videos.' };

  videos[idx] = { ...videos[idx], ...fields };
  saveUserVideos(videos);
  return { ok: true, video: videos[idx] };
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024 ** 3).toFixed(2) + ' GB';
}
