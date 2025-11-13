import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppConfig } from '@/config/types';
import { configService } from '@/config/configService';

interface ConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeConfig = async () => {
      try {
        setIsLoading(true);
        const loadedConfig = await configService.loadConfig();
        setConfig(loadedConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки конфигурации');
        console.error('Failed to load config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConfig();
  }, []);

  const value: ConfigContextType = {
    config,
    isLoading,
    error
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};