import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

// タイムシートエントリの型定義
export interface TimesheetEntry {
  id: string;
  caseId: string;
  userId: string;
  taskId?: string;
  startTime: string;
  endTime: string;
  duration: number; // 分単位
  description?: string;
  category?:
    | "RESEARCH"
    | "DRAFTING"
    | "MEETING"
    | "COURT"
    | "ADMINISTRATIVE"
    | "OTHER";
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  case?: any;
  user?: any;
  task?: any;
}

// タイマーの型定義
export interface Timer {
  id: string;
  userId: string;
  caseId?: string;
  taskId?: string;
  status: "STOPPED" | "RUNNING" | "PAUSED";
  startTime: string;
  pausedAt?: string;
  totalPausedTime: number; // ミリ秒
  currentSessionTime: number; // ミリ秒
  totalTime: number; // ミリ秒
  description: string;
  lastUpdated: string;
  createdAt: string;
  case?: any;
  user?: any;
  task?: any;
}

// 時間カテゴリの型定義
export interface TimeCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// タイムシート統計の型定義
export interface TimesheetStats {
  id: string;
  userId?: string;
  caseId?: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  periodValue: string;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  caseHours: Record<string, number>;
  taskHours: Record<string, number>;
  averageSessionLength: number;
  totalSessions: number;
  createdAt: string;
  updatedAt: string;
}

