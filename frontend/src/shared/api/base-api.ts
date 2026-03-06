import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { handleError } from '../lib/error-handler';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080/api' : 'https://finn-backend-as35.onrender.com/api');

export const FILE_BASE_URL = API_BASE_URL.replace('/api', '');

// Утилита для получения initData из Telegram WebApp
export const getInitData = (): string => {
  return window?.Telegram?.WebApp?.initData || '';
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

apiClient.interceptors.request.use((config) => {
  const initData = getInitData();
  if (initData) config.headers['X-Init-Data'] = initData;
  return config;
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Централизованная обработка ошибок
    // Не показываем toast здесь, так как это будет делаться в компонентах/hooks
    // Просто логируем в development
    if (import.meta.env.DEV) {
      handleError(error, false);
    }
    return Promise.reject(error);
  }
);

// Экспорт экземпляра для прямого использования
export default apiClient;

