import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateHearingReportData {
  caseEventId: string;
  attendees: any;
  notes?: string;
}

export interface UpdateHearingReportData {
  attendees?: any;
  notes?: string;
}

export class HearingReportService {
  /**
   * 期日報告を作成
   */
  static async create(data: CreateHearingReportData) {
    return await prisma.hearingReport.create({
      data: {
        caseEventId: data.caseEventId,
        attendees: data.attendees,
        notes: data.notes,
      },
      include: {
        caseEvent: {
          include: {
            case: {
              include: {
                category: true,
                currentPhase: true,
              },
            },
          },
        },
        submittedDocuments: true,
      },
    });
  }

  /**
   * IDで期日報告を取得
   */
  static async findById(id: string) {
    return await prisma.hearingReport.findUnique({
      where: { id },
      include: {
        caseEvent: {
          include: {
            case: {
              include: {
                category: true,
                currentPhase: true,
              },
            },
          },
        },
        submittedDocuments: true,
      },
    });
  }

  /**
   * 事件イベントIDで期日報告を取得
   */
  static async findByCaseEventId(caseEventId: string) {
    return await prisma.hearingReport.findUnique({
      where: { caseEventId },
      include: {
        caseEvent: {
          include: {
            case: {
              include: {
                category: true,
                currentPhase: true,
              },
            },
          },
        },
        submittedDocuments: true,
      },
    });
  }

  /**
   * 事件IDで期日報告を取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.hearingReport.findMany({
      where: {
        caseEvent: {
          caseId,
        },
      },
      include: {
        caseEvent: {
          include: {
            case: {
              include: {
                category: true,
                currentPhase: true,
              },
            },
          },
        },
        submittedDocuments: true,
      },
      orderBy: {
        caseEvent: {
          dateTime: 'desc',
        },
      },
    });
  }

  /**
   * 全期日報告を取得
   */
  static async findAll() {
    return await prisma.hearingReport.findMany({
      include: {
        caseEvent: {
          include: {
            case: {
              include: {
                category: true,
                currentPhase: true,
              },
            },
          },
        },
        submittedDocuments: true,
      },
      orderBy: {
        caseEvent: {
          dateTime: 'desc',
        },
      },
    });
  }

  /**
   * 期日報告を更新
   */
  static async update(id: string, data: UpdateHearingReportData) {
    return await prisma.hearingReport.update({
      where: { id },
      data,
      include: {
        caseEvent: {
          include: {
            case: {
              include: {
                category: true,
                currentPhase: true,
              },
            },
          },
        },
        submittedDocuments: true,
      },
    });
  }

  /**
   * 期日報告を削除
   */
  static async delete(id: string) {
    return await prisma.hearingReport.delete({
      where: { id },
    });
  }

  /**
   * 事件イベントの期日報告を削除
   */
  static async deleteByCaseEventId(caseEventId: string) {
    return await prisma.hearingReport.delete({
      where: { caseEventId },
    });
  }

  /**
   * 期日報告が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const report = await prisma.hearingReport.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!report;
  }

  /**
   * 事件イベントに期日報告が存在するかチェック
   */
  static async existsByCaseEvent(caseEventId: string): Promise<boolean> {
    const report = await prisma.hearingReport.findUnique({
      where: { caseEventId },
      select: { id: true },
    });
    return !!report;
  }

  /**
   * 事件の期日報告数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.hearingReport.count({
      where: {
        caseEvent: {
          caseId,
        },
      },
    });
  }

  /**
   * 全期日報告数を取得
   */
  static async count() {
    return await prisma.hearingReport.count();
  }
}
