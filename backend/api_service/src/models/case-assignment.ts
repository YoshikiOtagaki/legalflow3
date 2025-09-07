import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCaseAssignmentData {
  caseId: string;
  userId: string;
  role?: string;
}

export interface UpdateCaseAssignmentData {
  role?: string;
}

export class CaseAssignmentService {
  /**
   * 事件割り当てを作成
   */
  static async create(data: CreateCaseAssignmentData) {
    return await prisma.caseAssignment.create({
      data: {
        caseId: data.caseId,
        userId: data.userId,
        role: data.role || 'Collaborator',
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
   * 複数の事件割り当てを一括作成
   */
  static async createMany(assignments: CreateCaseAssignmentData[]) {
    return await prisma.caseAssignment.createMany({
      data: assignments.map(assignment => ({
        caseId: assignment.caseId,
        userId: assignment.userId,
        role: assignment.role || 'Collaborator',
      })),
    });
  }

  /**
   * 事件IDとユーザーIDで事件割り当てを取得
   */
  static async findByCaseAndUser(caseId: string, userId: string) {
    return await prisma.caseAssignment.findUnique({
      where: {
        caseId_userId: {
          caseId,
          userId,
        },
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
   * 事件IDで事件割り当てを取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.caseAssignment.findMany({
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
        user: { name: 'asc' },
      },
    });
  }

  /**
   * ユーザーIDで事件割り当てを取得
   */
  static async findByUserId(userId: string) {
    return await prisma.caseAssignment.findMany({
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
        case: { updatedAt: 'desc' },
      },
    });
  }

  /**
   * ロール別事件割り当てを取得
   */
  static async findByRole(role: string, caseId?: string) {
    return await prisma.caseAssignment.findMany({
      where: {
        role,
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
        user: { name: 'asc' },
      },
    });
  }

  /**
   * 全事件割り当てを取得
   */
  static async findAll() {
    return await prisma.caseAssignment.findMany({
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        user: true,
      },
      orderBy: [
        { case: { name: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  /**
   * 事件割り当てを更新
   */
  static async update(caseId: string, userId: string, data: UpdateCaseAssignmentData) {
    return await prisma.caseAssignment.update({
      where: {
        caseId_userId: {
          caseId,
          userId,
        },
      },
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
   * 事件割り当てを削除
   */
  static async delete(caseId: string, userId: string) {
    return await prisma.caseAssignment.delete({
      where: {
        caseId_userId: {
          caseId,
          userId,
        },
      },
    });
  }

  /**
   * 事件の全割り当てを削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.caseAssignment.deleteMany({
      where: { caseId },
    });
  }

  /**
   * ユーザーの全割り当てを削除
   */
  static async deleteByUserId(userId: string) {
    return await prisma.caseAssignment.deleteMany({
      where: { userId },
    });
  }

  /**
   * 事件割り当てが存在するかチェック
   */
  static async exists(caseId: string, userId: string): Promise<boolean> {
    const assignment = await prisma.caseAssignment.findUnique({
      where: {
        caseId_userId: {
          caseId,
          userId,
        },
      },
      select: { caseId: true },
    });
    return !!assignment;
  }

  /**
   * 事件の割り当て数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.caseAssignment.count({
      where: { caseId },
    });
  }

  /**
   * ユーザーの割り当て数を取得
   */
  static async countByUser(userId: string) {
    return await prisma.caseAssignment.count({
      where: { userId },
    });
  }

  /**
   * 全事件割り当て数を取得
   */
  static async count() {
    return await prisma.caseAssignment.count();
  }

  /**
   * ロール別割り当て数を取得
   */
  static async countByRole(role: string) {
    return await prisma.caseAssignment.count({
      where: { role },
    });
  }
}
