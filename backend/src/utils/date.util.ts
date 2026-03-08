/**
 * Парсит дату из строки формата YYYY-MM-DD в UTC полночь.
 * Это гарантирует, что дата будет сохранена в MongoDB как начало дня в UTC,
 * и при сериализации обратно в JSON дата останется той же.
 * 
 * @param dateStr - Строка даты в формате YYYY-MM-DD
 * @returns Date объект в UTC (полночь указанного дня)
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Date.UTC(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    0,
    0,
    0,
    0
  ));
}

/**
 * Парсит дату из строки формата YYYY-MM-DD для query параметров.
 * Устанавливает время на начало дня в UTC для корректной фильтрации диапазонов.
 * 
 * @param dateStr - Строка даты в формате YYYY-MM-DD
 * @returns Date объект в UTC (полночь указанного дня)
 */
export function parseQueryDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Date.UTC(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    0,
    0,
    0,
    0
  ));
}
