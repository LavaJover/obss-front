import { AppConfig } from './types';
import { defaultConfig } from './defaultConfig';

class ConfigService {
  private config: AppConfig = defaultConfig;
  private isLoaded = false;

  async loadConfig(): Promise<AppConfig> {
    if (this.isLoaded) {
      return this.config;
    }

    try {
      // Пробуем загрузить кастомный конфиг из public/config
      const response = await fetch('/config/app-config.json');
      
      if (response.ok) {
        const customConfig = await response.json();
        this.config = this.deepMerge(defaultConfig, customConfig);
        console.log('Кастомная конфигурация загружена успешно');
      } else {
        console.warn('Кастомный конфиг не найден, используется конфиг по умолчанию');
      }
    } catch (error) {
      console.warn('Ошибка загрузки конфига, используется конфиг по умолчанию:', error);
    }

    this.isLoaded = true;
    return this.config;
  }

  getConfig(): AppConfig {
    if (!this.isLoaded) {
      console.warn('Конфиг еще не загружен, возвращаем конфиг по умолчанию');
      return defaultConfig;
    }
    return this.config;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

export const configService = new ConfigService();