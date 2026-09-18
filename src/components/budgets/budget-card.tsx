'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetCardProps {
  category: string;
  spent: number;
  limit: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ category, spent, limit, onEdit, onDelete }: BudgetCardProps) {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  
  let progressColorClass = 'bg-primary';
  if (percentage >= 100) {
    progressColorClass = '[&>div]:bg-red-500';
  } else if (percentage >= 75) {
    progressColorClass = '[&>div]:bg-amber-500';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{category}</CardTitle>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(spent)}</div>
        <p className="text-xs text-muted-foreground mb-4">
          of {formatCurrency(limit)} limit
        </p>
        <Progress 
          value={Math.min(percentage, 100)} 
          className={cn("h-2", progressColorClass)}
        />
        <div className="mt-2 text-xs text-right text-muted-foreground">
          {percentage.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
}
