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
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 24, 
  color 
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
