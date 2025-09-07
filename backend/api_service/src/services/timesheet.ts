import { PrismaClient } from '@prisma/client';
import { TimesheetEntryService } from '../models';

const prisma = new PrismaClient();

// タイマーの状態定義
export enum TimerStatus {
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused'
}

// タイマー情報の型定義
export interface TimerInfo {
  id: string;
  userId: string;
  caseId?: string;
  taskId?: string;
  status: TimerStatus;
  startTime: Date;
  pausedAt?: Date;
  totalPausedTime: number; // ミリ秒
  currentSessionTime: number; // ミリ秒
  totalTime: number; // ミリ秒
  description: string;
  lastUpdated: Date;
}

// タイムシート統計の型定義
export interface TimesheetStats {
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
}

// タイマー管理サービスクラス
export class TimesheetTimerService {
  private static activeTimers = new Map<string, TimerInfo>();

  /**
   * タイマーを開始
   * @param userId ユーザーID
   * @param caseId ケースID（オプション）
   * @param taskId タスクID（オプション）
   * @param description 説明
   * @returns タイマー情報
   */
  static startTimer(
    userId: string,
    caseId?: string,
    taskId?: string,
    description: string = 'Work session'
  ): TimerInfo {
    const timerId = this.generateTimerId(userId, caseId, taskId);

    // 既存のタイマーを停止
    this.stopAllUserTimers(userId);

    const now = new Date();
    const timerInfo: TimerInfo = {
      id: timerId,
      userId,
      caseId,
      taskId,
      status: TimerStatus.RUNNING,
      startTime: now,
      totalPausedTime: 0,
      currentSessionTime: 0,
      totalTime: 0,
      description,
      lastUpdated: now
    };

    this.activeTimers.set(timerId, timerInfo);
    return timerInfo;
  }

  /**
   * タイマーを一時停止
   * @param timerId タイマーID
   * @returns 更新されたタイマー情報
   */
  static pauseTimer(timerId: string): TimerInfo | null {
    const timer = this.activeTimers.get(timerId);
    if (!timer || timer.status !== TimerStatus.RUNNING) {
      return null;
    }

    const now = new Date();
    timer.status = TimerStatus.PAUSED;
    timer.pausedAt = now;
    timer.currentSessionTime = now.getTime() - timer.startTime.getTime();
    timer.totalTime += timer.currentSessionTime;
    timer.lastUpdated = now;

    this.activeTimers.set(timerId, timer);
    return timer;
  }

  /**
   * タイマーを再開
   * @param timerId タイマーID
   * @returns 更新されたタイマー情報
   */
  static resumeTimer(timerId: string): TimerInfo | null {
    const timer = this.activeTimers.get(timerId);
    if (!timer || timer.status !== TimerStatus.PAUSED) {
      return null;
    }

    const now = new Date();
    const pausedDuration = now.getTime() - (timer.pausedAt?.getTime() || 0);
    timer.status = TimerStatus.RUNNING;
    timer.startTime = new Date(now.getTime() - timer.currentSessionTime);
    timer.totalPausedTime += pausedDuration;
    timer.pausedAt = undefined;
    timer.lastUpdated = now;

    this.activeTimers.set(timerId, timer);
    return timer;
  }

  /**
   * タイマーを停止
   * @param timerId タイマーID
   * @param saveEntry エントリを保存するかどうか
   * @returns 停止されたタイマー情報
   */
  static async stopTimer(timerId: string, saveEntry: boolean = true): Promise<TimerInfo | null> {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      return null;
    }

    const now = new Date();
    timer.status = TimerStatus.STOPPED;

    if (timer.status === TimerStatus.RUNNING) {
      timer.currentSessionTime = now.getTime() - timer.startTime.getTime();
      timer.totalTime += timer.currentSessionTime;
    }

    timer.lastUpdated = now;

    // タイムシートエントリを保存
    if (saveEntry && timer.totalTime > 0) {
      await this.saveTimesheetEntry(timer);
    }

