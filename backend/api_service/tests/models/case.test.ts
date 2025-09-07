import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Case Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Case', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '民事事件',
          roleDefinitions: {},
        },
      });
      categoryId = category.id;
    });

    it('should create a new case with required fields', async () => {
      const caseData = {
        name: 'テスト事件',
        caseNumber: '2024-001',
        status: 'Active',
        trialLevel: 'First Instance',
        hourlyRate: 15000.0,
        firstConsultationDate: new Date('2024-01-01'),
        engagementDate: new Date('2024-01-15'),
        hasEngagementLetter: true,
        engagementLetterPath: '/documents/engagement.pdf',
        remarks: 'テスト備考',
        customProperties: { priority: 'high' },
        categoryId: categoryId,
      };

      const case_ = await prisma.case.create({
        data: caseData,
      });

      expect(case_).toBeDefined();
      expect(case_.id).toBeDefined();
      expect(case_.name).toBe(caseData.name);
      expect(case_.caseNumber).toBe(caseData.caseNumber);
      expect(case_.status).toBe(caseData.status);
      expect(case_.trialLevel).toBe(caseData.trialLevel);
      expect(case_.hourlyRate).toBe(caseData.hourlyRate);
      expect(case_.firstConsultationDate).toEqual(caseData.firstConsultationDate);
      expect(case_.engagementDate).toEqual(caseData.engagementDate);
      expect(case_.hasEngagementLetter).toBe(caseData.hasEngagementLetter);
      expect(case_.engagementLetterPath).toBe(caseData.engagementLetterPath);
      expect(case_.remarks).toBe(caseData.remarks);
      expect(case_.customProperties).toEqual(caseData.customProperties);
      expect(case_.categoryId).toBe(categoryId);
      expect(case_.createdAt).toBeDefined();
      expect(case_.updatedAt).toBeDefined();
    });

    it('should create a case with minimal required fields', async () => {
      const case_ = await prisma.case.create({
        data: {
          name: 'シンプル事件',
          categoryId: categoryId,
        },
      });

      expect(case_).toBeDefined();
      expect(case_.name).toBe('シンプル事件');
      expect(case_.caseNumber).toBeNull();
      expect(case_.status).toBeNull();
      expect(case_.hourlyRate).toBeNull();
      expect(case_.hasEngagementLetter).toBe(false);
    });

    it('should create a case with court division', async () => {
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '東京地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '裁判所事件',
          categoryId: categoryId,
          courtDivisionId: division.id,
        },
        include: {
          courtDivision: {
            include: {
              courthouse: true,
            },
          },
        },
      });

      expect(case_.courtDivision).toBeDefined();
      expect(case_.courtDivision?.name).toBe('民事部');
      expect(case_.courtDivision?.courthouse.name).toBe('東京地方裁判所');
    });

    it('should create a case with current phase', async () => {
      const phase = await prisma.casePhase.create({
        data: {
          name: '準備書面提出',
          order: 1,
          categoryId: categoryId,
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'フェーズ事件',
          categoryId: categoryId,
          currentPhaseId: phase.id,
        },
        include: {
          currentPhase: true,
        },
      });

      expect(case_.currentPhase).toBeDefined();
      expect(case_.currentPhase?.name).toBe('準備書面提出');
    });

    it('should fail to create case without category', async () => {
      await expect(
        prisma.case.create({
          data: {
            name: 'カテゴリなし事件',
            categoryId: 'non-existent-category-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create case with non-existent court division', async () => {
      await expect(
        prisma.case.create({
          data: {
            name: '存在しない裁判所事件',
            categoryId: categoryId,
            courtDivisionId: 'non-existent-division-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create case with non-existent phase', async () => {
      await expect(
        prisma.case.create({
          data: {
            name: '存在しないフェーズ事件',
            categoryId: categoryId,
            currentPhaseId: 'non-existent-phase-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Case', () => {
    let caseId: string;

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
          caseNumber: '2024-READ-001',
          status: 'Active',
          trialLevel: 'First Instance',
          hourlyRate: 20000.0,
          firstConsultationDate: new Date('2024-02-01'),
          engagementDate: new Date('2024-02-15'),
          caseClosedDate: new Date('2024-12-31'),
          hasEngagementLetter: true,
          engagementLetterPath: '/documents/read-test.pdf',
          remarks: '読取テスト備考',
          customProperties: { priority: 'medium', clientType: 'individual' },
          categoryId: category.id,
        },
      });
      caseId = case_.id;
    });

    it('should find case by id', async () => {
      const foundCase = await prisma.case.findUnique({
        where: { id: caseId },
      });

      expect(foundCase).toBeDefined();
      expect(foundCase?.id).toBe(caseId);
      expect(foundCase?.name).toBe('読取テスト事件');
      expect(foundCase?.caseNumber).toBe('2024-READ-001');
    });

    it('should find case with category relation', async () => {
      const foundCase = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          category: true,
        },
      });

      expect(foundCase?.category).toBeDefined();
      expect(foundCase?.category.name).toBe('読取テストカテゴリ');
    });

    it('should find all cases', async () => {
      const cases = await prisma.case.findMany();

      expect(cases).toHaveLength(1);
      expect(cases[0].name).toBe('読取テスト事件');
    });

    it('should find cases by status', async () => {
      const activeCases = await prisma.case.findMany({
        where: { status: 'Active' },
      });

      const closedCases = await prisma.case.findMany({
        where: { status: 'Closed' },
      });

      expect(activeCases).toHaveLength(1);
      expect(closedCases).toHaveLength(0);
    });

    it('should find cases by trial level', async () => {
      const firstInstanceCases = await prisma.case.findMany({
        where: { trialLevel: 'First Instance' },
      });

      const secondInstanceCases = await prisma.case.findMany({
        where: { trialLevel: 'Second Instance' },
      });

      expect(firstInstanceCases).toHaveLength(1);
      expect(secondInstanceCases).toHaveLength(0);
    });

    it('should find cases by case number', async () => {
      const foundCase = await prisma.case.findFirst({
        where: { caseNumber: '2024-READ-001' },
      });

      expect(foundCase).toBeDefined();
      expect(foundCase?.name).toBe('読取テスト事件');
    });

    it('should return null for non-existent case', async () => {
      const foundCase = await prisma.case.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundCase).toBeNull();
    });
  });

  describe('Update Case', () => {
    let caseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '更新前事件',
          caseNumber: '2024-UPDATE-001',
          status: 'Active',
          hourlyRate: 15000.0,
          categoryId: category.id,
        },
      });
      caseId = case_.id;
    });

    it('should update case name', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          name: '更新後事件',
        },
      });

      expect(updatedCase.name).toBe('更新後事件');
      expect(updatedCase.caseNumber).toBe('2024-UPDATE-001');
    });

    it('should update case status', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          status: 'Closed',
          caseClosedDate: new Date('2024-12-31'),
        },
      });

      expect(updatedCase.status).toBe('Closed');
      expect(updatedCase.caseClosedDate).toEqual(new Date('2024-12-31'));
    });

    it('should update case trial level', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          trialLevel: 'Second Instance',
        },
      });

      expect(updatedCase.trialLevel).toBe('Second Instance');
    });

    it('should update case hourly rate', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          hourlyRate: 25000.0,
        },
      });

      expect(updatedCase.hourlyRate).toBe(25000.0);
    });

    it('should update case dates', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          firstConsultationDate: new Date('2024-03-01'),
          engagementDate: new Date('2024-03-15'),
          litigationStartDate: new Date('2024-04-01'),
          oralArgumentEndDate: new Date('2024-11-30'),
          judgmentDate: new Date('2024-12-15'),
          judgmentReceivedDate: new Date('2024-12-20'),
        },
      });

      expect(updatedCase.firstConsultationDate).toEqual(new Date('2024-03-01'));
      expect(updatedCase.engagementDate).toEqual(new Date('2024-03-15'));
      expect(updatedCase.litigationStartDate).toEqual(new Date('2024-04-01'));
      expect(updatedCase.oralArgumentEndDate).toEqual(new Date('2024-11-30'));
      expect(updatedCase.judgmentDate).toEqual(new Date('2024-12-15'));
      expect(updatedCase.judgmentReceivedDate).toEqual(new Date('2024-12-20'));
    });

    it('should update case engagement letter info', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          hasEngagementLetter: true,
          engagementLetterPath: '/documents/updated-engagement.pdf',
        },
      });

      expect(updatedCase.hasEngagementLetter).toBe(true);
      expect(updatedCase.engagementLetterPath).toBe('/documents/updated-engagement.pdf');
    });

    it('should update case remarks and custom properties', async () => {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          remarks: '更新された備考',
          customProperties: { priority: 'high', clientType: 'corporate' },
        },
      });

      expect(updatedCase.remarks).toBe('更新された備考');
      expect(updatedCase.customProperties).toEqual({ priority: 'high', clientType: 'corporate' });
    });

    it('should fail to update non-existent case', async () => {
      await expect(
        prisma.case.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Case', () => {
    let caseId: string;

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
          caseNumber: '2024-DELETE-001',
          categoryId: category.id,
        },
      });
      caseId = case_.id;
    });

    it('should delete case by id', async () => {
      const deletedCase = await prisma.case.delete({
        where: { id: caseId },
      });

      expect(deletedCase.id).toBe(caseId);
      expect(deletedCase.name).toBe('削除テスト事件');

      const foundCase = await prisma.case.findUnique({
        where: { id: caseId },
      });
      expect(foundCase).toBeNull();
    });

    it('should fail to delete non-existent case', async () => {
      await expect(
        prisma.case.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Case Relations', () => {
    it('should create case with all relations', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: '関係テストフェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      const courthouse = await prisma.courthouse.create({
        data: {
          name: '関係テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '関係テスト事件',
          categoryId: category.id,
          currentPhaseId: phase.id,
          courtDivisionId: division.id,
        },
        include: {
          category: true,
          currentPhase: true,
          courtDivision: {
            include: {
              courthouse: true,
            },
          },
        },
      });

      expect(case_.category).toBeDefined();
      expect(case_.currentPhase).toBeDefined();
      expect(case_.courtDivision).toBeDefined();
      expect(case_.category.name).toBe('関係テストカテゴリ');
      expect(case_.currentPhase?.name).toBe('関係テストフェーズ');
      expect(case_.courtDivision?.name).toBe('民事部');
      expect(case_.courtDivision?.courthouse.name).toBe('関係テスト地方裁判所');
    });

    it('should find category with cases', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '案件一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      await prisma.case.createMany({
        data: [
          {
            name: '案件1',
            categoryId: category.id,
          },
          {
            name: '案件2',
            categoryId: category.id,
          },
          {
            name: '案件3',
            categoryId: category.id,
          },
        ],
      });

      const categoryWithCases = await prisma.caseCategory.findUnique({
        where: { id: category.id },
        include: {
          cases: true,
        },
      });

      expect(categoryWithCases?.cases).toHaveLength(3);
      expect(categoryWithCases?.cases[0].name).toBe('案件1');
      expect(categoryWithCases?.cases[1].name).toBe('案件2');
      expect(categoryWithCases?.cases[2].name).toBe('案件3');
    });
  });
});
