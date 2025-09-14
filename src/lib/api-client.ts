import axios from 'axios';
import { toast } from '@/hooks/use-toast';

export const API_BASE_URL = 'http://localhost:8080/api/v1';

// Создаем экземпляр axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ответов
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Очищаем токен
      localStorage.removeItem('access_token');
      
      // Показываем уведомление
      toast({
        title: "Сессия истекла",
        description: "Пожалуйста, войдите снова",
        variant: "destructive",
      });
      
      // Диспатчим событие для уведомления приложения о необходимости разлогина
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;