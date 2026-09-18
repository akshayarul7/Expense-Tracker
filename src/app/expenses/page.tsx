'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Expense } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { ExpenseTable } from '@/components/expenses/expense-table';
import { PlaidSyncButton } from '@/components/expenses/plaid-sync-button';

export default function ExpensesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      // Small timeout to allow dialog close animation before clearing data
      setTimeout(() => setEditingExpense(null), 300);
    }
  };

  const handleAddExpenseClick = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
        <div className="flex items-center space-x-2">
          <PlaidSyncButton />
          <Button onClick={handleAddExpenseClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <ExpenseTable onEdit={handleEdit} />

      <ExpenseForm
        open={formOpen}
        onOpenChange={handleOpenChange}
        expense={editingExpense}
      />
    </div>
  );
}
