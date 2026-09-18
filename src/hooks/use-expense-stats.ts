import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';

export function useExpenseStats(year: number, month: number) {
  return useLiveQuery(
    async () => {
      const date = new Date(year, month);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const expenses = await db.expenses
        .where('date')
        .between(start, end, true, true)
        .toArray();

      const budgets = await db.budgets.toArray();

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const categoryTotals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const categoryBreakdown = Object.entries(categoryTotals)
        .map(([category, total]) => ({
          category,
          total,
          percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      const daysInMonth = eachDayOfInterval({ start, end });
      const dailySpending = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const total = expenses
          .filter(exp => format(exp.date, 'yyyy-MM-dd') === dayStr)
          .reduce((sum, exp) => sum + exp.amount, 0);
        return { date: dayStr, total };
      });

      const budgetStatus = budgets.map(budget => {
        const spent = categoryTotals[budget.category] || 0;
        return {
          category: budget.category,
          spent,
          limit: budget.monthlyLimit,
          percentage: budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0
        };
      });

      return {
        totalSpent,
        categoryBreakdown,
        dailySpending,
        budgetStatus,
        isLoading: false
      };
    },
    [year, month],
    {
      totalSpent: 0,
      categoryBreakdown: [],
      dailySpending: [],
      budgetStatus: [],
      isLoading: true
    }
  );
}
