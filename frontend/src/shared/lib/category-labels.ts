const EXPENSE_KEYS = ['family', 'education', 'pets', 'movies', 'health', 'transport', 'clothing', 'food', 'games', 'books', 'sport', 'cafe', 'shopping', 'other'] as const;

const EXPENSE_CATEGORY_KEYS: Record<string, string> = {
  Семья: 'family',
  Образование: 'education',
  Питомцы: 'pets',
  Кино: 'movies',
  Здоровье: 'health',
  Транспорт: 'transport',
  Одежда: 'clothing',
  Еда: 'food',
  Игры: 'games',
  Книги: 'books',
  Спорт: 'sport',
  Кафе: 'cafe',
  Покупки: 'shopping',
  Другое: 'other',
  Family: 'family',
  Education: 'education',
  Pets: 'pets',
  Movies: 'movies',
  Health: 'health',
  Transport: 'transport',
  Clothing: 'clothing',
  Food: 'food',
  Games: 'games',
  Books: 'books',
  Sport: 'sport',
  Cafe: 'cafe',
  Shopping: 'shopping',
  Other: 'other',
  ...Object.fromEntries(EXPENSE_KEYS.map((k) => [k, k])),
};

const INCOME_KEYS = ['salary', 'sideJob', 'gifts', 'investments', 'other'] as const;

const INCOME_CATEGORY_KEYS: Record<string, string> = {
  Зарплата: 'salary',
  Подработка: 'sideJob',
  Подарки: 'gifts',
  Инвестиции: 'investments',
  Другое: 'other',
  Salary: 'salary',
  'Side job': 'sideJob',
  Gifts: 'gifts',
  Investments: 'investments',
  Other: 'other',
  ...Object.fromEntries(INCOME_KEYS.map((k) => [k, k])),
};

export function getExpenseCategoryKey(category: string): string {
  return EXPENSE_CATEGORY_KEYS[category] ?? 'other';
}

export function getIncomeCategoryKey(category: string): string {
  return INCOME_CATEGORY_KEYS[category] ?? 'other';
}

function fallbackFromKey(key: string): string {
  const segment = key.split('.').pop() ?? key;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function getCategoryLabel(
  t: (key: string, options?: { defaultValue?: string }) => string,
  type: 'expense' | 'income',
  category: string
): string {
  if (!category || typeof category !== 'string') return '';
  const key = type === 'expense' ? getExpenseCategoryKey(category) : getIncomeCategoryKey(category);
  const translationKey = category.startsWith('categories.') ? category : `categories.${type}.${key}`;
  const result = t(translationKey, { defaultValue: category });
  if (!result || result.startsWith('categories.')) return fallbackFromKey(result || translationKey);
  return result;
}
