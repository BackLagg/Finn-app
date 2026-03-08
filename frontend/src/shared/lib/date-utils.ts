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
 * Парсит строку даты формата YYYY-MM-DD или ISO в Date объект в локальном времени.
 * Устанавливает время на полдень (12:00) чтобы избежать проблем с timezone.
 * 
 * @param dateStr - Строка даты в формате YYYY-MM-DD или ISO
 * @returns Date объект в локальном времени
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    12,
    0,
    0,
    0
  );
}
