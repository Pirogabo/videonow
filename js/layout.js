/* ================================================================
   VIDEONOW — LAYOUT COMÚN
   Maneja: estado del header (login/logout), dropdown de usuario,
   notificaciones, activo en sidebar/navbar, búsqueda global,
   modal de subida de video (4 pasos).
   ================================================================ */

function initLayout() {
  const page = document.body.getAttribute('data-page') || '';
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-nav') === page);
  });

  renderHeaderAuth();
  Auth.onChange(renderHeaderAuth);

  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', onSearchSubmit);

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      closeUserMenu();
      closeNotifMenu();
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#user-menu-wrap')) closeUserMenu();
    if (!e.target.closest('#notif-menu-wrap')) closeNotifMenu();
  });
}

/* ================================================================
   HEADER: estado de sesión, dropdown de usuario, notificaciones
   ================================================================ */

function renderHeaderAuth() {
  const slot = document.getElementById('header-auth-slot');
  if (!slot) return;

  if (Auth.isLoggedIn()) {
    const u = Auth.user;
    const initial = (u.name || u.email || '?').charAt(0).toUpperCase();
    const unread = getUnreadCount(u.id);

    slot.innerHTML = `
      <div id="notif-menu-wrap" style="position:relative;">
        <button id="notif-bell-btn" onclick="toggleNotifMenu(event)" aria-label="Notificaciones" style="position:relative;background:none;border:none;cursor:pointer;padding:6px;display:flex;align-items:center;">
          <svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path d="M12 2a6 6 0 0 0-6 6v3.5c0 .9-.36 1.77-1 2.4L4 15h16l-1-1.1c-.64-.63-1-1.5-1-2.4V8a6 6 0 0 0-6-6zM9.5 18a2.5 2.5 0 0 0 5 0" stroke="#555" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ${unread > 0 ? `<span style="position:absolute;top:0;right:0;background:var(--accent-dark);color:#fff;font-size:9px;font-weight:bold;border-radius:8px;min-width:14px;height:14px;display:flex;align-items:center;justify-content:center;padding:0 3px;">${unread > 9 ? '9+' : unread}</span>` : ''}
        </button>
        <div id="notif-dropdown" class="hidden" style="position:absolute;top:36px;right:0;width:300px;background:#fff;border:1px solid var(--border);border-radius:4px;box-shadow:0 4px 18px rgba(0,0,0,0.15);z-index:1100;max-height:380px;overflow-y:auto;"></div>
      </div>
      <div id="user-menu-wrap" style="position:relative;">
        <button id="user-menu-btn" onclick="toggleUserMenu(event)">
          <span class="user-avatar-hdr">${u.avatar ? `<img src="${sanitizeAttr(u.avatar)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : sanitize(initial)}</span>
          ${sanitize(u.name || u.email)}
        </button>
        <div id="user-dropdown" class="hidden" style="position:absolute;top:36px;right:0;width:200px;background:#fff;border:1px solid var(--border);border-radius:4px;box-shadow:0 4px 18px rgba(0,0,0,0.15);z-index:1100;overflow:hidden;">
          <a href="profile.html" class="user-dd-item">Mi perfil</a>
          <a href="myvideos.html" class="user-dd-item">Mis videos</a>
          <a href="channel.html?id=${encodeURIComponent(u.id)}" class="user-dd-item">Ver canal</a>
          <a href="settings.html" class="user-dd-item">Ajustes</a>
          <div style="border-top:1px solid var(--border);"></div>
          <a href="#" class="user-dd-item" onclick="doLogout(event)">Cerrar sesión</a>
        </div>
      </div>`;
  } else {
    slot.innerHTML = `
      <a href="login.html" class="btn-signin-hdr">Iniciar sesión</a>
      <a href="register.html" class="btn-create-acc">Crear cuenta</a>`;
  }
}

function sanitizeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  closeNotifMenu();
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('hidden');
}
function closeUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.add('hidden');
}

function toggleNotifMenu(e) {
  if (e) e.stopPropagation();
  closeUserMenu();
  const dd = document.getElementById('notif-dropdown');
  if (!dd) return;
  const willOpen = dd.classList.contains('hidden');
  dd.classList.toggle('hidden');
  if (willOpen) renderNotifDropdown();
}
function closeNotifMenu() {
  const dd = document.getElementById('notif-dropdown');
  if (dd) dd.classList.add('hidden');
}

function renderNotifDropdown() {
  const dd = document.getElementById('notif-dropdown');
  if (!dd || !Auth.isLoggedIn()) return;

  const notifs = getNotifications(Auth.user.id).slice(0, 10);
  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--border);">
      <strong style="font-size:13px;">Notificaciones</strong>
      <a href="#" onclick="markAllRead(event)" style="font-size:11px;">Marcar todo como leído</a>
    </div>`;

  if (!notifs.length) {
    dd.innerHTML = header + `<div style="padding:24px 12px;text-align:center;color:var(--text-muted);font-size:12px;">Sin notificaciones</div>`;
    return;
  }

  const items = notifs.map(n => `
    <a href="${n.videoId ? 'watch.html?v=' + encodeURIComponent(n.videoId) : '#'}"
       onclick="markNotificationRead('${Auth.user.id}', '${n.id}')"
       style="display:block;padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:var(--text);${n.read ? '' : 'background:rgba(0,201,133,0.06);font-weight:bold;'}">
      ${sanitize(n.text)}
      <div style="font-size:10px;color:var(--text-muted);font-weight:normal;margin-top:2px;">${formatRelativeTime(n.createdAt)}</div>
    </a>`).join('');

  dd.innerHTML = header + items;
}

function markAllRead(e) {
  if (e) e.preventDefault();
  if (!Auth.isLoggedIn()) return;
  markAllNotificationsRead(Auth.user.id);
  renderNotifDropdown();
  renderHeaderAuth();
}

function doLogout(e) {
  if (e) e.preventDefault();
  Auth.logout();
  showToast('Sesión cerrada');
  setTimeout(() => window.location.href = 'index.html', 500);
}

/* ================================================================
   BÚSQUEDA
   ================================================================ */

function onSearchSubmit(e) {
  e.preventDefault();
  if (!RateLimiter.check('search', 12, 60000)) {
    showToast('Buscas demasiado rápido — espera un momento');
    return;
  }
  const input = document.getElementById('search-input');
  const q = (input.value || '').trim();
  if (!q) return;
  window.location.href = 'search.html?q=' + encodeURIComponent(q.slice(0, 200));
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/* ================================================================
   MODAL DE SUBIDA — 4 pasos
   1) Selección de archivo  2) Metadatos  3) Progreso  4) Éxito
   ================================================================ */

let _uploadState = { file: null };

function openUploadModal(e) {
  if (e) e.preventDefault();
  if (!requireAuth(null, 'Inicia sesión para subir videos')) return;
  _uploadState = { file: null };
  goToUploadStep(1);
  const m = document.getElementById('modal-upload');
  if (m) m.classList.add('open');
}

function closeUploadModal() {
  const m = document.getElementById('modal-upload');
  if (m) m.classList.remove('open');
  _uploadState = { file: null };
}

function goToUploadStep(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('upload-step-' + i);
    if (el) el.classList.toggle('hidden', i !== step);
  }
}

function onUploadFileSelected(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!isAllowedVideoFile(file)) {
    showToast('Formato no permitido. Usa MP4, WebM, MOV, MKV o AVI.');
    return;
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    showToast('El archivo supera el límite de 100 GB.');
    return;
  }
  _uploadState.file = file;
  const nameEl = document.getElementById('upload-filename');
  const sizeEl = document.getElementById('upload-filesize');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatBytes(file.size);
  goToUploadStep(2);
}

