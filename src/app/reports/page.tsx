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
import { Input } from '@/components/ui/input';
import { MonthlyChart } from '@/components/reports/monthly-chart';
import { TrendChart } from '@/components/reports/trend-chart';
import { CategoryPieChart, CATEGORY_COLORS } from '@/components/reports/category-pie-chart';
import { formatCurrency } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Dialog table state
  const [dialogSort, setDialogSort] = useState<{column: 'date' | 'amount', dir: 'desc' | 'asc'}>({ column: 'date', dir: 'desc' });
  const [dialogMinAmount, setDialogMinAmount] = useState('');
  const [dialogMaxAmount, setDialogMaxAmount] = useState('');

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
    years.add(selectedYear); // Always include the selected year so the dropdown doesn't break when navigating to empty years
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, selectedYear]);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentRealDate = new Date();
  const currentRealMonth = currentRealDate.getMonth();
  const currentRealYear = currentRealDate.getFullYear();

  const isNextMonthDisabled = selectedYear > currentRealYear || (selectedYear === currentRealYear && selectedMonth >= currentRealMonth);

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
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });

  const categoryTotals = monthlyExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const pieChartData = monthlyChartData.map(d => ({
    ...d,
    fill: CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']
  }));

  const totalSpent = monthlyChartData.reduce((sum, item) => sum + item.total, 0);
  const daysInMonth = end.getDate();
  const averageDaily = totalSpent / daysInMonth;
  const highestCategory = monthlyChartData.length > 0 ? monthlyChartData[0] : null;

  // Trend Data (Last 6 Months)
  const trendData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(d);
    const monthEnd = endOfMonth(d);
    
    const monthTotal = expenses
      .filter(e => {
        const ed = new Date(e.date);
        return ed >= monthStart && ed <= monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month: format(d, 'MMM yy'),
      total: monthTotal,
    };
  }).reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Analyze your spending patterns over time.</p>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

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
                <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(averageDaily)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{highestCategory ? highestCategory.category : 'N/A'}</div>
                {highestCategory && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(highestCategory.total)}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Spending</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <MonthlyChart data={monthlyChartData} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No expenses this month.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Trend</CardTitle>
              <CardDescription>Total spending over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={trendData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Category Analysis</h2>
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <CategoryPieChart data={pieChartData} />
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No expenses this month.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pieChartData.map((d) => (
                      <TableRow 
                        key={d.category}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedCategory(d.category)}
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                          {d.category}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(d.total)}</TableCell>
                        <TableCell className="text-right">
                          {totalSpent > 0 ? ((d.total / totalSpent) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {pieChartData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                          No data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory} Expenses</DialogTitle>
            <DialogDescription>
              {format(currentMonth, 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 py-2">
            <Input 
              type="number" 
              placeholder="Min $" 
              className="w-[90px] h-8 text-sm"
              value={dialogMinAmount}
              onChange={e => setDialogMinAmount(e.target.value)}
            />
            <span className="text-muted-foreground text-sm">-</span>
            <Input 
              type="number" 
              placeholder="Max $" 
              className="w-[90px] h-8 text-sm"
              value={dialogMaxAmount}
              onChange={e => setDialogMaxAmount(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => setDialogSort(s => ({ column: 'date', dir: s.column === 'date' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                      className="-ml-4 h-8 data-[state=open]:bg-accent"
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
                {monthlyExpenses
                  .filter(e => e.category === selectedCategory)
                  .filter(e => dialogMinAmount ? e.amount >= parseFloat(dialogMinAmount) : true)
                  .filter(e => dialogMaxAmount ? e.amount <= parseFloat(dialogMaxAmount) : true)
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
                    <TableCell>{format(new Date(expense.date), 'MMM d')}</TableCell>
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
