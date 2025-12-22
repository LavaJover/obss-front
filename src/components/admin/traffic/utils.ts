export const validatePercentageInput = (value: string): string => {
    const cleanedValue = value.replace(/[^\d.]/g, '');
    const parts = cleanedValue.split('.');
    
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 3) {
      return parts[0] + '.' + parts[1].substring(0, 3);
    }
    
    return cleanedValue;
  };
  
  export const parseDurationToMinutes = (duration: string): string => {
    const hourMatch = duration.match(/(\d+)h/);
    const minuteMatch = duration.match(/(\d+)m/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    return (hours * 60 + minutes).toString();
  };
  
  export const formatDurationFromMinutes = (minutes: string): string => {
    const totalMinutes = parseInt(minutes) || 0;
    
    if (totalMinutes === 0) {
      return "0s";
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    // Формируем части
    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    if (mins > 0) {
      parts.push(`${mins}m`);
    }
    
    // Если ничего нет (должно быть невозможно из-за проверки totalMinutes === 0 выше)
    if (parts.length === 0) {
      return "0s";
    }
    
    return parts.join("");
  };
  
  export const formatDecimal = (value: number): string => {
    return (value * 100).toFixed(3);
  };
  
  export const PRIORITY_OPTIONS = [
    { label: "Обычный", value: "1" },
    { label: "Средний", value: "5" },
    { label: "Высокий", value: "15" },
    { label: "Превосходство", value: "1000" }
];