import { AppConfig } from './types';

export const defaultConfig: AppConfig = {
  site: {
    title: "obmenka",
    name: "obmenka",
    description: "Платформа для обмена валют",
    icons: {
      favicon: "/favicon.ico", // стандартный favicon
      headerIcon: "💎", // можно использовать emoji или путь к изображению
      headerIconSize: 24
    }
  },
  navigation: {
    home: "Главная",
    deals: "Сделки",
    paymentDetails: "Реквизиты",
    history: "История операций",
    statistics: "Статистика",
    settings: "Настройки",
    adminPanel: "Админ-панель",
    teamleadOffice: "Кабинет тимлида"
  },
  messages: {
    logoutSuccess: "Выход выполнен",
    logoutDescription: "Вы успешно вышли из системы",
    loginTitle: "Вход в систему",
    welcomeMessage: "Добро пожаловать"
  },
  features: {
    enableStatistics: true,
    enableTeamLead: true,
    enableAdmin: true
  }
};