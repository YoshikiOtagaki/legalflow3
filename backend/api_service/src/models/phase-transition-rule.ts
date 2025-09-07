import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePhaseTransitionRuleData {
  fromPhaseId: string;
  toPhaseId: string;
  taskTemplateId: string;
}

export interface UpdatePhaseTransitionRuleData {
  taskTemplateId?: string;
}

export class PhaseTransitionRuleService {
  /**
   * フェーズ遷移ルールを作成
   */
  static async create(data: CreatePhaseTransitionRuleData) {
    return await prisma.phaseTransitionRule.create({
      data: {
        fromPhaseId: data.fromPhaseId,
        toPhaseId: data.toPhaseId,
        taskTemplateId: data.taskTemplateId,
      },
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * IDでフェーズ遷移ルールを取得
   */
  static async findById(id: string) {
    return await prisma.phaseTransitionRule.findUnique({
      where: { id },
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * 開始フェーズIDでフェーズ遷移ルールを取得
   */
  static async findByFromPhaseId(fromPhaseId: string) {
    return await prisma.phaseTransitionRule.findMany({
      where: { fromPhaseId },
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        toPhase: { order: 'asc' },
      },
    });
  }

  /**
   * 終了フェーズIDでフェーズ遷移ルールを取得
   */
  static async findByToPhaseId(toPhaseId: string) {
    return await prisma.phaseTransitionRule.findMany({
      where: { toPhaseId },
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        fromPhase: { order: 'asc' },
      },
    });
  }

  /**
   * 特定のフェーズ間の遷移ルールを取得
   */
  static async findByPhases(fromPhaseId: string, toPhaseId: string) {
    return await prisma.phaseTransitionRule.findMany({
      where: {
        fromPhaseId,
        toPhaseId,
      },
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * カテゴリIDでフェーズ遷移ルールを取得
   */
  static async findByCategoryId(categoryId: string) {
    return await prisma.phaseTransitionRule.findMany({
      where: {
        OR: [
          {
            fromPhase: {
              categoryId,
            },
          },
          {
            toPhase: {
              categoryId,
            },
          },
        ],
      },
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
      orderBy: [
        { fromPhase: { order: 'asc' } },
        { toPhase: { order: 'asc' } },
      ],
    });
  }

  /**
   * 全フェーズ遷移ルールを取得
   */
  static async findAll() {
    return await prisma.phaseTransitionRule.findMany({
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
      orderBy: [
        { fromPhase: { category: { name: 'asc' } } },
        { fromPhase: { order: 'asc' } },
        { toPhase: { order: 'asc' } },
      ],
    });
  }

  /**
   * フェーズ遷移ルールを更新
   */
  static async update(id: string, data: UpdatePhaseTransitionRuleData) {
    return await prisma.phaseTransitionRule.update({
      where: { id },
      data,
      include: {
        fromPhase: {
          include: {
            category: true,
          },
        },
        toPhase: {
          include: {
            category: true,
          },
        },
        taskTemplate: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * フェーズ遷移ルールを削除
   */
  static async delete(id: string) {
    return await prisma.phaseTransitionRule.delete({
      where: { id },
    });
  }

  /**
   * 開始フェーズの全遷移ルールを削除
   */
  static async deleteByFromPhaseId(fromPhaseId: string) {
    return await prisma.phaseTransitionRule.deleteMany({
      where: { fromPhaseId },
    });
  }

  /**
   * 終了フェーズの全遷移ルールを削除
   */
  static async deleteByToPhaseId(toPhaseId: string) {
    return await prisma.phaseTransitionRule.deleteMany({
      where: { toPhaseId },
    });
  }

  /**
   * フェーズ遷移ルールが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const rule = await prisma.phaseTransitionRule.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!rule;
  }

  /**
   * 特定のフェーズ間の遷移ルールが存在するかチェック
   */
  static async existsByPhases(fromPhaseId: string, toPhaseId: string): Promise<boolean> {
    const rule = await prisma.phaseTransitionRule.findFirst({
      where: {
        fromPhaseId,
        toPhaseId,
      },
      select: { id: true },
    });
    return !!rule;
  }

  /**
   * 全フェーズ遷移ルール数を取得
   */
  static async count() {
    return await prisma.phaseTransitionRule.count();
  }

  /**
   * 開始フェーズ別遷移ルール数を取得
   */
  static async countByFromPhase(fromPhaseId: string) {
    return await prisma.phaseTransitionRule.count({
      where: { fromPhaseId },
    });
  }

  /**
   * 終了フェーズ別遷移ルール数を取得
   */
  static async countByToPhase(toPhaseId: string) {
    return await prisma.phaseTransitionRule.count({
      where: { toPhaseId },
    });
  }

  /**
   * カテゴリ別遷移ルール数を取得
   */
  static async countByCategory(categoryId: string) {
    return await prisma.phaseTransitionRule.count({
      where: {
        OR: [
          {
            fromPhase: {
              categoryId,
            },
          },
          {
            toPhase: {
              categoryId,
            },
          },
        ],
      },
    });
  }
}
