import axios from 'axios';
import mockAdapter from './mockApi';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Demo mode: no backend deployed — serve canned sample data from the mock layer.
// Set REACT_APP_API_URL at build time to talk to a real backend instead.
if (!process.env.REACT_APP_API_URL) {
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${original.baseURL?.replace('/api', '') || ''}/api/auth/refresh`,
            { refreshToken }
          );
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch (_) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
