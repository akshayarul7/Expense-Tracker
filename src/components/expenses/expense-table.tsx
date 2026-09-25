'use client';

import { useState } from 'react';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getExpensesByCategory, getExpensesByDateRange } from '@/lib/db-helpers';
import { format } from 'date-fns';
import { MoreHorizontal, Repeat, ArrowUpDown } from 'lucide-react';
import {
  LegacyColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useLegacyTable,
} from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';

import { Expense } from '@/lib/db';
import { deleteExpense } from '@/lib/db-helpers';
import { startOfYear, endOfYear } from 'date-fns';
import { formatCurrency } from '@/lib/constants';
import { CATEGORIES } from '@/lib/constants';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExpenseTableProps {
  onEdit: (expense: Expense) => void;
  refreshKey?: number;
  onDelete?: () => void;
}

export function ExpenseTable({ onEdit, refreshKey, onDelete }: ExpenseTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [monthFilter, setMonthFilter] = useState<string>('All Months');
  const [yearFilter, setYearFilter] = useState<string>('All Years');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      const start = new Date('2000-01-01');
      const end = new Date('2100-01-01');
      let data = await getExpensesByDateRange(start, end);

      const years = new Set<number>();
      data.forEach(e => {
        const y = new Date(e.date).getFullYear();
        if (y <= new Date().getFullYear()) years.add(y);
      });
      years.add(new Date().getFullYear()); // Always include current year
      if (yearFilter !== 'All Years') {
        years.add(parseInt(yearFilter));
      }
      setAvailableYears(Array.from(years).sort((a, b) => b - a));

      if (categoryFilter !== 'All Categories') {
        data = data.filter(e => e.category === categoryFilter);
      }
      if (monthFilter !== 'All Months') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.indexOf(monthFilter);
        data = data.filter(e => new Date(e.date).getMonth() === monthIndex);
      }
      if (yearFilter !== 'All Years') {
        data = data.filter(e => new Date(e.date).getFullYear().toString() === yearFilter);
      }
      
      data.sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        } else if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });

      setExpenses(data);
    } catch(e) {
      console.error(e);
    }
  }, [categoryFilter, monthFilter, yearFilter, sortBy]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshKey]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        onDelete?.();
      } catch(e: any) {
        alert("Failed to delete: " + e.message);
      }
    }
  };

  const columns: LegacyColumnDef<Expense>[] = [
    {
      accessorKey: 'date',
      header: () => (
        <Button 
          variant="ghost" 
          onClick={() => setSortBy(s => s === 'date-desc' ? 'date-asc' : 'date-desc')}
          className="h-8 p-0 hover:bg-transparent"
        >
          <span>Date</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(row.original.date, 'MMM d, yyyy'),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.original.name || row.original.category}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    {
      accessorKey: 'isRecurring',
      header: 'Recurring',
      cell: ({ row }) => (
        row.original.isRecurring ? (
          <div className="flex items-center text-muted-foreground">
            <Repeat className="mr-2 h-4 w-4" />
            <span className="text-xs">{row.original.recurringFrequency}</span>
          </div>
        ) : null
      ),
    },
    {
      accessorKey: 'amount',
      header: () => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => setSortBy(s => s === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
            className="-mr-4 h-8"
          >
            <span>Amount</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        return <div className="text-right font-medium">{formatCurrency(row.original.amount)}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="h-8 w-8 p-0" />}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => expense.id && handleDelete(expense.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useLegacyTable({
    data: expenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      pagination,
    },
  });

  const currentRealDate = new Date();
  const currentRealMonth = currentRealDate.getMonth();
  const currentRealYear = currentRealDate.getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val || 'All Categories'); setPagination(p => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthFilter} onValueChange={(val) => { setMonthFilter(val || 'All Months'); setPagination(p => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Months">All Months</SelectItem>
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, index) => (
              <SelectItem 
                key={m} 
                value={m}
                disabled={yearFilter === currentRealYear.toString() && index > currentRealMonth}
              >
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={(val) => { setYearFilter(val || 'All Years'); setPagination(p => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Years">All Years</SelectItem>
            {availableYears.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>


      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
