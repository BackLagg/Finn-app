/**
 * Форматирует Date объект в строку формата YYYY-MM-DD в локальном времени.
 * Избегает проблем с timezone при использовании toISOString().
 * 
 * @param date - Date объект для форматирования
 * @returns Строка даты в формате YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Парсит строку даты формата YYYY-MM-DD или ISO в Date объект.
 * Извлекает только компоненты даты (год, месяц, день) игнорируя время и timezone.
 * Это гарантирует, что дата "2026-03-08" всегда будет интерпретирована как 8 марта,
 * независимо от того, в каком формате она пришла с сервера (UTC или локальное время).
 * 
 * Примеры:
 * - "2026-03-08" -> Date(2026, 2, 8) = 8 марта 2026
 * - "2026-03-08T00:00:00.000Z" -> Date(2026, 2, 8) = 8 марта 2026
 * - "2026-03-08T21:00:00.000Z" -> Date(2026, 2, 8) = 8 марта 2026
 * 
 * @param dateStr - Строка даты в формате YYYY-MM-DD или ISO
 * @returns Date объект с компонентами даты из строки (время 00:00 локальное)
 */
export function parseLocalDate(dateStr: string): Date {
  const datePart = dateStr.split('T')[0];
  const parts = datePart.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}
