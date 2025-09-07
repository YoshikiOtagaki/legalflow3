import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTimesheetEntryData {
  caseId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export interface UpdateTimesheetEntryData {
  startTime?: Date;
  endTime?: Date;
  description?: string;
}

export class TimesheetEntryService {
  /**
   * タイムシートエントリを作成
   */
  static async create(data: CreateTimesheetEntryData) {
    return await prisma.timesheetEntry.create({
      data: {
        caseId: data.caseId,
        userId: data.userId,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
    });
  }

  /**
   * IDでタイムシートエントリを取得
   */
  static async findById(id: string) {
    return await prisma.timesheetEntry.findUnique({
      where: { id },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
    });
  }

  /**
   * 事件IDでタイムシートエントリを取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.timesheetEntry.findMany({
      where: { caseId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  /**
   * ユーザーIDでタイムシートエントリを取得
   */
  static async findByUserId(userId: string) {
    return await prisma.timesheetEntry.findMany({
      where: { userId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  /**
   * 日付範囲でタイムシートエントリを取得
   */
  static async findByDateRange(startDate: Date, endDate: Date, userId?: string, caseId?: string) {
    return await prisma.timesheetEntry.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { userId }),
        ...(caseId && { caseId }),
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * 月別タイムシートエントリを取得
   */
  static async findByMonth(year: number, month: number, userId?: string, caseId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return await this.findByDateRange(startDate, endDate, userId, caseId);
  }

  /**
   * 週別タイムシートエントリを取得
   */
  static async findByWeek(startOfWeek: Date, userId?: string, caseId?: string) {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59);
    return await this.findByDateRange(startOfWeek, endOfWeek, userId, caseId);
  }

  /**
   * 全タイムシートエントリを取得
   */
  static async findAll() {
    return await prisma.timesheetEntry.findMany({
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  /**
   * タイムシートエントリを更新
   */
  static async update(id: string, data: UpdateTimesheetEntryData) {
    return await prisma.timesheetEntry.update({
      where: { id },
      data,
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
    });
  }

  /**
   * タイムシートエントリを削除
   */
  static async delete(id: string) {
    return await prisma.timesheetEntry.delete({
      where: { id },
    });
  }

  /**
   * 事件の全タイムシートエントリを削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.timesheetEntry.deleteMany({
      where: { caseId },
    });
  }

  /**
   * ユーザーの全タイムシートエントリを削除
   */
  static async deleteByUserId(userId: string) {
    return await prisma.timesheetEntry.deleteMany({
      where: { userId },
    });
  }

  /**
   * タイムシートエントリが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const entry = await prisma.timesheetEntry.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!entry;
  }

  /**
   * 事件のタイムシートエントリ数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.timesheetEntry.count({
      where: { caseId },
    });
  }

  /**
   * ユーザーのタイムシートエントリ数を取得
   */
  static async countByUser(userId: string) {
    return await prisma.timesheetEntry.count({
      where: { userId },
    });
  }

  /**
   * 全タイムシートエントリ数を取得
   */
  static async count() {
    return await prisma.timesheetEntry.count();
  }

  /**
   * 事件の総作業時間を計算（分単位）
   */
  static async getTotalHoursByCase(caseId: string): Promise<number> {
    const entries = await prisma.timesheetEntry.findMany({
      where: { caseId },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    return entries.reduce((total, entry) => {
      const duration = entry.endTime.getTime() - entry.startTime.getTime();
      return total + Math.round(duration / (1000 * 60)); // 分単位
    }, 0);
  }

  /**
   * ユーザーの総作業時間を計算（分単位）
   */
  static async getTotalHoursByUser(userId: string): Promise<number> {
    const entries = await prisma.timesheetEntry.findMany({
      where: { userId },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    return entries.reduce((total, entry) => {
      const duration = entry.endTime.getTime() - entry.startTime.getTime();
      return total + Math.round(duration / (1000 * 60)); // 分単位
    }, 0);
  }

  /**
   * 日付範囲の総作業時間を計算（分単位）
   */
  static async getTotalHoursByDateRange(startDate: Date, endDate: Date, userId?: string, caseId?: string): Promise<number> {
    const entries = await prisma.timesheetEntry.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { userId }),
        ...(caseId && { caseId }),
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    return entries.reduce((total, entry) => {
      const duration = entry.endTime.getTime() - entry.startTime.getTime();
      return total + Math.round(duration / (1000 * 60)); // 分単位
    }, 0);
  }
}
