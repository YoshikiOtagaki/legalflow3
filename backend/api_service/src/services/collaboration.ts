import { PrismaClient } from '@prisma/client';
import { CaseAssignmentService } from '../models';

const prisma = new PrismaClient();

// コラボレーション関連の型定義
export interface CollaborationMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  assignedAt: Date;
  permissions: string[];
}

export interface CaseCollaboration {
  caseId: string;
  caseName: string;
  members: CollaborationMember[];
  primaryLawyer: CollaborationMember | null;
  secondaryLawyers: CollaborationMember[];
  supportStaff: CollaborationMember[];
  totalMembers: number;
}

export interface AssignmentRequest {
  caseId: string;
  userId: string;
  role: 'Primary' | 'Secondary' | 'Support';
  permissions: string[];
  assignedBy: string;
  notes?: string;
}

export interface CollaborationStats {
  totalCases: number;
  activeAssignments: number;
  primaryAssignments: number;
  secondaryAssignments: number;
  supportAssignments: number;
  averageMembersPerCase: number;
}

// コラボレーションサービスクラス
export class CollaborationService {
  /**
   * ケースのコラボレーションメンバーを取得
   * @param caseId ケースID
   * @returns コラボレーション情報
   */
  static async getCaseCollaboration(caseId: string): Promise<CaseCollaboration | null> {
    try {
      // ケース情報を取得
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        select: {
          id: true,
          name: true
        }
      });

      if (!caseData) {
        return null;
      }

      // ケース割り当てを取得
      const assignments = await prisma.caseAssignment.findMany({
        where: { caseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { assignedAt: 'asc' }
        ]
      });

      // メンバーを分類
      const members: CollaborationMember[] = assignments.map(assignment => ({
        id: assignment.id,
        userId: assignment.user.id,
        userName: assignment.user.name,
        userEmail: assignment.user.email,
        role: assignment.role,
        assignedAt: assignment.assignedAt,
        permissions: assignment.permissions || []
      }));

      const primaryLawyer = members.find(m => m.role === 'Primary') || null;
      const secondaryLawyers = members.filter(m => m.role === 'Secondary');
      const supportStaff = members.filter(m => m.role === 'Support');