// タイムシート管理フック
export const useTimesheet = () => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // タイムシートエントリ一覧取得
  const fetchEntries = useCallback(
    async (
      params: {
        userId?: string;
        caseId?: string;
        taskId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        nextToken?: string;
      } = {},
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          query ListTimesheetEntries(
            $userId: ID
            $caseId: ID
            $taskId: ID
            $startDate: AWSDate
            $endDate: AWSDate
            $limit: Int
            $nextToken: String
          ) {
            listTimesheetEntries(
              userId: $userId
              caseId: $caseId
              taskId: $taskId
              startDate: $startDate
              endDate: $endDate
              limit: $limit
              nextToken: $nextToken
            ) {
              success
              entries {
                id
                caseId
                userId
                taskId
                startTime
                endTime
                duration
                description
                category
                billable
                hourlyRate
                totalAmount
                isActive
                createdAt
                updatedAt
                createdBy
                updatedBy
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              nextToken
              totalCount
              error {
                message
                code
              }
            }
          }
        `,
          variables: params,
        });

        if (result.data.listTimesheetEntries.success) {
          setEntries(result.data.listTimesheetEntries.entries);
          return {
            entries: result.data.listTimesheetEntries.entries,
            nextToken: result.data.listTimesheetEntries.nextToken,
            totalCount: result.data.listTimesheetEntries.totalCount,
          };
        } else {
          throw new Error(result.data.listTimesheetEntries.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // タイムシートエントリ作成
  const createEntry = useCallback(
    async (input: {
      caseId: string;
      taskId?: string;
      startTime: string;
      endTime: string;
      description?: string;
      category?:
        | "RESEARCH"
        | "DRAFTING"
        | "MEETING"
        | "COURT"
        | "ADMINISTRATIVE"
        | "OTHER";
      billable: boolean;
      hourlyRate?: number;
    }): Promise<TimesheetEntry> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          mutation CreateTimesheetEntry($input: CreateTimesheetEntryInput!) {
            createTimesheetEntry(input: $input) {
              success
              entry {
                id
                caseId
                userId
                taskId
                startTime
                endTime
                duration
                description
                category
                billable
                hourlyRate
                totalAmount
                isActive
                createdAt
                updatedAt
                createdBy
                updatedBy
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { input },
        });

        if (result.data.createTimesheetEntry.success) {
          const newEntry = result.data.createTimesheetEntry.entry;
          setEntries((prev) => [newEntry, ...prev]);
          return newEntry;
        } else {
          throw new Error(result.data.createTimesheetEntry.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // タイムシートエントリ更新
  const updateEntry = useCallback(
    async (input: {
      id: string;
      startTime?: string;
      endTime?: string;
      description?: string;
      category?:
        | "RESEARCH"
        | "DRAFTING"
        | "MEETING"
        | "COURT"
        | "ADMINISTRATIVE"
        | "OTHER";
      billable?: boolean;
      hourlyRate?: number;
    }): Promise<TimesheetEntry> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          mutation UpdateTimesheetEntry($input: UpdateTimesheetEntryInput!) {
            updateTimesheetEntry(input: $input) {
              success
              entry {
                id
                caseId
                userId
                taskId
                startTime
                endTime
                duration
                description
                category
                billable
                hourlyRate
                totalAmount
                isActive
                createdAt
                updatedAt
                createdBy
                updatedBy
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { input },
        });

        if (result.data.updateTimesheetEntry.success) {
          const updatedEntry = result.data.updateTimesheetEntry.entry;
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === updatedEntry.id ? updatedEntry : entry,
            ),
          );
          return updatedEntry;
        } else {
          throw new Error(result.data.updateTimesheetEntry.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // タイムシートエントリ削除
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: `
          mutation DeleteTimesheetEntry($id: ID!) {
            deleteTimesheetEntry(id: $id) {
              success
              entry {
                id
              }
              message
              error {
                message
                code
              }
            }
          }
        `,
        variables: { id },
      });

      if (result.data.deleteTimesheetEntry.success) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
      } else {
        throw new Error(result.data.deleteTimesheetEntry.error.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};

// タイマー管理フック
export const useTimer = () => {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // タイマー開始
  const startTimer = useCallback(
    async (input: {
      caseId?: string;
      taskId?: string;
      description: string;
    }): Promise<Timer> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          mutation StartTimer($input: StartTimerInput!) {
            startTimer(input: $input) {
              success
              timer {
                id
                userId
                caseId
                taskId
                status
                startTime
                pausedAt
                totalPausedTime
                currentSessionTime
                totalTime
                description
                lastUpdated
                createdAt
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { input },
        });

        if (result.data.startTimer.success) {
          const newTimer = result.data.startTimer.timer;
          setTimer(newTimer);
          return newTimer;
        } else {
          throw new Error(result.data.startTimer.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // タイマー停止
  const stopTimer = useCallback(
    async (
      id: string,
      saveEntry: boolean = true,
    ): Promise<{
      timer: Timer;
      entry?: TimesheetEntry;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          mutation StopTimer($id: ID!, $saveEntry: Boolean) {
            stopTimer(id: $id, saveEntry: $saveEntry) {
              success
              timer {
                id
                userId
                caseId
                taskId
                status
                startTime
                pausedAt
                totalPausedTime
                currentSessionTime
                totalTime
                description
                lastUpdated
                createdAt
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              entry {
                id
                caseId
                userId
                taskId
                startTime
                endTime
                duration
                description
                category
                billable
                hourlyRate
                totalAmount
                isActive
                createdAt
                updatedAt
                createdBy
                updatedBy
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { id, saveEntry },
        });

        if (result.data.stopTimer.success) {
          const stoppedTimer = result.data.stopTimer.timer;
          setTimer(null);
          return {
            timer: stoppedTimer,
            entry: result.data.stopTimer.entry,
          };
        } else {
          throw new Error(result.data.stopTimer.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // タイマー一時停止
  const pauseTimer = useCallback(async (id: string): Promise<Timer> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: `
          mutation PauseTimer($id: ID!) {
            pauseTimer(id: $id) {
              success
              timer {
                id
                userId
                caseId
                taskId
                status
                startTime
                pausedAt
                totalPausedTime
                currentSessionTime
                totalTime
                description
                lastUpdated
                createdAt
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              error {
                message
                code
              }
            }
          }
        `,
        variables: { id },
      });

      if (result.data.pauseTimer.success) {
        const pausedTimer = result.data.pauseTimer.timer;
        setTimer(pausedTimer);
        return pausedTimer;
      } else {
        throw new Error(result.data.pauseTimer.error.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // タイマー再開
  const resumeTimer = useCallback(async (id: string): Promise<Timer> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: `
          mutation ResumeTimer($id: ID!) {
            resumeTimer(id: $id) {
              success
              timer {
                id
                userId
                caseId
                taskId
                status
                startTime
                pausedAt
                totalPausedTime
                currentSessionTime
                totalTime
                description
                lastUpdated
                createdAt
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              error {
                message
                code
              }
            }
          }
        `,
        variables: { id },
      });

      if (result.data.resumeTimer.success) {
        const resumedTimer = result.data.resumeTimer.timer;
        setTimer(resumedTimer);
        return resumedTimer;
      } else {
        throw new Error(result.data.resumeTimer.error.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // アクティブタイマー取得
  const getActiveTimer = useCallback(
    async (userId: string): Promise<Timer | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          query GetUserActiveTimers($userId: ID!) {
            getUserActiveTimers(userId: $userId) {
              success
              timers {
                id
                userId
                caseId
                taskId
                status
                startTime
                pausedAt
                totalPausedTime
                currentSessionTime
                totalTime
                description
                lastUpdated
                createdAt
                case {
                  id
                  name
                  caseNumber
                }
                user {
                  id
                  name
                  email
                }
                task {
                  id
                  description
                }
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { userId },
        });

        if (result.data.getUserActiveTimers.success) {
          const timers = result.data.getUserActiveTimers.timers;
          const activeTimer = timers.find(
            (t) => t.status === "RUNNING" || t.status === "PAUSED",
          );
          setTimer(activeTimer || null);
          return activeTimer || null;
        } else {
          throw new Error(result.data.getUserActiveTimers.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    timer,
    loading,
    error,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    getActiveTimer,
  };
};

// タイムシート統計フック
export const useTimesheetStats = () => {
  const [stats, setStats] = useState<TimesheetStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 統計取得
  const fetchStats = useCallback(
    async (filter: {
      userId?: string;
      caseId?: string;
      startDate?: string;
      endDate?: string;
      period?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
    }): Promise<TimesheetStats> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          query GetTimesheetStats($filter: TimesheetStatsFilter!) {
            getTimesheetStats(filter: $filter) {
              success
              stats {
                id
                userId
                caseId
                period
                periodValue
                totalHours
                totalMinutes
                totalSeconds
                dailyHours
                weeklyHours
                monthlyHours
                caseHours
                taskHours
                averageSessionLength
                totalSessions
                createdAt
                updatedAt
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { filter },
        });

        if (result.data.getTimesheetStats.success) {
          const statsData = result.data.getTimesheetStats.stats;
          setStats(statsData);
          return statsData;
        } else {
          throw new Error(result.data.getTimesheetStats.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};
