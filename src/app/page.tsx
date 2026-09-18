'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getExpensesByDateRange, getAllBudgets } from '@/lib/db-helpers';
import { Expense, Budget } from '@/lib/db';

import { formatCurrency } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Receipt, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CategoryPieChart, CATEGORY_COLORS } from '@/components/reports/category-pie-chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const currentMonthDate = new Date();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const start = new Date('2000-01-01');
      const end = new Date('2100-01-01');
      const expData = await getExpensesByDateRange(start, end);
      setExpenses(expData);
      
      const bData = await getAllBudgets();
      setBudgets(bData);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Recent 5 expenses
  const recentExpenses = expenses.slice(0, 5);

  // Budget alerts
  const start = startOfMonth(currentMonthDate);
  const end = endOfMonth(currentMonthDate);

  const monthlyExpenses = expenses.filter(e => {
    // Both e.date and start/end are Date objects, use getTime for comparison
    return e.date.getTime() >= start.getTime() && e.date.getTime() <= end.getTime();
  });

  const categoryTotals = monthlyExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const budgetProgress = budgets.map(b => {
    const spent = categoryTotals[b.category] || 0;
    const percent = Math.min((spent / b.monthlyLimit) * 100, 100);
    return { ...b, spent, percent };
  }).sort((a, b) => b.percent - a.percent);

  const budgetAlertsCount = budgetProgress.filter(b => b.percent >= 80).length;

  const pieChartData = Object.entries(categoryTotals).map(([category, total]) => ({
    category,
    total,
    fill: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
  })).sort((a, b) => b.total - a.total);

  const totalTransactions = monthlyExpenses.length;
  const totalSpent = monthlyExpenses.reduce((sum, curr) => sum + curr.amount, 0);
  const highestCategory = pieChartData.length > 0 ? pieChartData[0].category : '';

  // Daily Spending Chart Data
  const daysInMonth = eachDayOfInterval({ start, end });
  const dailyData = daysInMonth.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const total = monthlyExpenses
      .filter(e => format(e.date, 'yyyy-MM-dd') === dayStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      day: format(day, 'd'),
      total
    };
  });

  const chartConfig = {
    total: {
      label: "Total",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your overview for {format(currentMonthDate, 'MMMM yyyy')}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{highestCategory || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetAlertsCount}</div>
            <p className="text-xs text-muted-foreground">Categories {'>'}= 80% used</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Daily Spending ({format(currentMonthDate, 'MMM yyyy')})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={dailyData} margin={{ left: -20, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillTotalDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area dataKey="total" type="natural" fill="url(#fillTotalDashboard)" fillOpacity={0.4} stroke="var(--color-total)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <CategoryPieChart data={pieChartData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expenses this month.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest 5 transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{expense.name || expense.category}</p>
                      <p className="text-xs text-muted-foreground">{expense.category} • {format(new Date(expense.date), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No recent expenses.</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>Top categories approaching their limit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetProgress.length > 0 ? (
                budgetProgress.slice(0, 3).map((budget) => (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{budget.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)}
                      </span>
                    </div>
                    <Progress value={budget.percent} className={budget.percent >= 90 ? 'bg-destructive/20 [&>div]:bg-destructive' : budget.percent >= 80 ? 'bg-yellow-500/20 [&>div]:bg-yellow-500' : ''} />
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No budgets set.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
