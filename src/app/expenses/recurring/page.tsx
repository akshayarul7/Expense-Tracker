'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getRecurringExpenses } from '@/lib/db-helpers';

import { formatCurrency } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Expense } from '@/lib/db';
import { deleteExpense } from '@/lib/db-helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function RecurringExpensesPage() {
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [actualRecurring, setActualRecurring] = useState<Expense[]>([]);

  const fetchRecurring = useCallback(async () => {
    try {
      const data = await getRecurringExpenses();
      setActualRecurring(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
    const channel = supabase
      .channel('recurring-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchRecurring)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRecurring]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your monthly and yearly recurring expenses.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actualRecurring.length > 0 ? (
          actualRecurring.map((expense) => (
            <Card key={expense.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{expense.name || expense.category}</CardTitle>
                  <CardDescription>{expense.category}</CardDescription>
                </div>
                <Badge variant="secondary" className="capitalize flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  {expense.recurringFrequency}
                </Badge>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="text-2xl font-bold mb-4">{formatCurrency(expense.amount)}</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Started: {format(new Date(expense.date), 'MMM d, yyyy')}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleEdit(expense)}>
                    Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteTarget(expense)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
            No recurring expenses found. Check the &quot;Recurring&quot; box when adding an expense!
          </div>
        )}
      </div>

      <ExpenseForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        expense={editingExpense} 
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Recurring Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.name || deleteTarget?.category}</span> ({formatCurrency(deleteTarget?.amount ?? 0)}/{deleteTarget?.recurringFrequency})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
