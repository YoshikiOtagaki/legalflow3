import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('SubmittedDocument Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create SubmittedDocument', () => {
    let hearingReportId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });
      hearingReportId = report.id;
    });

    it('should create a new submitted document with required fields', async () => {
      const documentData = {
        hearingReportId: hearingReportId,
        documentName: '準備書面.pdf',
        status: 'Submitted' as const,
      };

      const document = await prisma.submittedDocument.create({
        data: documentData,
      });

      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.hearingReportId).toBe(hearingReportId);
      expect(document.documentName).toBe(documentData.documentName);
      expect(document.status).toBe(documentData.status);
    });

    it('should create a submitted document with default status', async () => {
      const document = await prisma.submittedDocument.create({
        data: {
          hearingReportId: hearingReportId,
          documentName: 'デフォルトステータス文書.pdf',
        },
      });

      expect(document).toBeDefined();
      expect(document.documentName).toBe('デフォルトステータス文書.pdf');
      expect(document.status).toBe('Submitted');
    });

    it('should create a submitted document with different statuses', async () => {
      const statuses: Array<'Submitted' | 'Provisional' | 'Withheld'> = ['Submitted', 'Provisional', 'Withheld'];

      for (const status of statuses) {
        const document = await prisma.submittedDocument.create({
          data: {
            hearingReportId: hearingReportId,
            documentName: `${status}文書.pdf`,
            status: status,
          },
        });

        expect(document.status).toBe(status);
      }
    });

    it('should create multiple documents for same hearing report', async () => {
      const documents = [
        { name: '文書1.pdf', status: 'Submitted' as const },
        { name: '文書2.pdf', status: 'Provisional' as const },
        { name: '文書3.pdf', status: 'Withheld' as const },
      ];

      for (const doc of documents) {
        const document = await prisma.submittedDocument.create({
          data: {
            hearingReportId: hearingReportId,
            documentName: doc.name,
            status: doc.status,
          },
        });

        expect(document.documentName).toBe(doc.name);
        expect(document.status).toBe(doc.status);
      }
    });

    it('should fail to create document without hearing report', async () => {
      await expect(
        prisma.submittedDocument.create({
          data: {
            hearingReportId: 'non-existent-report-id',
            documentName: 'テスト文書.pdf',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read SubmittedDocument', () => {
    let documentId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '読取テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });

      const document = await prisma.submittedDocument.create({
        data: {
          hearingReportId: report.id,
          documentName: '読取テスト文書.pdf',
          status: 'Submitted',
        },
      });
      documentId = document.id;
    });

    it('should find submitted document by id', async () => {
      const foundDocument = await prisma.submittedDocument.findUnique({
        where: { id: documentId },
      });

      expect(foundDocument).toBeDefined();
      expect(foundDocument?.id).toBe(documentId);
      expect(foundDocument?.documentName).toBe('読取テスト文書.pdf');
    });

    it('should find submitted document with hearing report relation', async () => {
      const foundDocument = await prisma.submittedDocument.findUnique({
        where: { id: documentId },
        include: {
          hearingReport: {
            include: {
              caseEvent: {
                include: {
                  case: true,
                },
              },
            },
          },
        },
      });

      expect(foundDocument?.hearingReport).toBeDefined();
      expect(foundDocument?.hearingReport.caseEvent.eventType).toBe('hearing');
      expect(foundDocument?.hearingReport.caseEvent.case.name).toBe('読取テスト事件');
    });

    it('should find all submitted documents', async () => {
      const documents = await prisma.submittedDocument.findMany();

      expect(documents).toHaveLength(1);
      expect(documents[0].documentName).toBe('読取テスト文書.pdf');
    });

    it('should find submitted documents by status', async () => {
      const submittedDocs = await prisma.submittedDocument.findMany({
        where: { status: 'Submitted' },
      });

      const provisionalDocs = await prisma.submittedDocument.findMany({
        where: { status: 'Provisional' },
      });

      const withheldDocs = await prisma.submittedDocument.findMany({
        where: { status: 'Withheld' },
      });

      expect(submittedDocs).toHaveLength(1);
      expect(provisionalDocs).toHaveLength(0);
      expect(withheldDocs).toHaveLength(0);
    });

    it('should find submitted documents by hearing report', async () => {
      const documents = await prisma.submittedDocument.findMany({
        where: {
          hearingReport: {
            caseEvent: {
              eventType: 'hearing',
            },
          },
        },
      });

      expect(documents).toHaveLength(1);
      expect(documents[0].documentName).toBe('読取テスト文書.pdf');
    });

    it('should find submitted documents by case', async () => {
      const documents = await prisma.submittedDocument.findMany({
        where: {
          hearingReport: {
            caseEvent: {
              case: {
                name: '読取テスト事件',
              },
            },
          },
        },
      });

      expect(documents).toHaveLength(1);
      expect(documents[0].documentName).toBe('読取テスト文書.pdf');
    });

    it('should return null for non-existent document', async () => {
      const foundDocument = await prisma.submittedDocument.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundDocument).toBeNull();
    });
  });

  describe('Update SubmittedDocument', () => {
    let documentId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '更新テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });

      const document = await prisma.submittedDocument.create({
        data: {
          hearingReportId: report.id,
          documentName: '更新前文書.pdf',
          status: 'Submitted',
        },
      });
      documentId = document.id;
    });

    it('should update submitted document name', async () => {
      const updatedDocument = await prisma.submittedDocument.update({
        where: { id: documentId },
        data: {
          documentName: '更新後文書.pdf',
        },
      });

      expect(updatedDocument.documentName).toBe('更新後文書.pdf');
    });

    it('should update submitted document status', async () => {
      const updatedDocument = await prisma.submittedDocument.update({
        where: { id: documentId },
        data: {
          status: 'Provisional',
        },
      });

      expect(updatedDocument.status).toBe('Provisional');
    });

    it('should update multiple fields', async () => {
      const updatedDocument = await prisma.submittedDocument.update({
        where: { id: documentId },
        data: {
          documentName: '複数更新文書.pdf',
          status: 'Withheld',
        },
      });

      expect(updatedDocument.documentName).toBe('複数更新文書.pdf');
      expect(updatedDocument.status).toBe('Withheld');
    });

    it('should fail to update non-existent document', async () => {
      await expect(
        prisma.submittedDocument.update({
          where: { id: 'non-existent-id' },
          data: { documentName: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete SubmittedDocument', () => {
    let documentId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '削除テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });

      const document = await prisma.submittedDocument.create({
        data: {
          hearingReportId: report.id,
          documentName: '削除テスト文書.pdf',
          status: 'Submitted',
        },
      });
      documentId = document.id;
    });

    it('should delete submitted document by id', async () => {
      const deletedDocument = await prisma.submittedDocument.delete({
        where: { id: documentId },
      });

      expect(deletedDocument.id).toBe(documentId);
      expect(deletedDocument.documentName).toBe('削除テスト文書.pdf');

      const foundDocument = await prisma.submittedDocument.findUnique({
        where: { id: documentId },
      });
      expect(foundDocument).toBeNull();
    });

    it('should fail to delete non-existent document', async () => {
      await expect(
        prisma.submittedDocument.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('SubmittedDocument Relations', () => {
    it('should find hearing report with documents', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '関係テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });

      await prisma.submittedDocument.createMany({
        data: [
          {
            hearingReportId: report.id,
            documentName: '文書1.pdf',
            status: 'Submitted',
          },
          {
            hearingReportId: report.id,
            documentName: '文書2.pdf',
            status: 'Provisional',
          },
          {
            hearingReportId: report.id,
            documentName: '文書3.pdf',
            status: 'Withheld',
          },
        ],
      });

      const reportWithDocuments = await prisma.hearingReport.findUnique({
        where: { id: report.id },
        include: {
          documents: true,
        },
      });

      expect(reportWithDocuments?.documents).toHaveLength(3);
      expect(reportWithDocuments?.documents[0].documentName).toBe('文書1.pdf');
      expect(reportWithDocuments?.documents[1].documentName).toBe('文書2.pdf');
      expect(reportWithDocuments?.documents[2].documentName).toBe('文書3.pdf');
    });

    it('should find case with submitted documents through relations', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '案件文書一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '案件文書一覧テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });

      await prisma.submittedDocument.create({
        data: {
          hearingReportId: report.id,
          documentName: '案件関連文書.pdf',
          status: 'Submitted',
        },
      });

      const caseWithDocuments = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          events: {
            include: {
              report: {
                include: {
                  documents: true,
                },
              },
            },
          },
        },
      });

      expect(caseWithDocuments?.events).toHaveLength(1);
      expect(caseWithDocuments?.events[0].report?.documents).toHaveLength(1);
      expect(caseWithDocuments?.events[0].report?.documents[0].documentName).toBe('案件関連文書.pdf');
    });
  });
});
