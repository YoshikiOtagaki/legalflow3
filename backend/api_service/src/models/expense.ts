import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateExpenseData {
  caseId: string;
  date: Date;
  amount: number;
  description: string;
}

export interface UpdateExpenseData {
  date?: Date;
  amount?: number;
  description?: string;
}

export class ExpenseService {
  /**
   * 費用を作成
   */
  static async create(data: CreateExpenseData) {
    return await prisma.expense.create({
      data: {
        caseId: data.caseId,
        date: data.date,
        amount: data.amount,
        description: data.description,
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
    });
  }

  /**
   * IDで費用を取得
   */
  static async findById(id: string) {
    return await prisma.expense.findUnique({
      where: { id },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
    });
  }

  /**
   * 事件IDで費用を取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.expense.findMany({
      where: { caseId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * 日付範囲で費用を取得
   */
  static async findByDateRange(startDate: Date, endDate: Date, caseId?: string) {
    return await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(caseId && { caseId }),
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * 金額範囲で費用を取得
   */
  static async findByAmountRange(minAmount: number, maxAmount: number, caseId?: string) {
    return await prisma.expense.findMany({
      where: {
        amount: {
          gte: minAmount,
          lte: maxAmount,
        },
        ...(caseId && { caseId }),
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }

  /**
   * 説明で費用を検索
   */
  static async searchByDescription(description: string, caseId?: string) {
    return await prisma.expense.findMany({
      where: {
        description: { contains: description },
        ...(caseId && { caseId }),
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * 全費用を取得
   */
  static async findAll() {
    return await prisma.expense.findMany({
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * 費用を更新
   */
  static async update(id: string, data: UpdateExpenseData) {
    return await prisma.expense.update({
      where: { id },
      data,
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
      },
    });
  }

  /**
   * 費用を削除
   */
  static async delete(id: string) {
    return await prisma.expense.delete({
      where: { id },
    });
  }

  /**
   * 事件の全費用を削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.expense.deleteMany({
      where: { caseId },
    });
  }

  /**
   * 費用が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!expense;
  }

  /**
   * 事件の費用数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.expense.count({
      where: { caseId },
    });
  }

  /**
   * 全費用数を取得
   */
  static async count() {
    return await prisma.expense.count();
  }

  /**
   * 事件の総費用を計算
   */
  static async getTotalAmountByCase(caseId: string): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: { caseId },
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }

  /**
   * 日付範囲の総費用を計算
   */
  static async getTotalAmountByDateRange(startDate: Date, endDate: Date, caseId?: string): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(caseId && { caseId }),
      },
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }

  /**
   * 月別総費用を計算
   */
  static async getTotalAmountByMonth(year: number, month: number, caseId?: string): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return await this.getTotalAmountByDateRange(startDate, endDate, caseId);
  }
}
