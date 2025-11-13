import { useEffect } from 'react';
import { useConfig } from '@/contexts/ConfigContext';

export const DynamicFavicon: React.FC = () => {
  const { config } = useConfig();

  useEffect(() => {
    const updateFavicon = () => {
      const faviconUrl = config.site.icons.favicon;
      if (!faviconUrl) return;

      // Удаляем существующие favicon элементы
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());

      // Создаем новый favicon элемент
      const link = document.createElement('link');
      link.rel = 'icon';
      
      // Определяем тип в зависимости от расширения файла
      if (faviconUrl.endsWith('.svg')) {
        link.type = 'image/svg+xml';
      } else if (faviconUrl.endsWith('.png')) {
        link.type = 'image/png';
      } else {
        link.type = 'image/x-icon';
      }
      
      link.href = faviconUrl;
      document.head.appendChild(link);
    };

    // Обновляем title
    const updateTitle = () => {
      if (config.site.title) {
        document.title = config.site.title;
      }
    };

    updateFavicon();
    updateTitle();
  }, [config.site.icons.favicon, config.site.title]);

  return null;
};