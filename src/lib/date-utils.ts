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
// В date-utils.tsx
export const safeFormatDate = (
  date: Date | string | null | undefined,
  formatString: string
): string => {
  if (!date) return "—";

  try {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return isNaN(parsedDate.getTime()) ? "—" : format(parsedDate, formatString);
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "—";
  }
};