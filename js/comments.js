/* ================================================================
   VIDEONOW — COMENTARIOS (mock en localStorage)
   Clave: "vn_comments" = { [videoId]: [comentario, ...] }
   ================================================================ */

function _loadAllComments() {
  try { return JSON.parse(localStorage.getItem('vn_comments') || '{}'); }
  catch { return {}; }
}
function _saveAllComments(all) {
  localStorage.setItem('vn_comments', JSON.stringify(all));
}

function getVideoComments(videoId) {
  const all = _loadAllComments();
  return all[videoId] || [];
}

function _setVideoComments(videoId, comments) {
  const all = _loadAllComments();
  all[videoId] = comments;
  _saveAllComments(all);
}

/**
 * Publica un comentario nuevo en un video. Genera notificación para
 * el propietario del video (si no es el propio autor del comentario).
 */
function postComment(videoId, text) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para comentar.' };
  text = (text || '').trim();
  if (!text) return { ok: false, error: 'El comentario no puede estar vacío.' };
  if (text.length > 2000) return { ok: false, error: 'El comentario es demasiado largo (máx. 2000 caracteres).' };

  const comments = getVideoComments(videoId);
  const comment = {
    id: 'cmt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    videoId,
    authorId: Auth.user.id,
    authorName: Auth.user.name,
    text,
    likes: 0,
    likedBy: [],
    replies: [],
    createdAt: new Date().toISOString(),
    edited: false,
  };
  comments.unshift(comment);
  _setVideoComments(videoId, comments);

  _notifyVideoOwner(videoId, `${Auth.user.name} comentó en tu video: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`, 'comment');

  return { ok: true, comment };
}

function postReply(videoId, commentId, text) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para responder.' };
  text = (text || '').trim();
  if (!text) return { ok: false, error: 'La respuesta no puede estar vacía.' };
  if (text.length > 2000) return { ok: false, error: 'La respuesta es demasiado larga.' };

  const comments = getVideoComments(videoId);
  const parent = comments.find(c => c.id === commentId);
  if (!parent) return { ok: false, error: 'Comentario no encontrado.' };

  const reply = {
    id: 'rep_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    authorId: Auth.user.id,
    authorName: Auth.user.name,
    text,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  parent.replies.push(reply);
  _setVideoComments(videoId, comments);

  if (parent.authorId !== Auth.user.id) {
    const owner = Auth.getUser(parent.authorId);
    notifyIfEnabled(owner, 'notifyComments', {
      type: 'reply',
      text: `${Auth.user.name} respondió a tu comentario: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
      videoId,
    });
  }

  return { ok: true, reply };
}

function toggleCommentLike(videoId, commentId) {
  if (!Auth.isLoggedIn()) return { ok: false, error: 'Inicia sesión para reaccionar.' };
  const comments = getVideoComments(videoId);
  const c = comments.find(x => x.id === commentId);
  if (!c) return { ok: false, error: 'Comentario no encontrado.' };
  if (c.authorId === Auth.user.id) return { ok: false, error: 'No puedes votar tu propio comentario.' };

  const idx = c.likedBy.indexOf(Auth.user.id);
  if (idx === -1) { c.likedBy.push(Auth.user.id); c.likes++; }
  else { c.likedBy.splice(idx, 1); c.likes--; }

  _setVideoComments(videoId, comments);
  return { ok: true, liked: idx === -1, likes: c.likes };
}

function editComment(videoId, commentId, newText) {
  newText = (newText || '').trim();
  if (!newText) return { ok: false, error: 'El comentario no puede quedar vacío.' };
  const comments = getVideoComments(videoId);
  const c = comments.find(x => x.id === commentId);
  if (!c) return { ok: false, error: 'Comentario no encontrado.' };
  if (c.authorId !== Auth.user?.id) return { ok: false, error: 'Solo puedes editar tus propios comentarios.' };

  c.text = newText.slice(0, 2000);
  c.edited = true;
  _setVideoComments(videoId, comments);
  return { ok: true };
}

function deleteComment(videoId, commentId) {
  const comments = getVideoComments(videoId);
  const c = comments.find(x => x.id === commentId);
  if (!c) return { ok: false, error: 'Comentario no encontrado.' };
  if (c.authorId !== Auth.user?.id) return { ok: false, error: 'Solo puedes eliminar tus propios comentarios.' };

  _setVideoComments(videoId, comments.filter(x => x.id !== commentId));
  return { ok: true };
}

function sortComments(comments, mode) {
  const arr = [...comments];
  if (mode === 'top') arr.sort((a, b) => b.likes - a.likes);
  else arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return arr;
}

function _notifyVideoOwner(videoId, text, type) {
  const video = getVideoById(videoId);
  if (!video) return;
  const ownerId = String(video.id).startsWith('uv_') ? video.uploadedBy : null;
  if (!ownerId || ownerId === Auth.user?.id) return;
  const owner = Auth.getUser(ownerId);
  notifyIfEnabled(owner, 'notifyComments', { type, text, videoId });
}

/** Autocompletado de menciones @usuario — devuelve hasta 5 coincidencias. */
function searchUsersForMention(query) {
  query = (query || '').toLowerCase().replace(/^@/, '');
  if (!query) return [];
  return Auth.getAllUsers()
    .filter(u => u.handle.toLowerCase().includes(query) || u.name.toLowerCase().includes(query))
    .slice(0, 5);
}
