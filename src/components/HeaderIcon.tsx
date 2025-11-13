import { useConfig } from '@/contexts/ConfigContext';

interface HeaderIconProps {
  className?: string;
}

export const HeaderIcon: React.FC<HeaderIconProps> = ({ className = "" }) => {
  const { config } = useConfig();
  const { headerIcon, headerIconSize = 24 } = config.site.icons;

  const renderIcon = () => {
    // Если это emoji
    if (/^\p{Emoji}$/u.test(headerIcon)) {
      return (
        <span 
          className={`${className} flex items-center justify-center`}
          style={{ fontSize: headerIconSize }}
        >
          {headerIcon}
        </span>
      );
    }

    // Если это путь к изображению (начинается с / или http)
    if (headerIcon.startsWith('/') || headerIcon.startsWith('http')) {
      return (
        <img 
          src={headerIcon} 
          alt="Logo" 
          className={className}
          style={{ 
            width: headerIconSize, 
            height: headerIconSize 
          }}
        />
      );
    }

    // Если это имя иконки из Lucide (можно расширить для других библиотек)
    return (
      <div 
        className={`${className} flex items-center justify-center`}
        style={{ width: headerIconSize, height: headerIconSize }}
      >
        {/* Здесь можно добавить рендеринг иконок из Lucide по имени */}
        <span className="text-lg font-bold">{headerIcon}</span>
      </div>
    );
  };

  return renderIcon();
};