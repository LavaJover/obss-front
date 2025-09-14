import { format } from 'date-fns'; // Добавьте этот импорт

// Функция для преобразования Go времени в JavaScript Date
export const convertGoTimeToJSDate = (goTime: string): Date => {
  try {
    return new Date(goTime);
  } catch (error) {
    console.error('Error converting Go time to JS Date:', error, goTime);
    return new Date();
  }
};

// Функция для безопасного форматирования даты
export const safeFormatDate = (
  goTimeString: string | null | undefined, 
  formatString: string
): string => {
  if (!goTimeString) return "—";
  
  try {
    const date = convertGoTimeToJSDate(goTimeString);
    return isNaN(date.getTime()) ? "—" : format(date, formatString); // Теперь format доступна
  } catch (error) {
    console.error("Error formatting date:", error, goTimeString);
    return "—";
  }
};