function onUploadTagsInput(input) {
  const tags = input.value.split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length > 10) {
    showToast('Máximo 10 tags');
    input.value = tags.slice(0, 10).join(', ');
  }
}

async function submitUploadMetadata(e) {
  e.preventDefault();
  if (!_uploadState.file) { showToast('Selecciona un archivo primero'); return; }
  if (!RateLimiter.check('upload', 10, 86400000)) {
    showToast('Límite diario de subidas alcanzado (10/día)');
    return;
  }

  const title = document.getElementById('upload-title').value.trim();
  const desc = document.getElementById('upload-desc').value.trim();
  const cat = document.getElementById('upload-cat').value;
  const tagsRaw = document.getElementById('upload-tags').value;
  const visibility = document.querySelector('input[name="upload-visibility"]:checked')?.value || 'public';

  if (title.length < 1) { showToast('Ponle un título al video'); return; }

  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);

  goToUploadStep(3);
  const fill = document.getElementById('upload-progress-fill');
  const statusText = document.getElementById('upload-status-text');

  const onProgress = (pct, phase) => {
    if (fill) fill.style.width = Math.round(pct) + '%';
    if (statusText) {
      if (phase === 'processing') statusText.textContent = 'Generando miniatura…';
      else if (phase === 'uploading') statusText.textContent = `Subiendo… ${Math.round(pct)}%`;
      else if (phase === 'done') statusText.textContent = '¡Listo!';
      else if (phase === 'error') statusText.textContent = 'Error en la subida.';
    }
  };

  const result = await publishVideo(_uploadState.file, { title, desc, cat, tags, visibility }, onProgress);

  if (!result.ok) {
    showToast(result.error);
    goToUploadStep(2);
    return;
  }

  // Paso 4 — éxito
  const thumbImg = document.getElementById('upload-success-thumb');
  if (thumbImg) {
    if (result.video.thumb) { thumbImg.src = result.video.thumb; thumbImg.classList.remove('hidden'); }
    else thumbImg.classList.add('hidden');
  }
  const watchBtn = document.getElementById('upload-success-watch-btn');
  if (watchBtn) watchBtn.href = 'watch.html?v=' + encodeURIComponent(result.video.id);

  goToUploadStep(4);
}

function uploadAnother() {
  _uploadState = { file: null };
  goToUploadStep(1);
  const fileInput = document.getElementById('upload-file-input');
  if (fileInput) fileInput.value = '';
  const form = document.getElementById('upload-metadata-form');
  if (form) form.reset();
}

document.addEventListener('DOMContentLoaded', initLayout);
