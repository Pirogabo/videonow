/* ================================================================
   VIDEONOW — SECURITY UTILITIES (cliente)
   ⚠️ Esto es una primera línea de defensa SOLO. El rate limiting,
   validación y sanitización REALES deben repetirse en el servidor
   (Supabase Edge Functions + RLS). Ver SETUP.md.
   ================================================================ */

// ---- RATE LIMITER ----
const RateLimiter = (() => {
  const store = {};
  return {
    check(key, maxCalls, windowMs) {
      const now = Date.now();
      if (!store[key]) store[key] = [];
      store[key] = store[key].filter(t => now - t < windowMs);
      if (store[key].length >= maxCalls) return false;
      store[key].push(now);
      return true;
    },
    reset(key) { delete store[key]; }
  };
})();

// ---- SANITIZATION ----
function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  maxLen = maxLen || 500;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, maxLen);
}

function safeText(el, str) { if (el) el.textContent = str; }

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isOldEnough(dobStr, minAge) {
  minAge = minAge || 13;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return false;
  const ageMs = Date.now() - dob.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears >= minAge;
}

function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ---- TOAST ----
function showToast(msg, duration) {
  duration = duration || 2800;
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ---- FAKE AUTH STATE (persisted in-memory only — wire to Supabase Auth) ----
const Auth = (() => {
  let user = null;
  const listeners = [];
  return {
    get user() { return user; },
    isLoggedIn() { return !!user; },
    login(u) { user = u; listeners.forEach(fn => fn(user)); },
    logout() { user = null; listeners.forEach(fn => fn(user)); },
    onChange(fn) { listeners.push(fn); }
  };
})();

function requireAuth(e, msg) {
  if (e && e.preventDefault) e.preventDefault();
  if (!Auth.isLoggedIn()) {
    showToast(msg || 'Inicia sesión para continuar');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