    this.activeTimers.delete(timerId);
    return timer;
  }

  /**
   * ユーザーのすべてのタイマーを停止
   * @param userId ユーザーID
   */
  static stopAllUserTimers(userId: string): void {
    const userTimers = Array.from(this.activeTimers.values())
      .filter(timer => timer.userId === userId);

    for (const timer of userTimers) {
      this.activeTimers.delete(timer.id);
    }
  }

  /**
   * タイマー情報を取得
   * @param timerId タイマーID
   * @returns タイマー情報
   */
  static getTimer(timerId: string): TimerInfo | null {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      return null;
    }

    // 実行中のタイマーの場合、現在の時間を更新
    if (timer.status === TimerStatus.RUNNING) {
      const now = new Date();
      timer.currentSessionTime = now.getTime() - timer.startTime.getTime();
      timer.lastUpdated = now;
    }

    return timer;
  }

  /**
   * ユーザーのアクティブなタイマーを取得
   * @param userId ユーザーID
   * @returns アクティブなタイマーの配列
   */
  static getUserActiveTimers(userId: string): TimerInfo[] {
    return Array.from(this.activeTimers.values())
      .filter(timer => timer.userId === userId && timer.status !== TimerStatus.STOPPED);
  }

  /**
   * タイマーIDを生成
   * @param userId ユーザーID
   * @param caseId ケースID
   * @param taskId タスクID
   * @returns タイマーID
   */
  private static generateTimerId(userId: string, caseId?: string, taskId?: string): string {
    const timestamp = Date.now();
    const casePart = caseId ? `_case_${caseId}` : '';
    const taskPart = taskId ? `_task_${taskId}` : '';
    return `timer_${userId}${casePart}${taskPart}_${timestamp}`;
  }

  /**
   * タイムシートエントリを保存
   * @param timer タイマー情報
   * @returns 保存されたエントリ
   */
  private static async saveTimesheetEntry(timer: TimerInfo): Promise<any> {
    try {
      const hours = Math.round((timer.totalTime / (1000 * 60 * 60)) * 100) / 100;

      const entry = await TimesheetEntryService.create({
        userId: timer.userId,
        caseId: timer.caseId,
        taskId: timer.taskId,
        description: timer.description,
        hours,
        date: new Date(),
        startTime: timer.startTime,
        endTime: new Date(timer.startTime.getTime() + timer.totalTime)
      });

      return entry;
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
      throw new Error('Failed to save timesheet entry');
    }
  }
}

// タイムシート統計サービスクラス
export class TimesheetStatsService {
  /**
   * ユーザーのタイムシート統計を取得
   * @param userId ユーザーID
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 統計情報
   */
  static async getUserStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimesheetStats> {
    try {
      const whereClause: any = { userId };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate
        };
      }

