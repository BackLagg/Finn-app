import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryIcon, categoryColorMap } from '../category-icon';
import styles from './CategoryDonutChart.module.scss';

export interface CategoryDataItem {
  category: string;
  value: number;
  type: 'income' | 'expense';
}

interface CategoryDonutChartProps {
  data: CategoryDataItem[];
  currencySymbol?: string;
  title?: string;
  showLegend?: boolean;
}

const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#84cc16'];

function getColor(category: string, index: number): string {
  return categoryColorMap[category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  currencySymbol = '$',
  title,
  showLegend = true,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = data.map((d, i) => ({
    ...d,
    fill: getColor(d.category, i),
    percentage: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0',
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryDataItem & { fill: string; percentage: string } }> }) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0].payload;
    return (
      <div className={styles['donut-chart__tooltip']}>
        <div className={styles['donut-chart__tooltip-row']}>
          <CategoryIcon category={p.category} size={16} />
          <span>{p.category}</span>
        </div>
        <div className={styles['donut-chart__tooltip-value']}>
          {p.value.toLocaleString()} {currencySymbol} ({p.percentage}%)
        </div>
      </div>
    );
  };

  return (
    <div className={styles['donut-chart']}>
      {title && <h3 className={styles['donut-chart__title']}>{title}</h3>}
      <div className={styles['donut-chart__wrap']}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="var(--color-surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                formatter={(value, entry) => {
                  const item = chartData.find((d) => d.category === value);
                  return (
                    <span className={styles['donut-chart__legend-item']}>
                      <span className={styles['donut-chart__legend-dot']} style={{ backgroundColor: (entry as { color?: string }).color }} />
                      {value} ({item?.percentage}%)
                    </span>
                  );
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles['donut-chart__total']}>
        {total.toLocaleString()} {currencySymbol}
      </div>
    </div>
  );
};
