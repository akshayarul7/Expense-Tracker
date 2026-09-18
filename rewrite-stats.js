const fs = require('fs');

let statsTs = `
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { getExpensesByMonth, getAllBudgets } from '@/lib/db-helpers';

export function useExpenseStats(year: number, month: number) {
  const [data, setData] = useState({
    totalSpent: 0,
    categoryBreakdown: [] as any[],
    dailySpending: [] as any[],
    budgetStatus: [] as any[],
    isLoading: true
  });

  const fetchData = useCallback(async () => {
    try {
      const expenses = await getExpensesByMonth(year, month);
      const budgets = await getAllBudgets();

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const categoryTotals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const categoryBreakdown = Object.entries(categoryTotals)
        .map(([category, total]) => ({
          category,
          total: Number(total),
          percentage: totalSpent > 0 ? (Number(total) / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      const date = new Date(year, month);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
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

      setData({
        totalSpent,
        categoryBreakdown,
        dailySpending,
        budgetStatus,
        isLoading: false
      });
    } catch (e) {
      console.error(e);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [year, month]);

  useEffect(() => {
    setData(prev => ({ ...prev, isLoading: true }));
    fetchData();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchData)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return data;
}
`;
fs.writeFileSync('src/hooks/use-expense-stats.ts', statsTs);
console.log("Rewrote use-expense-stats.ts");