      const entries = await prisma.timesheetEntry.findMany({
        where: whereClause,
        include: {
          case: {
            select: {
              id: true,
              name: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      // 総時間を計算
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      const totalMinutes = Math.round(totalHours * 60);
      const totalSeconds = Math.round(totalHours * 3600);

      // 日別、週別、月別の時間を計算
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const dailyHours = entries
        .filter(entry => entry.date >= today)
        .reduce((sum, entry) => sum + entry.hours, 0);

      const weeklyHours = entries
        .filter(entry => entry.date >= weekStart)
        .reduce((sum, entry) => sum + entry.hours, 0);

      const monthlyHours = entries
        .filter(entry => entry.date >= monthStart)
        .reduce((sum, entry) => sum + entry.hours, 0);

      // ケース別の時間を計算
      const caseHours: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.caseId) {
          const caseName = entry.case?.name || `Case ${entry.caseId}`;
          caseHours[caseName] = (caseHours[caseName] || 0) + entry.hours;
        }
      });

      // タスク別の時間を計算
      const taskHours: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.taskId) {
          const taskTitle = entry.task?.title || `Task ${entry.taskId}`;
          taskHours[taskTitle] = (taskHours[taskTitle] || 0) + entry.hours;
        }
      });

      // 平均セッション時間を計算
      const averageSessionLength = entries.length > 0 ? totalHours / entries.length : 0;

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        totalMinutes,
        totalSeconds,
        dailyHours: Math.round(dailyHours * 100) / 100,
        weeklyHours: Math.round(weeklyHours * 100) / 100,
        monthlyHours: Math.round(monthlyHours * 100) / 100,
        caseHours,
        taskHours,
        averageSessionLength: Math.round(averageSessionLength * 100) / 100,
        totalSessions: entries.length
      };
    } catch (error) {
      console.error('Error getting timesheet stats:', error);
      throw new Error('Failed to get timesheet statistics');
    }
  }

  /**
   * ケース別のタイムシート統計を取得
   * @param caseId ケースID
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 統計情報
   */
  static async getCaseStats(
    caseId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalHours: number;
    totalEntries: number;
    averageSessionLength: number;
    userBreakdown: Record<string, number>;
    taskBreakdown: Record<string, number>;
    dailyBreakdown: Record<string, number>;
  }> {
    try {
      const whereClause: any = { caseId };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate
        };
      }

      const entries = await prisma.timesheetEntry.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      const totalEntries = entries.length;
      const averageSessionLength = totalEntries > 0 ? totalHours / totalEntries : 0;

      // ユーザー別の時間
      const userBreakdown: Record<string, number> = {};
      entries.forEach(entry => {
        const userName = entry.user?.name || `User ${entry.userId}`;
        userBreakdown[userName] = (userBreakdown[userName] || 0) + entry.hours;
      });

      // タスク別の時間
      const taskBreakdown: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.taskId) {
          const taskTitle = entry.task?.title || `Task ${entry.taskId}`;
          taskBreakdown[taskTitle] = (taskBreakdown[taskTitle] || 0) + entry.hours;
        }
      });

      // 日別の時間
      const dailyBreakdown: Record<string, number> = {};
      entries.forEach(entry => {
        const dateStr = entry.date.toISOString().split('T')[0];
        dailyBreakdown[dateStr] = (dailyBreakdown[dateStr] || 0) + entry.hours;
      });

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        totalEntries,
        averageSessionLength: Math.round(averageSessionLength * 100) / 100,
        userBreakdown,
        taskBreakdown,
        dailyBreakdown
      };
    } catch (error) {
      console.error('Error getting case stats:', error);
      throw new Error('Failed to get case statistics');
    }
  }

  /**
   * チームのタイムシート統計を取得
   * @param userIds ユーザーIDの配列
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 統計情報
   */
  static async getTeamStats(
    userIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalHours: number;
    userStats: Record<string, TimesheetStats>;
    teamAverage: number;
    topPerformers: Array<{ userId: string; userName: string; hours: number }>;
  }> {
    try {
      const whereClause: any = { userId: { in: userIds } };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate
        };
      }

      const entries = await prisma.timesheetEntry.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      const teamAverage = userIds.length > 0 ? totalHours / userIds.length : 0;

      // ユーザー別の統計
      const userStats: Record<string, TimesheetStats> = {};
      for (const userId of userIds) {
        userStats[userId] = await this.getUserStats(userId, startDate, endDate);
      }

      // トップパフォーマーを取得
      const userHours: Record<string, number> = {};
      entries.forEach(entry => {
        userHours[entry.userId] = (userHours[entry.userId] || 0) + entry.hours;
      });

      const topPerformers = Object.entries(userHours)
        .map(([userId, hours]) => ({
          userId,
          userName: entries.find(e => e.userId === userId)?.user?.name || `User ${userId}`,
          hours
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        userStats,
        teamAverage: Math.round(teamAverage * 100) / 100,
        topPerformers
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      throw new Error('Failed to get team statistics');
    }
  }

  /**
   * タイムシートのレポートを生成
   * @param userId ユーザーID
   * @param startDate 開始日
   * @param endDate 終了日
   * @param format レポート形式
   * @returns レポートデータ
   */
  static async generateReport(
    userId: string,
    startDate: Date,
    endDate: Date,
    format: 'summary' | 'detailed' | 'csv' = 'summary'
  ): Promise<any> {
    try {
      const stats = await this.getUserStats(userId, startDate, endDate);
      const entries = await prisma.timesheetEntry.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          case: {
            select: {
              id: true,
              name: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      switch (format) {
        case 'summary':
          return {
            period: { startDate, endDate },
            summary: stats,
            entries: entries.slice(0, 10) // 最新10件
          };

        case 'detailed':
          return {
            period: { startDate, endDate },
            summary: stats,
            entries: entries,
            caseBreakdown: stats.caseHours,
            taskBreakdown: stats.taskHours
          };

        case 'csv':
          return entries.map(entry => ({
            date: entry.date.toISOString().split('T')[0],
            case: entry.case?.name || 'N/A',
            task: entry.task?.title || 'N/A',
            description: entry.description,
            hours: entry.hours,
            startTime: entry.startTime?.toISOString(),
            endTime: entry.endTime?.toISOString()
          }));

        default:
          return stats;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate timesheet report');
    }
  }
}
