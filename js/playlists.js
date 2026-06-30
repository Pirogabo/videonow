/* ================================================================
   VIDEONOW — PLAYLISTS
   Viven dentro de Auth.user.playlists (ver js/auth.js).
   Este módulo solo orquesta las operaciones sobre esa lista.
   ================================================================ */

function createPlaylist(name, visibility) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para crear listas.' };
  name = (name || '').trim();
  if (name.length < 1) return { ok: false, error: 'Ponle un nombre a la lista.' };
  if (name.length > 100) return { ok: false, error: 'Nombre demasiado largo.' };

  const playlist = {
    id: 'pl_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name,
    description: '',
    visibility: visibility === 'private' ? 'private' : 'public',
    videoIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const playlists = [...(Auth.user.playlists || []), playlist];
  const result = Auth.updateUser({ playlists });
  if (!result.ok) return result;
  return { ok: true, playlist };
}

function deletePlaylist(playlistId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'No has iniciado sesión.' };
  const playlists = (Auth.user.playlists || []).filter(p => p.id !== playlistId);
  return Auth.updateUser({ playlists });
}

function renamePlaylist(playlistId, newName, newDescription) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'No has iniciado sesión.' };
  const playlists = (Auth.user.playlists || []).map(p =>
    p.id === playlistId
      ? { ...p, name: newName?.trim() || p.name, description: newDescription ?? p.description, updatedAt: new Date().toISOString() }
      : p
  );
  return Auth.updateUser({ playlists });
}

function getUserPlaylists(userId) {
  const user = userId === Auth.user?.id ? Auth.user : Auth.getUser(userId);
  return user?.playlists || [];
}

function getPlaylistById(userId, playlistId) {
  return getUserPlaylists(userId).find(p => p.id === playlistId) || null;
}

function addVideoToPlaylist(playlistId, videoId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para guardar videos.' };
  const playlists = (Auth.user.playlists || []).map(p => {
    if (p.id !== playlistId) return p;
    if (p.videoIds.includes(videoId)) return p;
    return { ...p, videoIds: [...p.videoIds, videoId], updatedAt: new Date().toISOString() };
  });
  return Auth.updateUser({ playlists });
}

function removeVideoFromPlaylist(playlistId, videoId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'No has iniciado sesión.' };
  const playlists = (Auth.user.playlists || []).map(p =>
    p.id === playlistId
      ? { ...p, videoIds: p.videoIds.filter(id => id !== videoId), updatedAt: new Date().toISOString() }
      : p
  );
  return Auth.updateUser({ playlists });
}

function reorderPlaylist(playlistId, newVideoIdsOrder) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'No has iniciado sesión.' };
  const playlists = (Auth.user.playlists || []).map(p =>
    p.id === playlistId
      ? { ...p, videoIds: newVideoIdsOrder, updatedAt: new Date().toISOString() }
      : p
  );
  return Auth.updateUser({ playlists });
}

function isVideoInPlaylist(playlistId, videoId) {
  const p = (Auth.user?.playlists || []).find(x => x.id === playlistId);
  return p ? p.videoIds.includes(videoId) : false;
}

/* ---- "Ver más tarde" — tratado como una lista especial en Auth.user.watchLater ---- */

function toggleWatchLater(videoId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para guardar videos.' };
  const list = Auth.user.watchLater || [];
  const idx = list.indexOf(videoId);
  const newList = idx === -1 ? [...list, videoId] : list.filter(id => id !== videoId);
  const result = Auth.updateUser({ watchLater: newList });
  if (!result.ok) return result;
  return { ok: true, added: idx === -1 };
}

function isInWatchLater(videoId) {
  return (Auth.user?.watchLater || []).includes(videoId);
}
