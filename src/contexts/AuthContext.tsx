import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userID: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Функция для извлечения данных из JWT
const parseJwt = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error('Неверный формат JWT токена');
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Ошибка парсинга JWT:', e);
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userID, setUserID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (token) {
          const decoded = parseJwt(token);
          
          if (decoded && decoded.user_id) {
            // Проверяем срок действия токена, если есть поле exp
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
              console.warn('Токен истек');
              logout();
              return;
            }
            
            setIsAuthenticated(true);
            setUserID(decoded.user_id);
          } else {
            console.warn('Токен не содержит userID');
            logout();
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации аутентификации:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Обработчик события unauthorized из интерцептора
    const handleUnauthorized = () => {
      logout();
    };

    // Подписываемся на событие
    window.addEventListener('unauthorized', handleUnauthorized);

    // Отписываемся при размонтировании
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (token: string) => {
    try {
      localStorage.setItem('access_token', token);
      const decoded = parseJwt(token);
      
      if (decoded && decoded.user_id) {
        setIsAuthenticated(true);
        setUserID(decoded.user_id);
      } else {
        throw new Error('Токен не содержит userID');
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUserID(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    userID,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};