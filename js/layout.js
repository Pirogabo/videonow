/* ================================================================
   VIDEONOW — LAYOUT COMÚN
   Maneja: estado del header (login/logout), activo en sidebar/navbar,
   búsqueda global, modales compartidos (login rápido / upload).
   ================================================================ */

function initLayout() {
  // Resaltar el item activo del navbar / sidebar según data-page
  const page = document.body.getAttribute('data-page') || '';
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-nav') === page);
  });

  // Estado de autenticación en el header
  renderHeaderAuth();
  Auth.onChange(renderHeaderAuth);

  // Formulario de búsqueda
  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', onSearchSubmit);

  // Cerrar modales con click en overlay / Escape
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  });
}

function renderHeaderAuth() {
  const slot = document.getElementById('header-auth-slot');
  if (!slot) return;
  if (Auth.isLoggedIn()) {
    const u = Auth.user;
    const initial = (u.name || u.email || '?').charAt(0).toUpperCase();
    slot.innerHTML = `
      <button id="user-menu-btn" onclick="toggleUserMenu()">
        <span class="user-avatar-hdr">${sanitize(initial)}</span>
        ${sanitize(u.name || u.email)}
      </button>`;
  } else {
    slot.innerHTML = `
      <a href="login.html" class="btn-signin-hdr">Sign in</a>
      <a href="register.html" class="btn-create-acc">Create account</a>`;
  }
}

function toggleUserMenu() {
  if (confirm('¿Cerrar sesión?')) {
    Auth.logout();
    showToast('Sesión cerrada');
    setTimeout(() => window.location.href = 'index.html', 600);
  }
}

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

// ---- UPLOAD MODAL (compartido en varias páginas) ----
function openUploadModal(e) {
  if (e) e.preventDefault();
  if (!requireAuth(null, 'Inicia sesión para subir videos')) return;
  const m = document.getElementById('modal-upload');
  if (m) m.classList.add('open');
}
function closeUploadModal() {
  const m = document.getElementById('modal-upload');
  if (m) m.classList.remove('open');
}
function simulateUpload(e) {
  if (e) e.preventDefault();
  if (!RateLimiter.check('upload', 10, 86400000)) {
    showToast('Límite diario de subidas alcanzado (10/día)');
    return;
  }
  const fill = document.getElementById('upload-progress-fill');
  const bar = document.getElementById('upload-progress-bar');
  if (bar) bar.classList.remove('hidden');
  let pct = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 18;
    if (pct >= 100) {
      pct = 100;
      clearInterval(iv);
      setTimeout(() => {
        closeUploadModal();
        showToast('¡Video subido! Procesando…');
      }, 400);
    }
    if (fill) fill.style.width = pct + '%';
  }, 250);
}

document.addEventListener('DOMContentLoaded', initLayout);
