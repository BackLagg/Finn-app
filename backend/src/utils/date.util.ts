/**
 * Парсит дату из строки формата YYYY-MM-DD в локальном времени.
 * Устанавливает время на полдень (12:00) чтобы избежать проблем с timezone.
 * 
 * @param dateStr - Строка даты в формате YYYY-MM-DD
 * @returns Date объект в локальном времени
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
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

/**
 * Парсит дату из строки формата YYYY-MM-DD для query параметров.
 * Устанавливает время на начало дня (00:00) для корректной фильтрации диапазонов.
 * 
 * @param dateStr - Строка даты в формате YYYY-MM-DD
 * @returns Date объект в локальном времени
 */
export function parseQueryDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    0,
    0,
    0,
    0
  );
}
