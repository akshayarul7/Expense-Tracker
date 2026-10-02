'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function SpendingInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(true);
        return;
      }

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setInsights(data.insights);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchInsights}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            Insights unavailable. <button onClick={fetchInsights} className="underline">Try again</button>
          </p>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {insights}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
