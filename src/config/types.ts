export interface SiteConfig {
    title: string;
    name: string;
    logo?: string;
    favicon?: string;
    description?: string;
    // Добавляем настройки для иконок
    icons: {
      // Для favicon и title
      favicon: string;
      // Для отображения в header рядом с названием
      headerIcon: string;
      // Размер иконки в header
      headerIconSize?: number;
    };
  }
  
  export interface NavigationConfig {
    home: string;
    deals: string;
    paymentDetails: string;
    history: string;
    statistics: string;
    settings: string;
    adminPanel: string;
    teamleadOffice: string;
  }
  
  export interface MessagesConfig {
    logoutSuccess: string;
    logoutDescription: string;
    loginTitle?: string;
    welcomeMessage?: string;
  }
  
  export interface AppConfig {
    site: SiteConfig;
    navigation: NavigationConfig;
    messages: MessagesConfig;
    features?: {
      enableStatistics?: boolean;
      enableTeamLead?: boolean;
      enableAdmin?: boolean;
    };
  }