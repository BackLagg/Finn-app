import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import styles from './DistributionRadialChart.module.scss';

const SAVINGS_COLOR = '#10b981';
const INVESTMENTS_COLOR = '#3b82f6';
const PURCHASES_COLOR = '#f97316';
const INCOME_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'];

export interface IncomeCategoryItem {
  name: string;
  value: number;
}

interface DistributionRadialChartProps {
  savingsAmount: number;
  investmentsAmount: number;
  purchasesAmount: number;
  savingsPercent: number;
  investmentsPercent: number;
  purchasesPercent: number;
  savingsOnly: boolean;
  currencySymbol: string;
  mode?: 'expense' | 'income';
  incomeItems?: IncomeCategoryItem[];
}

export const DistributionRadialChart: React.FC<DistributionRadialChartProps> = ({
  savingsAmount,
  investmentsAmount,
  purchasesAmount,
  savingsPercent,
  investmentsPercent,
  purchasesPercent,
  savingsOnly,
  currencySymbol,
  mode = 'expense',
  incomeItems = [],
}) => {
  const { t } = useTranslation();

  const expenseItems =
    savingsOnly
      ? [
          { name: t('home.savings'), value: savingsAmount, fill: SAVINGS_COLOR, percent: savingsPercent },
          { name: t('home.purchases'), value: purchasesAmount, fill: PURCHASES_COLOR, percent: purchasesPercent },
        ]
      : [
          { name: t('home.savings'), value: savingsAmount, fill: SAVINGS_COLOR, percent: savingsPercent },
          { name: t('home.investments'), value: investmentsAmount, fill: INVESTMENTS_COLOR, percent: investmentsPercent },
          { name: t('home.purchases'), value: purchasesAmount, fill: PURCHASES_COLOR, percent: purchasesPercent },
        ];

  const items =
    mode === 'income'
      ? incomeItems.map((item, i) => ({
          name: item.name,
          value: item.value,
          fill: INCOME_COLORS[i % INCOME_COLORS.length],
          percent: 0,
        }))
      : expenseItems;

  const total = mode === 'income' ? incomeItems.reduce((s, i) => s + i.value, 0) : 0;
  const chartData =
    mode === 'income'
      ? items
          .filter((d) => d.value > 0)
          .map((d) => ({ ...d, percent: total > 0 ? Math.round((d.value / total) * 100) : 0, chartValue: d.value }))
      : items
          .filter((d) => d.percent > 0)
          .map((d) => ({ ...d, chartValue: d.value > 0 ? d.value : d.percent }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltip__name}>{p.name}</div>
        <div className={styles.tooltip__value}>
          {p.value.toLocaleString()} {currencySymbol} ({p.percent}%)
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className={styles.chart}>
        <div className={styles.chart__empty}>{t('common.noData', 'Нет данных')}</div>
      </div>
    );
  }

  return (
    <div className={styles.chart}>
      <div className={styles.chart__wrap}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="chartValue"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="82%"
              paddingAngle={3}
              stroke="var(--color-surface)"
              strokeWidth={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => {
                const item = chartData.find((d) => d.name === value);
                return (
                  <span className={styles.legend__item}>
                    <span
                      className={styles.legend__dot}
                      style={{ backgroundColor: (entry as { color?: string }).color }}
                    />
                    {value} {item ? `${item.value.toLocaleString()} ${currencySymbol} (${item.percent}%)` : ''}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
