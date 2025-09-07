import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCaseEventData {
  caseId: string;
  eventType: string;
  dateTime: Date;
  location?: string;
}

export interface UpdateCaseEventData {
  eventType?: string;
  dateTime?: Date;
  location?: string;
}

export class CaseEventService {
  /**
   * 事件イベントを作成
   */
  static async create(data: CreateCaseEventData) {
    return await prisma.caseEvent.create({
      data: {
        caseId: data.caseId,
        eventType: data.eventType,
        dateTime: data.dateTime,
        location: data.location,
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
    });
  }

  /**
   * IDで事件イベントを取得
   */
  static async findById(id: string) {
    return await prisma.caseEvent.findUnique({
      where: { id },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
    });
  }

  /**
   * 事件IDで事件イベントを取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.caseEvent.findMany({
      where: { caseId },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  /**
   * イベントタイプ別事件イベントを取得
   */
  static async findByEventType(eventType: string, caseId?: string) {
    return await prisma.caseEvent.findMany({
      where: {
        eventType,
        ...(caseId && { caseId }),
      },
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  /**
   * 日付範囲で事件イベントを取得
   */
  static async findByDateRange(startDate: Date, endDate: Date, caseId?: string) {
    return await prisma.caseEvent.findMany({
      where: {
        dateTime: {
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
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
    });
  }

  /**
   * 今後の事件イベントを取得
   */
  static async findUpcoming(caseId?: string) {
    const now = new Date();
    return await prisma.caseEvent.findMany({
      where: {
        dateTime: {
          gte: now,
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
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
    });
  }

  /**
   * 過去の事件イベントを取得
   */
  static async findPast(caseId?: string) {
    const now = new Date();
    return await prisma.caseEvent.findMany({
      where: {
        dateTime: {
          lt: now,
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
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  /**
   * 全事件イベントを取得
   */
  static async findAll() {
    return await prisma.caseEvent.findMany({
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  /**
   * 事件イベントを更新
   */
  static async update(id: string, data: UpdateCaseEventData) {
    return await prisma.caseEvent.update({
      where: { id },
      data,
      include: {
        case: {
          include: {
            category: true,
            currentPhase: true,
          },
        },
        hearingReport: {
          include: {
            submittedDocuments: true,
          },
        },
      },
    });
  }

  /**
   * 事件イベントを削除
   */
  static async delete(id: string) {
    return await prisma.caseEvent.delete({
      where: { id },
    });
  }

  /**
   * 事件の全イベントを削除
   */
  static async deleteByCaseId(caseId: string) {
    return await prisma.caseEvent.deleteMany({
      where: { caseId },
    });
  }

  /**
   * 事件イベントが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const event = await prisma.caseEvent.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!event;
  }

  /**
   * 事件のイベント数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.caseEvent.count({
      where: { caseId },
    });
  }

  /**
   * 全事件イベント数を取得
   */
  static async count() {
    return await prisma.caseEvent.count();
  }

  /**
   * イベントタイプ別イベント数を取得
   */
  static async countByEventType(eventType: string) {
    return await prisma.caseEvent.count({
      where: { eventType },
    });
  }

  /**
   * 今後のイベント数を取得
   */
  static async countUpcoming(caseId?: string) {
    const now = new Date();
    return await prisma.caseEvent.count({
      where: {
        dateTime: {
          gte: now,
        },
        ...(caseId && { caseId }),
      },
    });
  }

  /**
   * 過去のイベント数を取得
   */
  static async countPast(caseId?: string) {
    const now = new Date();
    return await prisma.caseEvent.count({
      where: {
        dateTime: {
          lt: now,
        },
        ...(caseId && { caseId }),
      },
    });
  }
}
