import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCasePhaseData {
  name: string;
  order: number;
  categoryId: string;
}

export interface UpdateCasePhaseData {
  name?: string;
  order?: number;
}

export class CasePhaseService {
  /**
   * 事件フェーズを作成
   */
  static async create(data: CreateCasePhaseData) {
    return await prisma.casePhase.create({
      data: {
        name: data.name,
        order: data.order,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * IDで事件フェーズを取得
   */
  static async findById(id: string) {
    return await prisma.casePhase.findUnique({
      where: { id },
      include: {
        category: true,
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * カテゴリIDで事件フェーズを取得
   */
  static async findByCategoryId(categoryId: string) {
    return await prisma.casePhase.findMany({
      where: { categoryId },
      include: {
        category: true,
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /**
   * 名前で事件フェーズを検索
   */
  static async findByName(name: string, categoryId?: string) {
    return await prisma.casePhase.findMany({
      where: {
        name: { contains: name },
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /**
   * 全事件フェーズを取得
   */
  static async findAll() {
    return await prisma.casePhase.findMany({
      include: {
        category: true,
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: [
        { category: { name: 'asc' } },
        { order: 'asc' },
      ],
    });
  }

  /**
   * 事件フェーズを更新
   */
  static async update(id: string, data: UpdateCasePhaseData) {
    return await prisma.casePhase.update({
      where: { id },
      data,
      include: {
        category: true,
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 事件フェーズを削除
   */
  static async delete(id: string) {
    return await prisma.casePhase.delete({
      where: { id },
    });
  }

  /**
   * カテゴリの全フェーズを削除
   */
  static async deleteByCategoryId(categoryId: string) {
    return await prisma.casePhase.deleteMany({
      where: { categoryId },
    });
  }

  /**
   * 事件フェーズが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const phase = await prisma.casePhase.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!phase;
  }

  /**
   * カテゴリのフェーズ数を取得
   */
  static async countByCategory(categoryId: string) {
    return await prisma.casePhase.count({
      where: { categoryId },
    });
  }

  /**
   * 全事件フェーズ数を取得
   */
  static async count() {
    return await prisma.casePhase.count();
  }

  /**
   * カテゴリの次の順序番号を取得
   */
  static async getNextOrder(categoryId: string) {
    const lastPhase = await prisma.casePhase.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (lastPhase?.order || 0) + 1;
  }

  /**
   * カテゴリのフェーズ順序を再整理
   */
  static async reorderPhases(categoryId: string) {
    const phases = await prisma.casePhase.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    });

    const updates = phases.map((phase, index) =>
      prisma.casePhase.update({
        where: { id: phase.id },
        data: { order: index + 1 },
      })
    );

    return await Promise.all(updates);
  }
}
