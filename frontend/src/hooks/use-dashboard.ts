// Dashboard Hook
import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/api";
import {
  getDashboardStats,
  listDashboardMetrics,
  listUserMetrics,
  listReports,
  listUserReports,
  listDashboardWidgets,
  listUserWidgets,
  listDashboardLayouts,
  listUserLayouts,
  getActiveLayout,
} from "../graphql/queries";
import {
  createDashboardMetric,
  updateDashboardMetric,
  deleteDashboardMetric,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  downloadReport,
  createDashboardWidget,
  updateDashboardWidget,
  deleteDashboardWidget,
  reorderWidgets,
  createDashboardLayout,
  updateDashboardLayout,
  deleteDashboardLayout,
  setActiveLayout,
} from "../graphql/mutations";

const client = generateClient();

export interface DashboardMetric {
  id: string;
  userId?: string;
  caseId?: string;
  metricType: string;
  metricName: string;
  value: number;
  unit: string;
  period: string;
  date: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  reportType: string;
  reportName: string;
  reportFormat: string;
  status: string;
  parameters?: any;
  filePath?: string;
  fileSize?: number;
  generatedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  userId: string;
  widgetType: string;
  widgetName: string;
  widgetConfig: any;
  position: number;
  size: string;
  isVisible: boolean;
  refreshInterval?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  layoutName: string;
  layoutConfig: any;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  timesheet: {
    totalHours: number;
    dailyHours: number;
    weeklyHours: number;
    monthlyHours: number;
    averageSessionLength: number;
    totalSessions: number;
    caseBreakdown: Array<{
      caseId: string;
      caseName: string;
      hours: number;
    }>;
    taskBreakdown: Array<{
      taskId: string;
      taskTitle: string;
      hours: number;
    }>;
    dailyTrend: Array<{
      date: string;
      hours: number;
    }>;
    weeklyTrend: Array<{
      week: string;
      hours: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      hours: number;
    }>;
  };
  cases: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    newCases: number;
    averageCaseDuration: number;
    caseStatusDistribution: Array<{
      status: string;
      count: number;
    }>;
    casePriorityDistribution: Array<{
      priority: string;
      count: number;
    }>;
    caseTypeDistribution: Array<{
      type: string;
      count: number;
    }>;
    recentCases: Array<any>;
  };
  documents: {
    totalDocuments: number;
    documentsByType: Array<{
      type: string;
      count: number;
    }>;
    documentsByStatus: Array<{
      status: string;
      count: number;
    }>;
    storageUsed: number;
    recentDocuments: Array<any>;
    generationStats: {
      totalGenerated: number;
      successRate: number;
      averageGenerationTime: number;
    };
  };
  notifications: {
    totalNotifications: number;
    unreadNotifications: number;
    notificationTypes: Array<{
      type: string;
      count: number;
    }>;
    deliveryStats: {
      totalSent: number;
      deliveryRate: number;
      channelBreakdown: Array<{
        channel: string;
        count: number;
      }>;
    };
    recentNotifications: Array<any>;
  };
  system: {
    apiResponseTime: number;
    errorRate: number;
    activeUsers: number;
    totalUsers: number;
    systemHealth: string;
    resourceUtilization: {
      cpu: number;
      memory: number;
      storage: number;
      network: number;
    };
  };
}

export interface DashboardFilters {
  userId?: string;
  caseId?: string;
  metricType?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: string;
}

export interface ReportFilters {
  userId?: string;
  reportType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: string;
}

export interface WidgetFilters {
  userId?: string;
  widgetType?: string;
  isVisible?: boolean;
  limit?: number;
  offset?: string;
}

export interface LayoutFilters {
  userId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: string;
}

// Dashboard Stats Hook
export function useDashboardStats(userId: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: getDashboardStats,
        variables: { userId },
      });

      setStats(result.data.getDashboardStats);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard stats",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// Dashboard Metrics Hook
