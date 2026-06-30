/* ================================================================
   VIDEONOW — INTERACCIONES CON VIDEOS
   Likes, dislikes, suscripciones, contador de vistas e historial,
   todo persistido en localStorage (usuarios en "vn_users", videos
   subidos por usuarios en "vn_videos").

   Los videos del catálogo mock (js/data.js → VIDEOS) son de solo
   lectura en cuanto a su array original, pero sus contadores de
   likes/dislikes/views durante la sesión se llevan en una capa
   aparte ("vn_mock_video_stats") para no mutar el archivo fuente.
   ================================================================ */

function _loadMockStats() {
  try { return JSON.parse(localStorage.getItem('vn_mock_video_stats') || '{}'); }
  catch { return {}; }
}
function _saveMockStats(stats) {
  localStorage.setItem('vn_mock_video_stats', JSON.stringify(stats));
}

function _isUserUpload(videoId) { return String(videoId).startsWith('uv_'); }

/** Devuelve { likes, dislikes, views } combinando el valor base del mock con lo acumulado en sesión. */
function getVideoStats(videoId) {
  const video = getVideoById(videoId);
  if (!video) return { likes: 0, dislikes: 0, views: 0 };

  if (_isUserUpload(videoId)) {
    return { likes: video.likes || 0, dislikes: video.dislikes || 0, views: video.views || 0 };
  }
  const stats = _loadMockStats();
  const override = stats[videoId] || {};
  return {
    likes: override.likes ?? 0,
    dislikes: override.dislikes ?? 0,
    views: (video.views || 0) + (override.viewsDelta || 0),
  };
}

function _updateUserUploadVideo(videoId, fields) {
  const videos = getUserVideos();
  const idx = videos.findIndex(v => v.id === videoId);
  if (idx === -1) return false;
  videos[idx] = { ...videos[idx], ...fields };
  saveUserVideos(videos);
  return true;
}

function _bumpMockStat(videoId, field, delta) {
  const stats = _loadMockStats();
  if (!stats[videoId]) stats[videoId] = { likes: 0, dislikes: 0, viewsDelta: 0 };
  stats[videoId][field] = (stats[videoId][field] || 0) + delta;
  _saveMockStats(stats);
}

function toggleVideoLike(videoId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para reaccionar.' };
  const liked = Auth.user.likedVideos.includes(videoId);
  const disliked = Auth.user.dislikedVideos.includes(videoId);

  let likedVideos = [...Auth.user.likedVideos];
  let dislikedVideos = [...Auth.user.dislikedVideos];

  if (liked) {
    likedVideos = likedVideos.filter(id => id !== videoId);
    _applyDelta(videoId, 'likes', -1);
  } else {
    likedVideos.push(videoId);
    _applyDelta(videoId, 'likes', 1);
    if (disliked) {
      dislikedVideos = dislikedVideos.filter(id => id !== videoId);
      _applyDelta(videoId, 'dislikes', -1);
    }
  }

  Auth.updateUser({ likedVideos, dislikedVideos });
  return { ok: true, liked: !liked, stats: getVideoStats(videoId) };
}

function toggleVideoDislike(videoId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para reaccionar.' };
  const disliked = Auth.user.dislikedVideos.includes(videoId);
  const liked = Auth.user.likedVideos.includes(videoId);

  let likedVideos = [...Auth.user.likedVideos];
  let dislikedVideos = [...Auth.user.dislikedVideos];

  if (disliked) {
    dislikedVideos = dislikedVideos.filter(id => id !== videoId);
    _applyDelta(videoId, 'dislikes', -1);
  } else {
    dislikedVideos.push(videoId);
    _applyDelta(videoId, 'dislikes', 1);
    if (liked) {
      likedVideos = likedVideos.filter(id => id !== videoId);
      _applyDelta(videoId, 'likes', -1);
    }
  }

  Auth.updateUser({ likedVideos, dislikedVideos });
  return { ok: true, disliked: !disliked, stats: getVideoStats(videoId) };
}

function _applyDelta(videoId, field, delta) {
  if (_isUserUpload(videoId)) {
    const video = getVideoById(videoId);
    _updateUserUploadVideo(videoId, { [field]: Math.max(0, (video?.[field] || 0) + delta) });
  } else {
    _bumpMockStat(videoId, field, delta);
  }
}

function registerView(videoId) {
  if (_isUserUpload(videoId)) {
    const video = getVideoById(videoId);
    _updateUserUploadVideo(videoId, { views: (video?.views || 0) + 1 });
  } else {
    _bumpMockStat(videoId, 'viewsDelta', 1);
  }

  if (Auth.isLoggedIn() && Auth.user.settings?.historyEnabled !== false) {
    let history = [...(Auth.user.watchHistory || [])];
    history.unshift({ videoId, watchedAt: new Date().toISOString() });
    if (history.length > 200) history = history.slice(0, 200);
    Auth.updateUser({ watchHistory: history });
  }
}

function removeFromHistory(videoId, watchedAt) {
  if (!Auth.isLoggedIn()) return;
  const history = (Auth.user.watchHistory || []).filter(
    h => !(h.videoId === videoId && h.watchedAt === watchedAt)
  );
  Auth.updateUser({ watchHistory: history });
}

function clearHistory() {
  if (!Auth.isLoggedIn()) return;
  Auth.updateUser({ watchHistory: [] });
}

/* ---- Suscripciones a canales/usuarios ---- */

function toggleSubscription(channelOrUserId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para suscribirte.' };
  const subs = Auth.user.subscriptions || [];
  const isSubbed = subs.includes(channelOrUserId);
  const newSubs = isSubbed ? subs.filter(id => id !== channelOrUserId) : [...subs, channelOrUserId];

  Auth.updateUser({ subscriptions: newSubs });

  // Si es un usuario real de VideoNow (no canal mock), actualiza su contador y notifícalo
  const targetUser = Auth.getUser(channelOrUserId);
  if (targetUser) {
    const users = Auth.getAllUsers();
    const idx = users.findIndex(u => u.id === channelOrUserId);
    if (idx !== -1) {
      users[idx].subscribers = Math.max(0, (users[idx].subscribers || 0) + (isSubbed ? -1 : 1));
      localStorage.setItem('vn_users', JSON.stringify(users));
    }
    if (!isSubbed) {
      notifyIfEnabled(targetUser, 'notifySubscribers', {
        type: 'subscriber',
        text: `${Auth.user.name} se suscribió a tu canal.`,
      });
    }
  }

  return { ok: true, subscribed: !isSubbed };
}

function isSubscribedTo(channelOrUserId) {
  return (Auth.user?.subscriptions || []).includes(channelOrUserId);
}
