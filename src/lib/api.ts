import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function getToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  // Write to whichever storage already holds the access token
  const inSession = !!sessionStorage.getItem('accessToken');
  const storage = inSession ? sessionStorage : localStorage;
  storage.setItem('accessToken', accessToken);
  storage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshToken = getToken('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          setTokens(data.accessToken, data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          clearTokens();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export { clearTokens };
export default api;
