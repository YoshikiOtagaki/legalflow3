import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMemoData {
  caseId: string;
  content: string;
  authorId: string;
}

export interface UpdateMemoData {
  content?: string;
}

export class MemoService {
  /**
   * メモを作成
   */
  static async create(data: CreateMemoData) {
    return await prisma.memo.create({
      data: {
        caseId: data.caseId,
        content: data.content,
        authorId: data.authorId,
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
    });
  }

  /**
   * IDでメモを取得
   */
  static async findById(id: string) {
    return await prisma.memo.findUnique({
      where: { id },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
    });
  }

  /**
   * 事件IDでメモを取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.memo.findMany({
      where: { caseId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 作成者IDでメモを取得
   */
  static async findByAuthorId(authorId: string) {
    return await prisma.memo.findMany({
      where: { authorId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 内容でメモを検索
   */
  static async searchByContent(content: string, caseId?: string) {
    return await prisma.memo.findMany({
      where: {
        content: { contains: content },
        ...(caseId && { caseId }),
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 日付範囲でメモを取得
   */
  static async findByDateRange(startDate: Date, endDate: Date, caseId?: string) {
    return await prisma.memo.findMany({
      where: {
        createdAt: {
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
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 全メモを取得
   */
  static async findAll() {
    return await prisma.memo.findMany({
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * メモを更新
   */
  static async update(id: string, data: UpdateMemoData) {
    return await prisma.memo.update({
      where: { id },
      data,
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        author: true,
      },
    });
  }

  /**
   * メモを削除
   */
  static async delete(id: string) {
    return await prisma.memo.delete({
      where: { id },
    });
  }

  /**
   * 事件の全メモを削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.memo.deleteMany({
      where: { caseId },
    });
  }

  /**
   * 作成者の全メモを削除
   */
  static async deleteByAuthorId(authorId: string) {
    return await prisma.memo.deleteMany({
      where: { authorId },
    });
  }

  /**
   * メモが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const memo = await prisma.memo.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!memo;
  }

  /**
   * 事件のメモ数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.memo.count({
      where: { caseId },
    });
  }

  /**
   * 作成者のメモ数を取得
   */
  static async countByAuthor(authorId: string) {
    return await prisma.memo.count({
      where: { authorId },
    });
  }

  /**
   * 全メモ数を取得
   */
  static async count() {
    return await prisma.memo.count();
  }
}
