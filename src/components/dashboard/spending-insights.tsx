'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, formatDistanceToNow, isSameDay } from 'date-fns';

export function SpendingInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchInsights = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(true);
        return;
      }

      const now = new Date();
      const bounds = {
        thisMonthStart: startOfMonth(now).toISOString(),
        thisMonthEnd: endOfMonth(now).toISOString(),
        lastMonthStart: startOfMonth(subMonths(now, 1)).toISOString(),
        lastMonthEnd: endOfMonth(subMonths(now, 1)).toISOString(),
      };

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token, ...bounds }),
      });

      if (!res.ok) throw new Error('Failed to fetch insights');

      const data = await res.json();
      
      setInsights(data.insights);
      setLastUpdated(now);
      localStorage.setItem('expense_tracker_insights', data.insights);
      localStorage.setItem('expense_tracker_insights_date', now.toISOString());
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const checkAndAutoUpdate = () => {
      const cached = localStorage.getItem('expense_tracker_insights');
      const cachedDate = localStorage.getItem('expense_tracker_insights_date');

      if (!cached || !cachedDate) {
        fetchInsights();
        return;
      }

      const parsedDate = new Date(cachedDate);
      if (isNaN(parsedDate.getTime())) {
        fetchInsights();
        return;
      }

      // Display cached insights immediately
      setInsights(cached);
      setLastUpdated(parsedDate);

      const now = new Date();
      const hoursDiff = (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60);
      const isDifferentDay = !isSameDay(now, parsedDate);

      // Auto-update if it's been 24+ hours, or if it's a new calendar day and at least 6 hours since last update
      if (hoursDiff >= 24 || (isDifferentDay && hoursDiff >= 6)) {
        fetchInsights();
      }
    };

    checkAndAutoUpdate();

    // Check again if the user leaves the tab open and returns on a new day
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndAutoUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchInsights]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Insights
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Auto-updates daily {lastUpdated ? `• Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => fetchInsights()}
          disabled={isLoading}
          title="Regenerate insights now"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Regenerate'}</span>
          <span className="sm:hidden">{isLoading ? '...' : 'Refresh'}</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && !insights ? (
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
          </div>
        ) : error && !insights ? (
          <p className="text-sm text-muted-foreground pt-2">
            Insights unavailable. <button onClick={() => fetchInsights()} className="underline hover:text-foreground">Try again</button>
          </p>
        ) : insights ? (
          <div className="relative pt-2">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[0.5px] flex items-center justify-center rounded transition-opacity">
                <span className="text-xs text-muted-foreground bg-card/90 px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-500" /> Updating insights...
                </span>
              </div>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-line">
              {insights}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Get an AI-powered summary of your spending patterns this month.
            </p>
            <Button onClick={() => fetchInsights()} variant="secondary" size="sm">
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              Generate Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
