import React from 'react';
import { 
  FiUsers, 
  FiBook, 
  FiCoffee, 
  FiFilm, 
  FiHeart, 
  FiTruck, 
  FiPackage,
  FiUmbrella,
  FiTarget,
  FiShoppingBag,
  FiDollarSign
} from 'react-icons/fi';

export interface CategoryIconProps {
  category: string;
  size?: number;
  color?: string;
}

export const categoryIconMap: Record<string, React.ReactNode> = {
  'Семья': <FiUsers />,
  'Образование': <FiBook />,
  'Питомцы': <FiHeart />,
  'Кино': <FiFilm />,
  'Здоровье': <FiHeart />,
  'Транспорт': <FiTruck />,
  'Одежда': <FiPackage />,
  'Еда': <FiUmbrella />,
  'Игры': <FiTarget />,
  'Книги': <FiBook />,
  'Спорт': <FiHeart />,
  'Кафе': <FiCoffee />,
  'Покупки': <FiShoppingBag />,
  'Другое': <FiDollarSign />,
  'Зарплата': <FiDollarSign />,
  'Подработка': <FiDollarSign />,
  'Подарки': <FiPackage />,
  'Инвестиции': <FiTarget />,
  'Family': <FiUsers />,
  'Education': <FiBook />,
  'Pets': <FiHeart />,
  'Movies': <FiFilm />,
  'Health': <FiHeart />,
  'Transport': <FiTruck />,
  'Clothing': <FiPackage />,
  'Food': <FiUmbrella />,
  'Games': <FiTarget />,
  'Books': <FiBook />,
  'Sport': <FiHeart />,
  'Cafe': <FiCoffee />,
  'Shopping': <FiShoppingBag />,
  'family': <FiUsers />,
  'education': <FiBook />,
  'pets': <FiHeart />,
  'movies': <FiFilm />,
  'health': <FiHeart />,
  'transport': <FiTruck />,
  'clothing': <FiPackage />,
  'food': <FiUmbrella />,
  'games': <FiTarget />,
  'books': <FiBook />,
  'sport': <FiHeart />,
  'cafe': <FiCoffee />,
  'shopping': <FiShoppingBag />,
  'other': <FiDollarSign />,
  'salary': <FiDollarSign />,
  'sideJob': <FiDollarSign />,
  'gifts': <FiPackage />,
  'investments': <FiTarget />,
};

export const categoryColorMap: Record<string, string> = {
  'Семья': '#8b5cf6',
  'Образование': '#ec4899',
  'Питомцы': '#3b82f6',
  'Кино': '#f97316',
  'Здоровье': '#06b6d4',
  'Транспорт': '#10b981',
  'Одежда': '#06b6d4',
  'Еда': '#84cc16',
  'Игры': '#f43f5e',
  'Книги': '#f59e0b',
  'Спорт': '#ec4899',
  'Кафе': '#f97316',
  'Покупки': '#848e9c',
  'Другое': '#848e9c',
  'Зарплата': '#10b981',
  'Подработка': '#3b82f6',
  'Подарки': '#ec4899',
  'Инвестиции': '#f59e0b',
  'Family': '#8b5cf6',
  'Education': '#ec4899',
  'Pets': '#3b82f6',
  'Movies': '#f97316',
  'Health': '#06b6d4',
  'Transport': '#10b981',
  'Clothing': '#06b6d4',
  'Food': '#84cc16',
  'Games': '#f43f5e',
  'Books': '#f59e0b',
  'Sport': '#ec4899',
  'Cafe': '#f97316',
  'Shopping': '#848e9c',
  'family': '#8b5cf6',
  'education': '#ec4899',
  'pets': '#3b82f6',
  'movies': '#f97316',
  'health': '#06b6d4',
  'transport': '#10b981',
  'clothing': '#06b6d4',
  'food': '#84cc16',
  'games': '#f43f5e',
  'books': '#f59e0b',
  'sport': '#ec4899',
  'cafe': '#f97316',
  'shopping': '#848e9c',
  'other': '#848e9c',
  'salary': '#10b981',
  'sideJob': '#3b82f6',
  'gifts': '#ec4899',
  'investments': '#f59e0b',
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 24,
  color,
}) => {
  const icon = categoryIconMap[category] || <FiDollarSign />;
  const iconColor = color || categoryColorMap[category] || '#848e9c';

  return (
    <span style={{ color: iconColor, fontSize: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </span>
  );
};

export default CategoryIcon;
