import React, { createContext, useContext, useState, useEffect } from 'react';
import { analyticsService, AnalyticsSummary } from '../services/analytics';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface TimeRange {
  start: Date;
  end: Date;
}

interface AnalyticsContextType {
  summary: AnalyticsSummary | null;
  timeRange: TimeRange;
  loading: boolean;
  error: string | null;
  setTimeRange: (range: TimeRange) => void;
  refreshAnalytics: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalyticsSummary(userId, timeRange);
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadAnalytics(user.id);
    }
  };

  // Load analytics when timeRange changes or user auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadAnalytics(session.user.id);
      } else {
        setSummary(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [timeRange]);

  const value = {
    summary,
    timeRange,
    loading,
    error,
    setTimeRange,
    refreshAnalytics,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
} 