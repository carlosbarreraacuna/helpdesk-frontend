import axios from 'axios';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: false,
});

// Request interceptor: add auth token and set Content-Type correctly
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Let Axios set Content-Type automatically for FormData (includes boundary)
    // For everything else default to JSON
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isOnLoginPage = window.location.pathname === '/login';
        // Solo redirigir si no estamos ya en /login y hay un token guardado
        const hasToken = !!localStorage.getItem('auth-token');
        if (!isOnLoginPage && hasToken) {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
