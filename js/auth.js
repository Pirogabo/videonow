/* ================================================================
   VIDEONOW — AUTH (mock persistente en localStorage)
   ⚠️ Esto NO es seguridad real. passwordHash usa btoa() — una simple
   ofuscación, no un hash criptográfico. Es solo para que la demo
   funcione sin backend. Cuando conectes Supabase (ver SETUP.md),
   sustituye este módulo por supabase.auth.* de verdad.
   ================================================================ */

const STORAGE_KEYS = {
  USERS: 'vn_users',
  SESSION: 'vn_session',
};

function _loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'); }
  catch { return []; }
}
function _saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}
function _loadSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null'); }
  catch { return null; }
}
function _saveSession(session) {
  if (session) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function _isValidHandle(handle) {
  return /^[a-zA-Z0-9_]{2,30}$/.test(handle);
}

function _defaultUserFields() {
  return {
    avatar: null,
    bio: '',
    country: '',
    externalLink: '',
    subscribers: 0,
    videosUploaded: 0,
    totalViews: 0,
    watchHistory: [],
    watchLater: [],
    likedVideos: [],
    dislikedVideos: [],
    subscriptions: [],
    playlists: [],
    settings: {
      historyEnabled: true,
      publicProfile: true,
      notifyComments: true,
      notifyLikes: true,
      notifySubscribers: true,
    },
  };
}

const Auth = (() => {
  let currentUser = null;
  const listeners = [];

  function _notify() { listeners.forEach(fn => fn(currentUser)); }

  function _hydrateFromSession() {
    const session = _loadSession();
    if (!session) { currentUser = null; return; }
    const users = _loadUsers();
    const found = users.find(u => u.id === session.userId);
    currentUser = found || null;
    if (!found) _saveSession(null);
  }

  _hydrateFromSession();

  return {
    get user() { return currentUser; },

    isLoggedIn() { return !!currentUser; },

    onChange(fn) { listeners.push(fn); },

    register({ name, email, password, handle, dob, country }) {
      email = (email || '').trim().toLowerCase();
      handle = (handle || '').trim().replace(/^@/, '');
      name = (name || '').trim();

      if (!isValidEmail(email)) return { ok: false, error: 'Email no válido.' };
      if (name.length < 2) return { ok: false, error: 'El nombre es demasiado corto.' };
      if (!password || password.length < 8) return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
      if (!isOldEnough(dob, 13)) return { ok: false, error: 'Debes tener 13 años o más para registrarte.' };
      if (handle && !_isValidHandle(handle)) return { ok: false, error: 'El nombre de usuario solo puede tener letras, números y guion bajo.' };

      const users = _loadUsers();
      if (users.some(u => u.email === email)) return { ok: false, error: 'Ya existe una cuenta con ese email.' };

      if (!handle) {
        handle = (name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'usuario') + Math.floor(Math.random() * 10000);
      }
      let finalHandle = handle;
      let n = 1;
      while (users.some(u => u.handle.toLowerCase() === finalHandle.toLowerCase())) {
        finalHandle = handle + n;
        n++;
      }

      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        email,
        passwordHash: btoa(unescape(encodeURIComponent(password))),
        name,
        handle: finalHandle,
        dob: dob || '',
        createdAt: new Date().toISOString(),
        ..._defaultUserFields(),
      };

      users.push(newUser);
      _saveUsers(users);
      return { ok: true, user: newUser };
    },

    login(email, password) {
      email = (email || '').trim().toLowerCase();
      if (!email || !password) return { ok: false, error: 'Completa email y contraseña.' };

      const users = _loadUsers();
      const found = users.find(u => u.email === email);
      if (!found) return { ok: false, error: 'No existe una cuenta con ese email.' };

      const hash = btoa(unescape(encodeURIComponent(password)));
      if (found.passwordHash !== hash) return { ok: false, error: 'Contraseña incorrecta.' };

      currentUser = found;
      _saveSession({ userId: found.id, loginAt: new Date().toISOString() });
      _notify();
      return { ok: true, user: found };
    },

    logout() {
      currentUser = null;
      _saveSession(null);
      _notify();
    },

    updateUser(fields) {
      if (!currentUser) return { ok: false, error: 'No has iniciado sesión.' };

      // Si se cambia el handle, validar unicidad
      if (fields.handle && fields.handle !== currentUser.handle) {
        if (!_isValidHandle(fields.handle)) return { ok: false, error: 'Nombre de usuario no válido.' };
        const users = _loadUsers();
        if (users.some(u => u.id !== currentUser.id && u.handle.toLowerCase() === fields.handle.toLowerCase())) {
          return { ok: false, error: 'Ese nombre de usuario ya está en uso.' };
        }
      }

      const users = _loadUsers();
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx === -1) return { ok: false, error: 'Usuario no encontrado.' };

      users[idx] = { ...users[idx], ...fields };
      currentUser = users[idx];
      _saveUsers(users);
      _notify();
      return { ok: true, user: currentUser };
    },

    changePassword(currentPassword, newPassword) {
      if (!currentUser) return { ok: false, error: 'No has iniciado sesión.' };
      const hash = btoa(unescape(encodeURIComponent(currentPassword)));
      if (currentUser.passwordHash !== hash) return { ok: false, error: 'La contraseña actual no es correcta.' };
      if (!newPassword || newPassword.length < 8) return { ok: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };

      const users = _loadUsers();
      const idx = users.findIndex(u => u.id === currentUser.id);
      users[idx].passwordHash = btoa(unescape(encodeURIComponent(newPassword)));
      currentUser = users[idx];
      _saveUsers(users);
      return { ok: true };
    },

    deleteAccount() {
      if (!currentUser) return { ok: false, error: 'No has iniciado sesión.' };
      const users = _loadUsers().filter(u => u.id !== currentUser.id);
      _saveUsers(users);
      // Limpiar también los vídeos subidos por este usuario
      try {
        const videos = JSON.parse(localStorage.getItem('vn_videos') || '[]');
        const remaining = videos.filter(v => v.uploadedBy !== currentUser.id);
        localStorage.setItem('vn_videos', JSON.stringify(remaining));
      } catch {}
      this.logout();
      return { ok: true };
    },

    getUser(userId) {
      return _loadUsers().find(u => u.id === userId) || null;
    },

    getUserByHandle(handle) {
      handle = (handle || '').replace(/^@/, '').toLowerCase();
      return _loadUsers().find(u => u.handle.toLowerCase() === handle) || null;
    },

    getAllUsers() {
      return _loadUsers();
    },

    exportUserData() {
      if (!currentUser) return null;
      return JSON.stringify(currentUser, null, 2);
    },
  };
})();
