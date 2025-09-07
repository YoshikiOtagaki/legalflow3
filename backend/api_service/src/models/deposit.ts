import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateDepositData {
  caseId: string;
  date: Date;
  amount: number;
  description: string;
}

export interface UpdateDepositData {
  date?: Date;
  amount?: number;
  description?: string;
}

export class DepositService {
  /**
   * 預かり金を作成
   */
  static async create(data: CreateDepositData) {
    return await prisma.deposit.create({
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
   * IDで預かり金を取得
   */
  static async findById(id: string) {
    return await prisma.deposit.findUnique({
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
   * 事件IDで預かり金を取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.deposit.findMany({
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
   * 日付範囲で預かり金を取得
   */
  static async findByDateRange(startDate: Date, endDate: Date, caseId?: string) {
    return await prisma.deposit.findMany({
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
   * 金額範囲で預かり金を取得
   */
  static async findByAmountRange(minAmount: number, maxAmount: number, caseId?: string) {
    return await prisma.deposit.findMany({
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
   * 説明で預かり金を検索
   */
  static async searchByDescription(description: string, caseId?: string) {
    return await prisma.deposit.findMany({
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
   * 全預かり金を取得
   */
  static async findAll() {
    return await prisma.deposit.findMany({
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
   * 預かり金を更新
   */
  static async update(id: string, data: UpdateDepositData) {
    return await prisma.deposit.update({
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
   * 預かり金を削除
   */
  static async delete(id: string) {
    return await prisma.deposit.delete({
      where: { id },
    });
  }

  /**
   * 事件の全預かり金を削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.deposit.deleteMany({
      where: { caseId },
    });
  }

  /**
   * 預かり金が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!deposit;
  }

  /**
   * 事件の預かり金数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.deposit.count({
      where: { caseId },
    });
  }

  /**
   * 全預かり金数を取得
   */
  static async count() {
    return await prisma.deposit.count();
  }

  /**
   * 事件の総預かり金額を計算
   */
  static async getTotalAmountByCase(caseId: string): Promise<number> {
    const result = await prisma.deposit.aggregate({
      where: { caseId },
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }

  /**
   * 日付範囲の総預かり金額を計算
   */
  static async getTotalAmountByDateRange(startDate: Date, endDate: Date, caseId?: string): Promise<number> {
    const result = await prisma.deposit.aggregate({
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
   * 月別総預かり金額を計算
   */
  static async getTotalAmountByMonth(year: number, month: number, caseId?: string): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return await this.getTotalAmountByDateRange(startDate, endDate, caseId);
  }
}