export function useDashboardMetrics(filters: DashboardFilters = {}) {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);

  const fetchMetrics = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: listDashboardMetrics,
          variables: {
            filters: { ...filters, offset: reset ? null : lastEvaluatedKey },
          },
        });

        const newMetrics = result.data.listDashboardMetrics.items;

        if (reset) {
          setMetrics(newMetrics);
        } else {
          setMetrics((prev) => [...prev, ...newMetrics]);
        }

        setHasMore(result.data.listDashboardMetrics.hasMore);
        setLastEvaluatedKey(result.data.listDashboardMetrics.lastEvaluatedKey);
      } catch (err) {
        console.error("Error fetching dashboard metrics:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch dashboard metrics",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, lastEvaluatedKey],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchMetrics(false);
    }
  }, [hasMore, loading, fetchMetrics]);

  const refresh = useCallback(() => {
    setLastEvaluatedKey(null);
    fetchMetrics(true);
  }, [fetchMetrics]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { metrics, loading, error, hasMore, loadMore, refresh };
}

// User Metrics Hook
export function useUserMetrics(
  userId: string,
  filters: Omit<DashboardFilters, "userId"> = {},
) {
  return useDashboardMetrics({ ...filters, userId });
}

// Reports Hook
export function useReports(filters: ReportFilters = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: listReports,
          variables: {
            filters: { ...filters, offset: reset ? null : lastEvaluatedKey },
          },
        });

        const newReports = result.data.listReports.items;

        if (reset) {
          setReports(newReports);
        } else {
          setReports((prev) => [...prev, ...newReports]);
        }

        setHasMore(result.data.listReports.hasMore);
        setLastEvaluatedKey(result.data.listReports.lastEvaluatedKey);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch reports",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, lastEvaluatedKey],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchReports(false);
    }
  }, [hasMore, loading, fetchReports]);

  const refresh = useCallback(() => {
    setLastEvaluatedKey(null);
    fetchReports(true);
  }, [fetchReports]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reports, loading, error, hasMore, loadMore, refresh };
}

// User Reports Hook
export function useUserReports(
  userId: string,
  filters: Omit<ReportFilters, "userId"> = {},
) {
  return useReports({ ...filters, userId });
}

