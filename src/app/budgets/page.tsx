'use client';

import { useState } from 'react';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getAllBudgets } from '@/lib/db-helpers';
import { Budget } from '@/lib/db';
import { useExpenseStats } from '@/hooks/use-expense-stats';
import { BudgetCard } from '@/components/budgets/budget-card';
import { BudgetForm } from '@/components/budgets/budget-form';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { deleteBudget } from '@/lib/db-helpers';

export default function BudgetsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  
  const date = new Date();
  const { budgetStatus = [], isLoading: statsLoading } = useExpenseStats(date.getFullYear(), date.getMonth()) || {};
  
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const fetchBudgets = useCallback(async () => {
    try {
      const data = await getAllBudgets();
      setBudgets(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    const channel = supabase
      .channel('budgets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchBudgets)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBudgets]);

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDelete = async (category: string) => {
    if (confirm(`Are you sure you want to delete the budget for ${category}?`)) {
      await deleteBudget(category);
    }
  };

  const handleAddNew = () => {
    setEditingBudget(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Set Budget
        </Button>
      </div>

      {!budgets && <p>Loading budgets...</p>}
      
      {budgets && budgets.length === 0 && (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No budgets</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new budget.</p>
          <div className="mt-6">
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Set Budget
            </Button>
          </div>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(budget => {
            const status = budgetStatus.find(s => s.category === budget.category);
            const spent = status ? status.spent : 0;
            return (
              <BudgetCard
                key={budget.category}
                category={budget.category}
                limit={budget.monthlyLimit}
                spent={spent}
                onEdit={() => handleEdit(budget)}
                onDelete={() => handleDelete(budget.category)}
              />
            );
          })}
        </div>
      )}

      <BudgetForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        budget={editingBudget} 
      />
    </div>
  );
}
