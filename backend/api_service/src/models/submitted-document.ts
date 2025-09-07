import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSubmittedDocumentData {
  hearingReportId: string;
  documentName: string;
  status?: string;
}

export interface UpdateSubmittedDocumentData {
  documentName?: string;
  status?: string;
}

export class SubmittedDocumentService {
  /**
   * 提出書類を作成
   */
  static async create(data: CreateSubmittedDocumentData) {
    return await prisma.submittedDocument.create({
      data: {
        hearingReportId: data.hearingReportId,
        documentName: data.documentName,
        status: data.status || 'Submitted',
      },
      include: {
        hearingReport: {
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
          },
        },
      },
    });
  }

  /**
   * 複数の提出書類を一括作成
   */
  static async createMany(documents: CreateSubmittedDocumentData[]) {
    return await prisma.submittedDocument.createMany({
      data: documents.map(doc => ({
        hearingReportId: doc.hearingReportId,
        documentName: doc.documentName,
        status: doc.status || 'Submitted',
      })),
    });
  }

  /**
   * IDで提出書類を取得
   */
  static async findById(id: string) {
    return await prisma.submittedDocument.findUnique({
      where: { id },
      include: {
        hearingReport: {
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
          },
        },
      },
    });
  }

  /**
   * 期日報告IDで提出書類を取得
   */
  static async findByHearingReportId(hearingReportId: string) {
    return await prisma.submittedDocument.findMany({
      where: { hearingReportId },
      include: {
        hearingReport: {
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
          },
        },
      },
      orderBy: {
        documentName: 'asc',
      },
    });
  }

  /**
   * 事件IDで提出書類を取得
   */
  static async findByCaseId(caseId: string) {
    return await prisma.submittedDocument.findMany({
      where: {
        hearingReport: {
          caseEvent: {
            caseId,
          },
        },
      },
      include: {
        hearingReport: {
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
          },
        },
      },
      orderBy: {
        hearingReport: {
          caseEvent: {
            dateTime: 'desc',
          },
        },
      },
    });
  }

  /**
   * ステータス別提出書類を取得
   */
  static async findByStatus(status: string, hearingReportId?: string) {
    return await prisma.submittedDocument.findMany({
      where: {
        status,
        ...(hearingReportId && { hearingReportId }),
      },
      include: {
        hearingReport: {
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
          },
        },
      },
      orderBy: {
        documentName: 'asc',
      },
    });
  }

  /**
   * 書類名で提出書類を検索
   */
  static async searchByDocumentName(documentName: string, caseId?: string) {
    return await prisma.submittedDocument.findMany({
      where: {
        documentName: { contains: documentName },
        ...(caseId && {
          hearingReport: {
            caseEvent: {
              caseId,
            },
          },
        }),
      },
      include: {
        hearingReport: {
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
          },
        },
      },
      orderBy: {
        documentName: 'asc',
      },
    });
  }

  /**
   * 全提出書類を取得
   */
  static async findAll() {
    return await prisma.submittedDocument.findMany({
      include: {
        hearingReport: {
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
          },
        },
      },
      orderBy: [
        {
          hearingReport: {
            caseEvent: {
              dateTime: 'desc',
            },
          },
        },
        { documentName: 'asc' },
      ],
    });
  }

  /**
   * 提出書類を更新
   */
  static async update(id: string, data: UpdateSubmittedDocumentData) {
    return await prisma.submittedDocument.update({
      where: { id },
      data,
      include: {
        hearingReport: {
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
          },
        },
      },
    });
  }

  /**
   * 提出書類を削除
   */
  static async delete(id: string) {
    return await prisma.submittedDocument.delete({
      where: { id },
    });
  }

  /**
   * 期日報告の全提出書類を削除
   */
  static async deleteByHearingReportId(hearingReportId: string) {
    return await prisma.submittedDocument.deleteMany({
      where: { hearingReportId },
    });
  }

  /**
   * 提出書類が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const document = await prisma.submittedDocument.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!document;
  }

  /**
   * 期日報告の提出書類数を取得
   */
  static async countByHearingReport(hearingReportId: string) {
    return await prisma.submittedDocument.count({
      where: { hearingReportId },
    });
  }

  /**
   * 事件の提出書類数を取得
   */
  static async countByCase(caseId: string) {
    return await prisma.submittedDocument.count({
      where: {
        hearingReport: {
          caseEvent: {
            caseId,
          },
        },
      },
    });
  }

  /**
   * 全提出書類数を取得
   */
  static async count() {
    return await prisma.submittedDocument.count();
  }

  /**
   * ステータス別提出書類数を取得
   */
  static async countByStatus(status: string) {
    return await prisma.submittedDocument.count({
      where: { status },
    });
  }
}