// Create Report Hook
export function useCreateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReport = useCallback(
    async (input: {
      userId: string;
      reportType: string;
      reportName: string;
      reportFormat: string;
      parameters?: any;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: createReport,
          variables: { input },
        });

        return result.data.createReport;
      } catch (err) {
        console.error("Error creating report:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create report",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const generateReport = useCallback(
    async (input: {
      userId: string;
      reportType: string;
      reportName: string;
      reportFormat: string;
      parameters?: any;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: generateReport,
          variables: { input },
        });

        return result.data.generateReport;
      } catch (err) {
        console.error("Error generating report:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate report",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const downloadReport = useCallback(async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: downloadReport,
        variables: { id: reportId },
      });

      return result.data.downloadReport;
    } catch (err) {
      console.error("Error downloading report:", err);
      setError(
        err instanceof Error ? err.message : "Failed to download report",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createReport, generateReport, downloadReport, loading, error };
}

// Dashboard Widgets Hook
export function useDashboardWidgets(filters: WidgetFilters = {}) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);

  const fetchWidgets = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: listDashboardWidgets,
          variables: {
            filters: { ...filters, offset: reset ? null : lastEvaluatedKey },
          },
        });

        const newWidgets = result.data.listDashboardWidgets.items;

        if (reset) {
          setWidgets(newWidgets);
        } else {
          setWidgets((prev) => [...prev, ...newWidgets]);
        }

        setHasMore(result.data.listDashboardWidgets.hasMore);
        setLastEvaluatedKey(result.data.listDashboardWidgets.lastEvaluatedKey);
      } catch (err) {
        console.error("Error fetching dashboard widgets:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch dashboard widgets",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, lastEvaluatedKey],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchWidgets(false);
    }
  }, [hasMore, loading, fetchWidgets]);

  const refresh = useCallback(() => {
    setLastEvaluatedKey(null);
    fetchWidgets(true);
  }, [fetchWidgets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { widgets, loading, error, hasMore, loadMore, refresh };
}

// User Widgets Hook
export function useUserWidgets(
  userId: string,
  filters: Omit<WidgetFilters, "userId"> = {},
) {
  return useDashboardWidgets({ ...filters, userId });
}

// Create Widget Hook
export function useCreateWidget() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWidget = useCallback(
    async (input: {
      userId: string;
      widgetType: string;
      widgetName: string;
      widgetConfig: any;
      position: number;
      size: string;
      isVisible?: boolean;
      refreshInterval?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: createDashboardWidget,
          variables: { input },
        });

        return result.data.createDashboardWidget;
      } catch (err) {
        console.error("Error creating widget:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create widget",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateWidget = useCallback(
    async (input: {
      id: string;
      widgetName?: string;
      widgetConfig?: any;
      position?: number;
      size?: string;
      isVisible?: boolean;
      refreshInterval?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: updateDashboardWidget,
          variables: { input },
        });

        return result.data.updateDashboardWidget;
      } catch (err) {
        console.error("Error updating widget:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update widget",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteWidget = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: deleteDashboardWidget,
        variables: { id },
      });

      return result.data.deleteDashboardWidget;
    } catch (err) {
      console.error("Error deleting widget:", err);
      setError(err instanceof Error ? err.message : "Failed to delete widget");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderWidgets = useCallback(
    async (userId: string, widgetIds: string[]) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: reorderWidgets,
          variables: { userId, widgetIds },
        });

        return result.data.reorderWidgets;
      } catch (err) {
        console.error("Error reordering widgets:", err);
        setError(
          err instanceof Error ? err.message : "Failed to reorder widgets",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createWidget,
    updateWidget,
    deleteWidget,
    reorderWidgets,
    loading,
    error,
  };
}

// Dashboard Layouts Hook
export function useDashboardLayouts(filters: LayoutFilters = {}) {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);

  const fetchLayouts = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: listDashboardLayouts,
          variables: {
            filters: { ...filters, offset: reset ? null : lastEvaluatedKey },
          },
        });

        const newLayouts = result.data.listDashboardLayouts.items;

        if (reset) {
          setLayouts(newLayouts);
        } else {
          setLayouts((prev) => [...prev, ...newLayouts]);
        }

        setHasMore(result.data.listDashboardLayouts.hasMore);
        setLastEvaluatedKey(result.data.listDashboardLayouts.lastEvaluatedKey);
      } catch (err) {
        console.error("Error fetching dashboard layouts:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch dashboard layouts",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, lastEvaluatedKey],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchLayouts(false);
    }
  }, [hasMore, loading, fetchLayouts]);

  const refresh = useCallback(() => {
    setLastEvaluatedKey(null);
    fetchLayouts(true);
  }, [fetchLayouts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { layouts, loading, error, hasMore, loadMore, refresh };
}

// User Layouts Hook
export function useUserLayouts(
  userId: string,
  filters: Omit<LayoutFilters, "userId"> = {},
) {
  return useDashboardLayouts({ ...filters, userId });
}

// Active Layout Hook
export function useActiveLayout(userId: string) {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveLayout = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: getActiveLayout,
        variables: { userId },
      });

      setLayout(result.data.getActiveLayout);
    } catch (err) {
      console.error("Error fetching active layout:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch active layout",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActiveLayout();
  }, [fetchActiveLayout]);

  return { layout, loading, error, refetch: fetchActiveLayout };
}

// Create Layout Hook
export function useCreateLayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLayout = useCallback(
    async (input: {
      userId: string;
      layoutName: string;
      layoutConfig: any;
      isDefault?: boolean;
      isActive?: boolean;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: createDashboardLayout,
          variables: { input },
        });

        return result.data.createDashboardLayout;
      } catch (err) {
        console.error("Error creating layout:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create layout",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateLayout = useCallback(
    async (input: {
      id: string;
      layoutName?: string;
      layoutConfig?: any;
      isDefault?: boolean;
      isActive?: boolean;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: updateDashboardLayout,
          variables: { input },
        });

        return result.data.updateDashboardLayout;
      } catch (err) {
        console.error("Error updating layout:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update layout",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteLayout = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: deleteDashboardLayout,
        variables: { id },
      });

      return result.data.deleteDashboardLayout;
    } catch (err) {
      console.error("Error deleting layout:", err);
      setError(err instanceof Error ? err.message : "Failed to delete layout");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveLayout = useCallback(
    async (userId: string, layoutId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: setActiveLayout,
          variables: { userId, layoutId },
        });

        return result.data.setActiveLayout;
      } catch (err) {
        console.error("Error setting active layout:", err);
        setError(
          err instanceof Error ? err.message : "Failed to set active layout",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createLayout,
    updateLayout,
    deleteLayout,
    setActiveLayout,
    loading,
    error,
  };
}
