/**
 * MSBT API Client
 * - Reads JWT from sessionStorage (or localStorage for "remember me")
 * - Auto-refreshes on 401
 * - All endpoints namespaced
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'msbt_auth_token';
const USER_KEY = 'msbt_auth_user';

// ─── Storage helpers ─────────────────────────────────────────────────────────
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token, remember = false) => {
  if (typeof window === 'undefined') return;
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setStoredUser = (user, remember = false) => {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(user);
  if (remember) localStorage.setItem(USER_KEY, json);
  else sessionStorage.setItem(USER_KEY, json);
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
const request = async (path, options = {}) => {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Token expired → force logout (handled by AuthContext listener)
  if (res.status === 401 || res.status === 403) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || 'Unauthorized'), { status: res.status });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API Error ${res.status}`);
  return data;
};

const get = (path, params) => {
  const url = params && Object.keys(params).length
    ? `${path}?${new URLSearchParams(params)}`
    : path;
  return request(url, { method: 'GET' });
};
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

// ─── Named API methods ────────────────────────────────────────────────────────
export const api = {
  // Auth
  login: (username, password, remember = false) => post('/api/auth/login', { username, password, remember }),
  logout: () => post('/api/auth/logout', {}),
  getMe: () => get('/api/auth/me'),
  updateProfile: (body) => put('/api/auth/me', body),

  // Users
  getUsers: () => get('/api/auth/users'),
  createUser: (body) => post('/api/auth/users', body),
  updateUser: (id, body) => put(`/api/auth/users/${id}`, body),
  deleteUser: (id) => del(`/api/auth/users/${id}`),
  hardDeleteUser: (id) => del(`/api/auth/users/${id}/permanent`),

  // Dashboard
  getDashboard: (params) => get('/api/dashboard/summary', params),
  getAnalytics: (params) => get('/api/dashboard/analytics', params),
  getAuditLogs: () => get('/api/dashboard/audit'),

  // Customers
  getCustomers: (seasonId) => get(`/api/customers${seasonId ? `?seasonId=${seasonId}` : ''}`),
  getCustomer: (id) => get(`/api/customers/${id}`),
  createCustomer: (body) => post('/api/customers', body),
  updateCustomer: (id, body) => put(`/api/customers/${id}`, body),
  deleteCustomer: (id) => del(`/api/customers/${id}`),

  // Seasons
  getSeasons: () => get('/api/seasons'),
  createSeason: (body) => post('/api/seasons', body),
  updateSeasonStatus: (id, body) => put(`/api/seasons/${id}/status`, body),

  // Entries
  getEntries: (params) => get('/api/entries', params),
  createEntry: (body) => post('/api/entries', body),
  updateEntry: (id, body) => put(`/api/entries/${id}`, body),
  deleteEntry: (id) => del(`/api/entries/${id}`),

  // Payments
  getPayments: (params) => get('/api/payments', params),
  createPayment: (body) => post('/api/payments', body),
  updatePayment: (id, body) => put(`/api/payments/${id}`, body),
  deletePayment: (id) => del(`/api/payments/${id}`),

  // Calendar & Tasks
  getCalendarEvents: (params) => get('/api/tasks/calendar', params),
  createTask: (body) => post('/api/tasks', body),
  updateTask: (id, body) => put(`/api/tasks/${id}`, body),
  deleteTask: (id) => del(`/api/tasks/${id}`),
};
