export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalClients: number;
  totalDocuments: number;
  totalHours: number;
  billableHours: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageCaseDuration: number;
  casesThisMonth: number;
  casesLastMonth: number;
  revenueGrowth: number;
  caseGrowth: number;
}

export interface CaseStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CaseCategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  cases: number;
}

export interface TimeTrackingStats {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  averageDailyHours: number;
  topCases: Array<{
    caseId: string;
    caseTitle: string;
    hours: number;
    percentage: number;
  }>;
}

export interface RecentActivity {
  id: string;
  type:
    | 'case_created'
    | 'case_updated'
    | 'document_created'
    | 'timesheet_entry'
    | 'notification';
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  caseId?: string;
  caseTitle?: string;
}

export interface UpcomingDeadlines {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  caseId: string;
  caseTitle: string;
  priority: 'high' | 'medium' | 'low';
  isOverdue: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  caseStatusDistribution: CaseStatusDistribution[];
  caseCategoryDistribution: CaseCategoryDistribution[];
  revenueByMonth: RevenueByMonth[];
  timeTrackingStats: TimeTrackingStats;
  recentActivities: RecentActivity[];
  upcomingDeadlines: UpcomingDeadlines[];
}
