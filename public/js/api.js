/* Shared helpers: token storage, fetch wrapper, header cart-count, logout */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}
function setToken(token) {
  localStorage.setItem('token', token);
}
function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}
function isLoggedIn() {
  return !!getToken();
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function formatPrice(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function logout() {
  clearToken();
  window.location.href = '/index.html';
}

// ---------- Header rendering (nav auth state + cart badge) ----------
async function renderHeaderState() {
  const authLink = document.getElementById('auth-link');
  const ordersLink = document.getElementById('orders-link');
  if (!authLink) return;

  if (isLoggedIn()) {
    const user = getUser();
    authLink.textContent = `Log out (${user ? user.name.split(' ')[0] : 'Account'})`;
    authLink.href = '#';
    authLink.onclick = (e) => {
      e.preventDefault();
      logout();
    };
    if (ordersLink) ordersLink.classList.remove('hidden');
  } else {
    authLink.textContent = 'Log in';
    authLink.href = '/login.html';
    if (ordersLink) ordersLink.classList.add('hidden');
  }

  await updateCartBadge();
}

async function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;

  if (!isLoggedIn()) {
    badge.textContent = '0';
    badge.classList.add('hidden');
    return;
  }

  try {
    const cart = await apiFetch('/cart');
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    badge.textContent = String(count);
    badge.classList.toggle('hidden', count === 0);
  } catch (e) {
    badge.classList.add('hidden');
  }
}

// ---------- Search form (header) ----------
function wireHeaderSearch() {
  const form = document.getElementById('header-search-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('header-search-input').value.trim();
    window.location.href = q ? `/index.html?search=${encodeURIComponent(q)}` : '/index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeaderState();
  wireHeaderSearch();
});
