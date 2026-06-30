/* ================================================================
   VIDEONOW — NOTIFICACIONES (mock en localStorage)
   Clave: "vn_notifs_<userId>"
   ================================================================ */

function _notifKey(userId) { return 'vn_notifs_' + userId; }

function getNotifications(userId) {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(_notifKey(userId)) || '[]'); }
  catch { return []; }
}

function _saveNotifications(userId, notifs) {
  localStorage.setItem(_notifKey(userId), JSON.stringify(notifs));
}

/**
 * Crea una notificación para un usuario. No notifica a quien provoca
 * la acción (p. ej. no te notificas a ti mismo si comentas tu propio video).
 */
function createNotification(userId, { type, text, videoId }) {
  if (!userId) return;
  const notifs = getNotifications(userId);
  notifs.unshift({
    id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type,
    text,
    videoId: videoId || null,
    read: false,
    createdAt: new Date().toISOString(),
  });
  // Límite razonable para no inflar localStorage indefinidamente
  _saveNotifications(userId, notifs.slice(0, 200));
}

function getUnreadCount(userId) {
  return getNotifications(userId).filter(n => !n.read).length;
}

function markNotificationRead(userId, notifId) {
  const notifs = getNotifications(userId);
  const n = notifs.find(x => x.id === notifId);
  if (n) n.read = true;
  _saveNotifications(userId, notifs);
}

function markAllNotificationsRead(userId) {
  const notifs = getNotifications(userId).map(n => ({ ...n, read: true }));
  _saveNotifications(userId, notifs);
}

/** Respeta los ajustes de notificación del destinatario antes de crear la notificación. */
function notifyIfEnabled(targetUser, settingKey, payload) {
  if (!targetUser) return;
  const settings = targetUser.settings || {};
  if (settings[settingKey] === false) return; // explícitamente desactivado
  createNotification(targetUser.id, payload);
}
