import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCasePartyData {
  caseId: string;
  partyId: string;
  role: string;
}

export interface UpdateCasePartyData {
  role?: string;
}

export class CasePartyService {
  /**
   * 事件当事者を作成
   */
  static async create(data: CreateCasePartyData) {
    return await prisma.caseParty.create({
      data: {
        caseId: data.caseId,
        partyId: data.partyId,
        role: data.role,
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
    });
  }

  /**
   * 複数の事件当事者を一括作成
   */
  static async createMany(parties: CreateCasePartyData[]) {
    return await prisma.caseParty.createMany({
      data: parties.map(party => ({
        caseId: party.caseId,
        partyId: party.partyId,
        role: party.role,
      })),
    });
  }

  /**
   * 事件ID、当事者ID、ロールで事件当事者を取得
   */
  static async findByCasePartyAndRole(caseId: string, partyId: string, role: string) {
    return await prisma.caseParty.findUnique({
      where: {
        caseId_partyId_role: {
          caseId,
          partyId,
          role,
        },
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
    });
  }

  /**
   * 事件IDで事件当事者を取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.caseParty.findMany({
      where: { caseId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
      orderBy: {
        role: 'asc',
      },
    });
  }

  /**
   * 当事者IDで事件当事者を取得
   */
  static async findByPartyId(partyId: string) {
    return await prisma.caseParty.findMany({
      where: { partyId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
      orderBy: {
        case: { updatedAt: 'desc' },
      },
    });
  }

  /**
   * ロール別事件当事者を取得
   */
  static async findByRole(role: string, caseId?: string) {
    return await prisma.caseParty.findMany({
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
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
      orderBy: {
        party: { id: 'asc' },
      },
    });
  }

  /**
   * 事件の特定ロールの当事者を取得
   */
  static async findByCaseAndRole(caseId: string, role: string) {
    return await prisma.caseParty.findMany({
      where: {
        caseId,
        role,
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
      orderBy: {
        party: { id: 'asc' },
      },
    });
  }

  /**
   * 全事件当事者を取得
   */
  static async findAll() {
    return await prisma.caseParty.findMany({
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
      orderBy: [
        { case: { name: 'asc' } },
        { role: 'asc' },
        { party: { id: 'asc' } },
      ],
    });
  }

  /**
   * 事件当事者を更新
   */
  static async update(caseId: string, partyId: string, role: string, data: UpdateCasePartyData) {
    return await prisma.caseParty.update({
      where: {
        caseId_partyId_role: {
          caseId,
          partyId,
          role,
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
        party: {
          include: {
            individualProfile: true,
            corporateProfile: true,
          },
        },
      },
    });
  }

  /**
   * 事件当事者を削除
   */
  static async delete(caseId: string, partyId: string, role: string) {
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
   * 事件の全当事者を削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.caseParty.deleteMany({
      where: { caseId },
    });
  }

  /**
   * 当事者の全事件を削除
   */
  static async deleteByPartyId(partyId: string) {
    return await prisma.caseParty.deleteMany({
      where: { partyId },
    });
  }

  /**
   * 事件当事者が存在するかチェック
   */
  static async exists(caseId: string, partyId: string, role: string): Promise<boolean> {
    const caseParty = await prisma.caseParty.findUnique({
      where: {
        caseId_partyId_role: {
          caseId,
          partyId,
          role,
        },
      },
      select: { caseId: true },
    });
    return !!caseParty;
  }

  /**
   * 事件の当事者数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.caseParty.count({
      where: { caseId },
    });
  }

  /**
   * 当事者の事件数を取得
   */
  static async countByParty(partyId: string) {
    return await prisma.caseParty.count({
      where: { partyId },
    });
  }

  /**
   * 全事件当事者数を取得
   */
  static async count() {
    return await prisma.caseParty.count();
  }

  /**
   * ロール別当事者数を取得
   */
  static async countByRole(role: string) {
    return await prisma.caseParty.count({
      where: { role },
    });
  }

  /**
   * 事件のロール別当事者数を取得
   */
  static async countByCaseAndRole(caseId: string, role: string) {
    return await prisma.caseParty.count({
      where: {
        caseId,
        role,
      },
    });
  }
}
