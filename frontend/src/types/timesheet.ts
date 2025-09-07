export interface TimesheetEntry {
  id: string;
  userId: string;
  user?: User;
  caseId?: string;
  case?: Case;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number; // 分単位
  billableHours?: number;
  hourlyRate?: number;
  totalAmount?: number;
  status: TimesheetStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Timer {
  id: string;
  userId: string;
  caseId?: string;
  description: string;
  startTime: string;
  isRunning: boolean;
  duration: number; // 分単位
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetListResponse {
  entries: TimesheetEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TimesheetFilters {
  userId?: string;
  caseId?: string;
  statusId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TimesheetSummary {
  totalHours: number;
  billableHours: number;
  totalAmount: number;
  entriesCount: number;
  averageHourlyRate: number;
}

export interface TimerState {
  isRunning: boolean;
  currentTimer?: Timer;
  globalTimer?: Timer;
  caseTimers: Timer[];
}
