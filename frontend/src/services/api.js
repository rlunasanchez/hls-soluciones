import axios from 'axios';
import { invalidar } from './cache';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Prefijo de recurso a partir de la URL relativa: "/api/clientes/5" -> "/api/clientes"
function prefijoRecurso(url) {
  const partes = String(url || '').split('?')[0].split('/').filter(Boolean);
  return partes.length >= 2 ? `/${partes[0]}/${partes[1]}` : `/${partes[0] || ''}`;
}

api.interceptors.response.use(
  (response) => {
    // Cualquier escritura (POST/PUT/DELETE) invalida el cache de su recurso
    // para que la próxima lectura vaya a la red en vez de servir datos viejos.
    const metodo = (response.config?.method || 'get').toLowerCase();
    if (metodo !== 'get') {
      invalidar(prefijoRecurso(response.config?.url));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;