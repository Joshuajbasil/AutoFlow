import axios from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000, headers: { 'X-AutoFlow-Client': 'web', 'Content-Type': 'application/json' } });
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !['/auth/login', '/auth/me'].includes(error.config?.url)) window.dispatchEvent(new Event('autoflow:unauthorized'));
  return Promise.reject(error);
});
export function errorMessage(error) {
  const payload = error.response?.data?.error;
  return payload?.details?.map(item => `${item.field}: ${item.message}`).join(' ') || payload?.message || (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Unable to connect. Check your connection and try again.');
}