      return {
        caseId: caseData.id,
        caseName: caseData.name,
        members,
        primaryLawyer,
        secondaryLawyers,
        supportStaff,
        totalMembers: members.length
      };
    } catch (error) {
      console.error('Error getting case collaboration:', error);
      throw new Error('Failed to get case collaboration');
    }
  }

  /**
   * ユーザーのケース割り当てを取得
   * @param userId ユーザーID
   * @param includeInactive 非アクティブな割り当ても含むか
   * @returns ケース割り当ての配列
   */
  static async getUserAssignments(
    userId: string,
    includeInactive: boolean = false
  ): Promise<CaseAssignmentService[]> {
    try {
      const whereClause: any = { userId };

      if (!includeInactive) {
        whereClause.isActive = true;
      }

      const assignments = await prisma.caseAssignment.findMany({
        where: whereClause,
        include: {
          case: {
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return assignments as any[];
    } catch (error) {
      console.error('Error getting user assignments:', error);
      throw new Error('Failed to get user assignments');
    }
  }

  /**
   * ケースにメンバーを割り当て
   * @param assignmentRequest 割り当てリクエスト
   * @returns 作成された割り当て
   */
  static async assignMember(assignmentRequest: AssignmentRequest): Promise<any> {
    try {
      const { caseId, userId, role, permissions, assignedBy, notes } = assignmentRequest;

      // 既存の割り当てをチェック
      const existingAssignment = await prisma.caseAssignment.findFirst({
        where: {
          caseId,
          userId,
          isActive: true
        }
      });

      if (existingAssignment) {
        throw new Error('User is already assigned to this case');
      }

      // プライマリ弁護士の重複チェック
      if (role === 'Primary') {
        const existingPrimary = await prisma.caseAssignment.findFirst({
          where: {
            caseId,
            role: 'Primary',
            isActive: true
          }
        });

        if (existingPrimary) {
          throw new Error('Case already has a primary lawyer assigned');
        }
      }

      // 割り当てを作成
      const assignment = await prisma.caseAssignment.create({
        data: {
          caseId,
          userId,
          role,
          permissions,
          assignedBy,
          notes,
          isActive: true,
          assignedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return assignment;
    } catch (error) {
      console.error('Error assigning member:', error);
      throw new Error('Failed to assign member to case');
    }
  }

  /**
   * ケースからメンバーを削除
   * @param assignmentId 割り当てID
   * @param removedBy 削除者ID
   * @returns 削除された割り当て
   */
  static async removeMember(assignmentId: string, removedBy: string): Promise<any> {
    try {
      // 割り当てを取得
      const assignment = await prisma.caseAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // プライマリ弁護士の削除チェック
      if (assignment.role === 'Primary') {
        const secondaryLawyers = await prisma.caseAssignment.count({
          where: {
            caseId: assignment.caseId,
            role: 'Secondary',
            isActive: true
          }
        });

        if (secondaryLawyers === 0) {
          throw new Error('Cannot remove primary lawyer when no secondary lawyers are assigned');
        }
      }

      // 割り当てを非アクティブにする
      const updatedAssignment = await prisma.caseAssignment.update({
        where: { id: assignmentId },
        data: {
          isActive: false,
          removedAt: new Date(),
          removedBy
        }
      });

      return updatedAssignment;
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member from case');
    }
  }

  /**
   * 割り当ての権限を更新
   * @param assignmentId 割り当てID
   * @param permissions 新しい権限
   * @param updatedBy 更新者ID
   * @returns 更新された割り当て
   */
  static async updatePermissions(
    assignmentId: string,
    permissions: string[],
    updatedBy: string
  ): Promise<any> {
    try {
      const assignment = await prisma.caseAssignment.update({
        where: { id: assignmentId },
        data: {
          permissions,
          updatedAt: new Date(),
          updatedBy
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return assignment;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw new Error('Failed to update assignment permissions');
    }
  }

  /**
   * ケースのコラボレーション統計を取得
   * @param caseId ケースID
   * @returns 統計情報
   */
  static async getCaseCollaborationStats(caseId: string): Promise<{
    totalMembers: number;
    primaryLawyer: boolean;
    secondaryLawyers: number;
    supportStaff: number;
    averageAssignmentDuration: number;
    activeAssignments: number;
  }> {
    try {
      const assignments = await prisma.caseAssignment.findMany({
        where: { caseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const activeAssignments = assignments.filter(a => a.isActive);
      const primaryLawyer = activeAssignments.some(a => a.role === 'Primary');
      const secondaryLawyers = activeAssignments.filter(a => a.role === 'Secondary').length;
      const supportStaff = activeAssignments.filter(a => a.role === 'Support').length;

      // 平均割り当て期間を計算
      const now = new Date();
      const totalDuration = activeAssignments.reduce((sum, assignment) => {
        const duration = now.getTime() - assignment.assignedAt.getTime();
        return sum + duration;
      }, 0);
      const averageAssignmentDuration = activeAssignments.length > 0
        ? totalDuration / activeAssignments.length
        : 0;

      return {
        totalMembers: activeAssignments.length,
        primaryLawyer,
        secondaryLawyers,
        supportStaff,
        averageAssignmentDuration,
        activeAssignments: activeAssignments.length
      };
    } catch (error) {
      console.error('Error getting collaboration stats:', error);
      throw new Error('Failed to get collaboration statistics');
    }
  }

  /**
   * ユーザーのコラボレーション統計を取得
   * @param userId ユーザーID
   * @returns 統計情報
   */
  static async getUserCollaborationStats(userId: string): Promise<CollaborationStats> {
    try {
      const assignments = await prisma.caseAssignment.findMany({
        where: { userId, isActive: true },
        include: {
          case: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      const uniqueCases = new Set(assignments.map(a => a.caseId)).size;
      const primaryAssignments = assignments.filter(a => a.role === 'Primary').length;
      const secondaryAssignments = assignments.filter(a => a.role === 'Secondary').length;
      const supportAssignments = assignments.filter(a => a.role === 'Support').length;

      // ケースごとの平均メンバー数を計算
      const caseMemberCounts = await Promise.all(
        Array.from(new Set(assignments.map(a => a.caseId))).map(async (caseId) => {
          const count = await prisma.caseAssignment.count({
            where: { caseId, isActive: true }
          });
          return count;
        })
      );

      const averageMembersPerCase = caseMemberCounts.length > 0
        ? caseMemberCounts.reduce((sum, count) => sum + count, 0) / caseMemberCounts.length
        : 0;

      return {
        totalCases: uniqueCases,
        activeAssignments: assignments.length,
        primaryAssignments,
        secondaryAssignments,
        supportAssignments,
        averageMembersPerCase
      };
    } catch (error) {
      console.error('Error getting user collaboration stats:', error);
      throw new Error('Failed to get user collaboration statistics');
    }
  }

  /**
   * ケースの割り当て履歴を取得
   * @param caseId ケースID
   * @param limit 取得件数制限
   * @returns 割り当て履歴
   */
  static async getCaseAssignmentHistory(
    caseId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const history = await prisma.caseAssignment.findMany({
        where: { caseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' },
        take: limit
      });

      return history;
    } catch (error) {
      console.error('Error getting assignment history:', error);
      throw new Error('Failed to get assignment history');
    }
  }

  /**
   * ユーザーがケースにアクセス可能かチェック
   * @param userId ユーザーID
   * @param caseId ケースID
   * @returns アクセス可能かどうか
   */
  static async canUserAccessCase(userId: string, caseId: string): Promise<boolean> {
    try {
      const assignment = await prisma.caseAssignment.findFirst({
        where: {
          userId,
          caseId,
          isActive: true
        }
      });

      return !!assignment;
    } catch (error) {
      console.error('Error checking case access:', error);
      return false;
    }
  }

  /**
   * ケースのプライマリ弁護士を変更
   * @param caseId ケースID
   * @param newPrimaryLawyerId 新しいプライマリ弁護士ID
   * @param changedBy 変更者ID
   * @returns 変更結果
   */
  static async changePrimaryLawyer(
    caseId: string,
    newPrimaryLawyerId: string,
    changedBy: string
  ): Promise<any> {
    try {
      // 現在のプライマリ弁護士を取得
      const currentPrimary = await prisma.caseAssignment.findFirst({
        where: {
          caseId,
          role: 'Primary',
          isActive: true
        }
      });

      // 新しいプライマリ弁護士の割り当てを取得
      const newPrimaryAssignment = await prisma.caseAssignment.findFirst({
        where: {
          caseId,
          userId: newPrimaryLawyerId,
          isActive: true
        }
      });

      if (!newPrimaryAssignment) {
        throw new Error('User is not assigned to this case');
      }

      // トランザクションで実行
      const result = await prisma.$transaction(async (tx) => {
        // 現在のプライマリ弁護士をセカンダリに変更
        if (currentPrimary) {
          await tx.caseAssignment.update({
            where: { id: currentPrimary.id },
            data: {
              role: 'Secondary',
              updatedAt: new Date(),
              updatedBy: changedBy
            }
          });
        }

        // 新しいプライマリ弁護士を設定
        const updatedAssignment = await tx.caseAssignment.update({
          where: { id: newPrimaryAssignment.id },
          data: {
            role: 'Primary',
            updatedAt: new Date(),
            updatedBy: changedBy
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        return updatedAssignment;
      });

      return result;
    } catch (error) {
      console.error('Error changing primary lawyer:', error);
      throw new Error('Failed to change primary lawyer');
    }
  }
}
