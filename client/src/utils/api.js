// MSBT API Request Wrapper with Offline caching capabilities

const BASE_URL = '/api';

// Cache keys
const CACHE_KEYS = {
  DASHBOARD: 'msbt_cache_dashboard',
  CUSTOMERS: 'msbt_cache_customers',
  SEASONS: 'msbt_cache_seasons',
  ENTRIES: 'msbt_cache_entries',
  PAYMENTS: 'msbt_cache_payments'
};

// Local storage token helper
const getToken = () => localStorage.getItem('msbt_token');
export const setToken = (token) => localStorage.setItem('msbt_token', token);
export const clearToken = () => {
  localStorage.removeItem('msbt_token');
  localStorage.removeItem('msbt_user');
};

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic request handler
async function request(endpoint, method = 'GET', body = null, cacheKey = null) {
  const isGet = method === 'GET';
  
  // If offline, serve cache for GET requests immediately
  if (!navigator.onLine && isGet && cacheKey) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.warn('Offline Mode: Serving cached data for:', endpoint);
      return JSON.parse(cached);
    }
  }

  const config = {
    method,
    headers: getHeaders()
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if ((response.status === 401 || response.status === 403) && endpoint !== '/auth/login') {
      // Token expired or invalid
      clearToken();
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('Unauthorized or Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Save to cache if successful GET request
    if (isGet && cacheKey) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    // If request failed (e.g. network disconnect) and we have cache, fallback to it
    if (isGet && cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.warn('Network Error: Serving cached fallback for:', endpoint);
        return JSON.parse(cached);
      }
    }
    throw error;
  }
}

// API Functions
export const api = {
  // Auth
  login: async (username, password) => {
    const data = await request('/auth/login', 'POST', { username, password });
    setToken(data.token);
    localStorage.setItem('msbt_user', JSON.stringify(data.user));
    return data;
  },
  getCurrentUser: () => request('/auth/me'),

  // Dashboard
  getDashboard: (seasonId) => {
    const url = seasonId ? `/dashboard/summary?seasonId=${seasonId}` : '/dashboard/summary';
    const cacheKey = seasonId ? `${CACHE_KEYS.DASHBOARD}_${seasonId}` : CACHE_KEYS.DASHBOARD;
    return request(url, 'GET', null, cacheKey);
  },
  
  getAuditLogs: () => request('/dashboard/audit'),

  // Customers
  getCustomers: () => request('/customers', 'GET', null, CACHE_KEYS.CUSTOMERS),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', 'POST', data),
  updateCustomer: (id, data) => request(`/customers/${id}`, 'PUT', data),

  // Seasons
  getSeasons: () => request('/seasons', 'GET', null, CACHE_KEYS.SEASONS),
  createSeason: (data) => request('/seasons', 'POST', data),
  updateSeasonStatus: (id, status, endDate) => request(`/seasons/${id}/status`, 'PUT', { status, endDate }),

  // Entries
  getEntries: (customerId, seasonId) => {
    let url = '/entries';
    const params = [];
    if (customerId) params.push(`customerId=${customerId}`);
    if (seasonId) params.push(`seasonId=${seasonId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return request(url, 'GET', null, CACHE_KEYS.ENTRIES);
  },
  createEntry: (data) => request('/entries', 'POST', data),
  deleteEntry: (id) => request(`/entries/${id}`, 'DELETE'),

  // Payments
  getPayments: (customerId, seasonId) => {
    let url = '/payments';
    const params = [];
    if (customerId) params.push(`customerId=${customerId}`);
    if (seasonId) params.push(`seasonId=${seasonId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return request(url, 'GET', null, CACHE_KEYS.PAYMENTS);
  },
  createPayment: (data) => request('/payments', 'POST', data),
  deletePayment: (id) => request(`/payments/${id}`, 'DELETE')
};
