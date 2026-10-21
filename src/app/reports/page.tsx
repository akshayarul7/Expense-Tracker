'use client';

import { useState, useMemo } from 'react';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getExpensesByDateRange } from '@/lib/db-helpers';
import { Expense } from '@/lib/db';

import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { MonthlyChart } from '@/components/reports/monthly-chart';
import { TrendChart } from '@/components/reports/trend-chart';
import { formatCurrency } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryViewType, setCategoryViewType] = useState<'monthly' | 'yearly'>('monthly');

  // Trends state
  const [trendView, setTrendView] = useState<'6months' | 'year'>('6months');
  const [trendYear, setTrendYear] = useState(() => new Date().getFullYear());
  
  // Dialog table state
  const [dialogSort, setDialogSort] = useState<{column: 'date' | 'amount', dir: 'desc' | 'asc'}>({ column: 'date', dir: 'desc' });

  const currentMonth = useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedYear, selectedMonth]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      const start = new Date('2000-01-01');
      const end = new Date('2100-01-01');
      const data = await getExpensesByDateRange(start, end);
      setExpenses(data);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchExpenses]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    expenses.forEach(e => {
      const y = new Date(e.date).getFullYear();
      if (y <= new Date().getFullYear()) years.add(y);
    });
    years.add(new Date().getFullYear()); // Always include current year
    years.add(selectedYear);
    years.add(trendYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, selectedYear, trendYear]);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentRealDate = new Date();
  const currentRealMonth = currentRealDate.getMonth();
  const currentRealYear = currentRealDate.getFullYear();

  const isNextMonthDisabled = selectedYear > currentRealYear || (selectedYear === currentRealYear && selectedMonth >= currentRealMonth);
  const isNextYearDisabled = selectedYear >= currentRealYear;
  const isNextTrendYearDisabled = trendYear >= currentRealYear;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Monthly Overview Data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [expenses, monthStart, monthEnd]);

  const monthlyCategoryTotals = useMemo(() => {
    return monthlyExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [monthlyExpenses]);

  const monthlyChartData = useMemo(() => {
    return Object.entries(monthlyCategoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyCategoryTotals]);

  const monthlyTotalSpent = monthlyChartData.reduce((sum, item) => sum + item.total, 0);
  const daysInMonth = monthEnd.getDate();
  const monthlyAverageDaily = monthlyTotalSpent / daysInMonth;
  const monthlyHighestCategory = monthlyChartData.length > 0 ? monthlyChartData[0] : null;

  // Yearly Overview Data
  const yearStart = useMemo(() => new Date(selectedYear, 0, 1, 0, 0, 0, 0), [selectedYear]);
  const yearEnd = useMemo(() => new Date(selectedYear, 11, 31, 23, 59, 59, 999), [selectedYear]);

  const yearlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= yearStart && d <= yearEnd;
    });
  }, [expenses, yearStart, yearEnd]);

  const yearlyCategoryTotals = useMemo(() => {
    return yearlyExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [yearlyExpenses]);

  const yearlyChartData = useMemo(() => {
    return Object.entries(yearlyCategoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [yearlyCategoryTotals]);

  const yearlyTotalSpent = yearlyChartData.reduce((sum, item) => sum + item.total, 0);
  const monthsElapsedInYear = selectedYear === currentRealYear ? (currentRealMonth + 1) : 12;
  const yearlyMonthlyAvg = yearlyTotalSpent / (monthsElapsedInYear || 1);
  const yearlyHighestCategory = yearlyChartData.length > 0 ? yearlyChartData[0] : null;

  // Trend Data (Last 6 Months)
  const sixMonthsTrendData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      
      const monthTotal = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed >= mStart && ed <= mEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: format(d, 'MMM yy'),
        total: monthTotal,
      };
    }).reverse();
  }, [expenses]);

  // Trend Data (Full Year by Month)
  const fullYearTrendData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, monthIndex) => {
      const mStart = new Date(trendYear, monthIndex, 1, 0, 0, 0, 0);
      const mEnd = new Date(trendYear, monthIndex + 1, 0, 23, 59, 59, 999);
      
      const monthTotal = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed >= mStart && ed <= mEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: MONTHS[monthIndex].substring(0, 3),
        total: monthTotal,
      };
    });
  }, [expenses, trendYear, MONTHS]);

  const activeTrendData = trendView === '6months' ? sixMonthsTrendData : fullYearTrendData;
  const activeTrendTotal = activeTrendData.reduce((sum, item) => sum + item.total, 0);
  const activeTrendAvg = activeTrendData.length > 0 ? activeTrendTotal / activeTrendData.length : 0;
  const activeTrendPeak = activeTrendData.reduce((max, curr) => curr.total > max.total ? curr : max, activeTrendData[0] || { month: 'N/A', total: 0 });

  const activeDialogExpenses = categoryViewType === 'yearly' ? yearlyExpenses : monthlyExpenses;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Analyze your spending patterns over time.</p>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* ===================== MONTHLY OVERVIEW ===================== */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Monthly Overview</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select 
                value={MONTHS[selectedMonth]} 
                onValueChange={(val) => setSelectedMonth(MONTHS.indexOf(val as string))}
              >
                <SelectTrigger className="w-[120px] md:w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem 
                      key={month} 
                      value={month}
                      disabled={selectedYear === currentRealYear && index > currentRealMonth}
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(val) => setSelectedYear(parseInt(val as string))}
              >
                <SelectTrigger className="w-[90px] md:w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyTotalSpent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyAverageDaily)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{monthlyHighestCategory ? monthlyHighestCategory.category : 'N/A'}</div>
                {monthlyHighestCategory && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(monthlyHighestCategory.total)}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Spending</CardTitle>
              <CardDescription>Click any bar to view individual transactions for that category.</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <MonthlyChart 
                  data={monthlyChartData} 
                  onCategoryClick={(cat) => {
                    setSelectedCategory(cat);
                    setCategoryViewType('monthly');
                  }} 
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No expenses this month.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== YEARLY OVERVIEW ===================== */}
        <TabsContent value="yearly" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Yearly Overview</h2>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                onClick={() => setSelectedYear(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(val) => setSelectedYear(parseInt(val as string))}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                onClick={() => setSelectedYear(prev => prev + 1)}
                disabled={isNextYearDisabled}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent ({selectedYear})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(yearlyTotalSpent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(yearlyMonthlyAvg)}</div>
                <p className="text-xs text-muted-foreground">across {monthsElapsedInYear} month{monthsElapsedInYear === 1 ? '' : 's'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{yearlyHighestCategory ? yearlyHighestCategory.category : 'N/A'}</div>
                {yearlyHighestCategory && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(yearlyHighestCategory.total)}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Spending ({selectedYear})</CardTitle>
              <CardDescription>Click any bar to view individual transactions for {selectedYear}.</CardDescription>
            </CardHeader>
            <CardContent>
              {yearlyChartData.length > 0 ? (
                <MonthlyChart 
                  data={yearlyChartData} 
                  onCategoryClick={(cat) => {
                    setSelectedCategory(cat);
                    setCategoryViewType('yearly');
                  }} 
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No expenses recorded for {selectedYear}.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== TRENDS ===================== */}
        <TabsContent value="trends" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Spending Trends</h2>
            <div className="flex items-center space-x-2">
              <Select 
                value={trendView} 
                onValueChange={(val) => setTrendView(val as '6months' | 'year')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="year">Full Year</SelectItem>
                </SelectContent>
              </Select>

              {trendView === 'year' && (
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={() => setTrendYear(prev => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Select 
                    value={trendYear.toString()} 
                    onValueChange={(val) => setTrendYear(parseInt(val as string))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={() => setTrendYear(prev => prev + 1)}
                    disabled={isNextTrendYearDisabled}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {trendView === '6months' ? 'Total (Last 6 Months)' : `Total (${trendYear})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(activeTrendTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(activeTrendAvg)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{activeTrendPeak.month}</div>
                <p className="text-xs text-muted-foreground">{formatCurrency(activeTrendPeak.total)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {trendView === '6months' ? '6-Month Spending Trend' : `Spending Trend (${trendYear})`}
              </CardTitle>
              <CardDescription>
                {trendView === '6months' 
                  ? 'Total spending across the last 6 months.' 
                  : `Month-by-month spending across ${trendYear}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={activeTrendData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Expenses Drill-Down Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory} Expenses</DialogTitle>
            <DialogDescription>
              {categoryViewType === 'yearly' ? selectedYear.toString() : format(currentMonth, 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => setDialogSort(s => ({ column: 'date', dir: s.column === 'date' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                      className="h-8 p-0 hover:bg-transparent data-[state=open]:bg-accent"
                    >
                      <span>Date</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => setDialogSort(s => ({ column: 'amount', dir: s.column === 'amount' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                      className="-mr-4 h-8 justify-end data-[state=open]:bg-accent"
                    >
                      <span>Amount</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDialogExpenses
                  .filter(e => e.category === selectedCategory)
                  .sort((a, b) => {
                    if (dialogSort.column === 'date') {
                      return dialogSort.dir === 'desc' 
                        ? new Date(b.date).getTime() - new Date(a.date).getTime()
                        : new Date(a.date).getTime() - new Date(b.date).getTime();
                    } else {
                      return dialogSort.dir === 'desc' 
                        ? b.amount - a.amount 
                        : a.amount - b.amount;
                    }
                  })
                  .map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), categoryViewType === 'yearly' ? 'MMM d, yyyy' : 'MMM d')}</TableCell>
                    <TableCell>{expense.name || expense.category}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
