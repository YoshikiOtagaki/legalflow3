import prisma from '../../db';
import { PrismaClient } from '@prisma/client';

export interface CreateCaseData {
  name: string;
  caseNumber?: string;
  status?: string;
  trialLevel?: string;
  hourlyRate?: number;
  firstConsultationDate?: Date;
  engagementDate?: Date;
  caseClosedDate?: Date;
  litigationStartDate?: Date;
  oralArgumentEndDate?: Date;
  judgmentDate?: Date;
  judgmentReceivedDate?: Date;
  hasEngagementLetter?: boolean;
  engagementLetterPath?: string;
  remarks?: string;
  customProperties?: any;
  categoryId: string;
  currentPhaseId?: string;
  courtDivisionId?: string;
}

export interface UpdateCaseData {
  name?: string;
  caseNumber?: string;
  status?: string;
  trialLevel?: string;
  hourlyRate?: number;
  firstConsultationDate?: Date;
  engagementDate?: Date;
  caseClosedDate?: Date;
  litigationStartDate?: Date;
  oralArgumentEndDate?: Date;
  judgmentDate?: Date;
  judgmentReceivedDate?: Date;
  hasEngagementLetter?: boolean;
  engagementLetterPath?: string;
  remarks?: string;
  customProperties?: any;
  categoryId?: string;
  currentPhaseId?: string;
  courtDivisionId?: string;
}

export class CaseService {
  /**
   * 事件を作成
   */
  static async create(data: CreateCaseData) {
    return await prisma.case.create({
      data: {
        name: data.name,
        caseNumber: data.caseNumber,
        status: data.status,
        trialLevel: data.trialLevel,
        hourlyRate: data.hourlyRate,
        firstConsultationDate: data.firstConsultationDate,
        engagementDate: data.engagementDate,
        caseClosedDate: data.caseClosedDate,
        litigationStartDate: data.litigationStartDate,
        oralArgumentEndDate: data.oralArgumentEndDate,
        judgmentDate: data.judgmentDate,
        judgmentReceivedDate: data.judgmentReceivedDate,
        hasEngagementLetter: data.hasEngagementLetter || false,
        engagementLetterPath: data.engagementLetterPath,
        remarks: data.remarks,
        customProperties: data.customProperties,
        categoryId: data.categoryId,
        currentPhaseId: data.currentPhaseId,
        courtDivisionId: data.courtDivisionId,
      },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * IDで事件を取得
   */
  static async findById(id: string) {
    return await prisma.case.findUnique({
      where: { id },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
        tasks: true,
        events: true,
        memos: {
          include: {
            author: true,
          },
        },
        timesheetEntries: {
          include: {
            user: true,
          },
        },
        expenses: true,
        deposits: true,
      },
    });
  }

  /**
   * 事件番号で事件を取得
   */
  static async findByCaseNumber(caseNumber: string) {
    return await prisma.case.findUnique({
      where: { caseNumber },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * ユーザーIDで事件を取得
   */
  static async findByUserId(userId: string) {
    return await prisma.case.findMany({
      where: {
        assignments: {
          some: {
            userId,
          },
        },
      },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * カテゴリIDで事件を取得
   */
  static async findByCategoryId(categoryId: string) {
    return await prisma.case.findMany({
      where: { categoryId },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * ステータス別事件を取得
   */
  static async findByStatus(status: string) {
    return await prisma.case.findMany({
      where: { status },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * 名前で事件を検索
   */
  static async findByName(name: string) {
    return await prisma.case.findMany({
      where: {
        name: { contains: name },
      },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * 全事件を取得
   */
  static async findAll() {
    return await prisma.case.findMany({
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * 事件を更新
   */
  static async update(id: string, data: UpdateCaseData) {
    return await prisma.case.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        currentPhase: true,
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        parties: {
          include: {
            party: {
              include: {
                individualProfile: true,
                corporateProfile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 事件を削除
   */
  static async delete(id: string) {
    return await prisma.case.delete({
      where: { id },
    });
  }

  /**
   * 事件が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const case_ = await prisma.case.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!case_;
  }

  /**
   * 事件番号が既に使用されているかチェック
   */
  static async isCaseNumberTaken(caseNumber: string): Promise<boolean> {
    const case_ = await prisma.case.findUnique({
      where: { caseNumber },
      select: { id: true },
    });
    return !!case_;
  }

  /**
   * 事件数を取得
   */
  static async count() {
    return await prisma.case.count();
  }

  /**
   * カテゴリ別事件数を取得
   */
  static async countByCategory(categoryId: string) {
    return await prisma.case.count({
      where: { categoryId },
    });
  }

  /**
   * ステータス別事件数を取得
   */
  static async countByStatus(status: string) {
    return await prisma.case.count({
      where: { status },
    });
  }

  /**
   * ユーザー別事件数を取得
   */
  static async countByUser(userId: string) {
    return await prisma.case.count({
      where: {
        assignments: {
          some: {
            userId,
          },
        },
      },
    });
  }

  /**
   * 案件に当事者を追加
   */
  static async addPartyToCase(caseId: string, partyId: string, role: string) {
    return await prisma.caseParty.create({
      data: {
        caseId,
        partyId,
        role,
      },
    });
  }

  /**
   * 案件から当事者を削除
   */
  static async removePartyFromCase(caseId: string, partyId: string, role: string) {
    return await prisma.caseParty.delete({
      where: {
        caseId_partyId_role: {
          caseId,
          partyId,
          role,
        },
      },
    });
  }

  /**
   * 案件の当事者を取得
   */
  static async getCaseParties(caseId: string) {
    return await prisma.caseParty.findMany({
      where: { caseId },
      include: {
        party: {
          include: {
            individual: true,
            corporate: true,
          },
        },
      },
    });
  }
}
