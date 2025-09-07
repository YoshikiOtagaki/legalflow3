import { agent } from '../api-test-setup'; // 修正: appの代わりにagentをインポート
import { PrismaClient } from '@prisma/client';
// import app from '../../src/index'; // 削除またはコメントアウト
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Cases API Endpoints', () => {
  // 各テストの前にデータベースをクリーンアップ
  beforeEach(cleanupDatabase);

  // 各テストの後にデータベースをクリーンアップ
  afterEach(cleanupDatabase);

  describe('GET /api/cases', () => {
    it('should return empty array when no cases exist', async () => {
      const response = await agent
        .get('/api/cases')
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    });

    it('should return cases with pagination', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 複数の案件を作成
      await prisma.case.createMany({
        data: [
          { name: '案件1', categoryId: category.id },
          { name: '案件2', categoryId: category.id },
          { name: '案件3', categoryId: category.id },
        ],
      });

      const response = await agent
        .get('/api/cases')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should support pagination parameters', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 複数の案件を作成
      await prisma.case.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `案件${i + 1}`,
          categoryId: category.id,
        })),
      });

      const response = await agent
        .get('/api/cases?page=2&limit=5')
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.pages).toBe(3);
    });

    it('should filter by categoryId', async () => {
      // テスト用のカテゴリを作成
      const category1 = await prisma.caseCategory.create({
        data: {
          name: `カテゴリ1_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const category2 = await prisma.caseCategory.create({
        data: {
          name: `カテゴリ2_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 各カテゴリに案件を作成
      await prisma.case.createMany({
        data: [
          { name: '案件1', categoryId: category1.id },
          { name: '案件2', categoryId: category2.id },
          { name: '案件3', categoryId: category1.id },
        ],
      });

      const response = await agent
        .get(`/api/cases?categoryId=${category1.id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].categoryId).toBe(category1.id);
      expect(response.body.data[1].categoryId).toBe(category1.id);
    });

    it('should filter by status', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 異なるステータスの案件を作成
      await prisma.case.createMany({
        data: [
          { name: '案件1', categoryId: category.id, status: 'Active' },
          { name: '案件2', categoryId: category.id, status: 'Closed' },
          { name: '案件3', categoryId: category.id, status: 'Active' },
        ],
      });

      const response = await agent
        .get('/api/cases?status=Active')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].status).toBe('Active');
      expect(response.body.data[1].status).toBe('Active');
    });

    it('should include related data', async () => {
      // テスト用のカテゴリとフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: 'テストフェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      // 案件を作成
      await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
          currentPhaseId: phase.id,
        },
      });

      const response = await agent
        .get('/api/cases')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('category');
      expect(response.body.data[0]).toHaveProperty('currentPhase');
      expect(response.body.data[0]).toHaveProperty('parties');
      expect(response.body.data[0]).toHaveProperty('tasks');
    });
  });

  describe('GET /api/cases/:id', () => {
    it('should return case by id', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 案件を作成
      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      const response = await agent
        .get(`/api/cases/${case_.id}`)
        .expect(200);

      expect(response.body.data.id).toBe(case_.id);
      expect(response.body.data.name).toBe('テスト案件');
    });

    it('should return 404 for non-existent case', async () => {
      const response = await agent
        .get('/api/cases/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Case not found');
    });

    it('should include all related data', async () => {
      // テスト用のカテゴリとフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: 'テストフェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      // 案件を作成
      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
          currentPhaseId: phase.id,
        },
      });

      const response = await agent
        .get(`/api/cases/${case_.id}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('category');
      expect(response.body.data).toHaveProperty('currentPhase');
      expect(response.body.data).toHaveProperty('parties');
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('expenses');
      expect(response.body.data).toHaveProperty('deposits');
      expect(response.body.data).toHaveProperty('memos');
      expect(response.body.data).toHaveProperty('timesheetEntries');
    });
  });

  describe('POST /api/cases', () => {
    it('should create a new case with required fields', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const caseData = {
        name: '新しい案件',
        categoryId: category.id,
      };

      const response = await agent
        .post('/api/cases')
        .send(caseData)
        .expect(201);

      expect(response.body.data.name).toBe('新しい案件');
      expect(response.body.data.categoryId).toBe(category.id);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should create a case with all optional fields', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const caseData = {
        name: '完全な案件',
        caseNumber: 'CASE-2024-001',
        categoryId: category.id,
        status: 'Active',
        trialLevel: 'First Instance',
        hourlyRate: 50000,
        firstConsultationDate: '2024-01-15T10:00:00Z',
        engagementDate: '2024-01-20T09:00:00Z',
        hasEngagementLetter: true,
        engagementLetterPath: '/documents/engagement.pdf',
        remarks: '重要な案件',
        customProperties: {
          priority: 'high',
          source: 'referral',
        },
      };

      const response = await agent
        .post('/api/cases')
        .send(caseData)
        .expect(201);

      expect(response.body.data.name).toBe('完全な案件');
      expect(response.body.data.caseNumber).toBe('CASE-2024-001');
      expect(response.body.data.status).toBe('Active');
      expect(response.body.data.hourlyRate).toBe(50000);
      expect(response.body.data.hasEngagementLetter).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await agent
        .post('/api/cases')
        .send({ name: 'テスト案件' })
        .expect(400);

      expect(response.body.error).toBe('Name and categoryId are required');
    });

    it('should return 400 for invalid categoryId', async () => {
      const response = await agent
        .post('/api/cases')
        .send({
          name: 'テスト案件',
          categoryId: 'non-existent-category-id',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid categoryId');
    });
  });

  describe('PUT /api/cases/:id', () => {
    it('should update case successfully', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 案件を作成
      const case_ = await prisma.case.create({
        data: {
          name: '元の案件名',
          categoryId: category.id,
        },
      });

      const updateData = {
        name: '更新された案件名',
        status: 'Active',
        remarks: '更新された備考',
      };

      const response = await agent
        .put(`/api/cases/${case_.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('更新された案件名');
      expect(response.body.data.status).toBe('Active');
      expect(response.body.data.remarks).toBe('更新された備考');
    });

    it('should return 404 for non-existent case', async () => {
      const response = await agent
        .put('/api/cases/non-existent-id')
        .send({ name: '更新' })
        .expect(404);

      expect(response.body.error).toBe('Case not found');
    });

    it('should handle date fields correctly', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 案件を作成
      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      const updateData = {
        firstConsultationDate: '2024-01-15T10:00:00Z',
        engagementDate: '2024-01-20T09:00:00Z',
        caseClosedDate: '2024-12-31T17:00:00Z',
      };

      const response = await agent
        .put(`/api/cases/${case_.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.firstConsultationDate).toBeDefined();
      expect(response.body.data.engagementDate).toBeDefined();
      expect(response.body.data.caseClosedDate).toBeDefined();
    });
  });

  describe('DELETE /api/cases/:id', () => {
    it('should delete case successfully', async () => {
      // テスト用のカテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      // 案件を作成
      const case_ = await prisma.case.create({
        data: {
          name: '削除対象案件',
          categoryId: category.id,
        },
      });

      await agent
        .delete(`/api/cases/${case_.id}`)
        .expect(204);

      // 削除されたことを確認
      const deletedCase = await prisma.case.findUnique({
        where: { id: case_.id },
      });
      expect(deletedCase).toBeNull();
    });

    it('should return 404 for non-existent case', async () => {
      const response = await agent
        .delete('/api/cases/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Case not found');
    });
  });

  describe('GET /api/cases/:id/parties', () => {
    it('should return case parties', async () => {
      // テスト用のカテゴリと案件を作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      // 当事者を作成
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              firstName: '太郎',
              lastName: '田中',
            },
          },
        },
      });

      // 案件に当事者を追加
      await prisma.caseParty.create({
        data: {
          caseId: case_.id,
          partyId: party.id,
          role: 'plaintiff',
        },
      });

      const response = await agent
        .get(`/api/cases/${case_.id}/parties`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('plaintiff');
      expect(response.body.data[0].party).toBeDefined();
    });

    it('should return empty array when no parties', async () => {
      // テスト用のカテゴリと案件を作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      const response = await agent
        .get(`/api/cases/${case_.id}/parties`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/cases/:id/parties', () => {
    it('should add party to case', async () => {
      // テスト用のカテゴリと案件を作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      // 当事者を作成
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              firstName: '花子',
              lastName: '佐藤',
            },
          },
        },
      });

      const partyData = {
        partyId: party.id,
        role: 'defendant',
      };

      const response = await agent
        .post(`/api/cases/${case_.id}/parties`)
        .send(partyData)
        .expect(201);

      expect(response.body.data.caseId).toBe(case_.id);
      expect(response.body.data.partyId).toBe(party.id);
      expect(response.body.data.role).toBe('defendant');
    });

    it('should return 400 for missing required fields', async () => {
      // テスト用のカテゴリと案件を作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      const response = await agent
        .post(`/api/cases/${case_.id}/parties`)
        .send({ partyId: 'test-party-id' })
        .expect(400);

      expect(response.body.error).toBe('partyId and role are required');
    });

    it('should return 400 for duplicate party role', async () => {
      // テスト用のカテゴリと案件を作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      // 当事者を作成
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              firstName: '太郎',
              lastName: '田中',
            },
          },
        },
      });

      // 最初の当事者を追加
      await prisma.caseParty.create({
        data: {
          caseId: case_.id,
          partyId: party.id,
          role: 'plaintiff',
        },
      });

      // 同じ当事者を同じ役割で追加しようとして失敗
      const response = await agent
        .post(`/api/cases/${case_.id}/parties`)
        .send({
          partyId: party.id,
          role: 'plaintiff',
        })
        .expect(400);

      expect(response.body.error).toBe('Party already exists in this case with this role');
    });
  });

  describe('DELETE /api/cases/:id/parties/:partyId/:role', () => {
    it('should remove party from case', async () => {
      // テスト用のカテゴリと案件を作成
      const category = await prisma.caseCategory.create({
        data: {
          name: `テストカテゴリ_${Date.now()}`,
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト案件',
          categoryId: category.id,
        },
      });

      // 当事者を作成
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              firstName: '太郎',
              lastName: '田中',
            },
          },
        },
      });

      // 案件に当事者を追加
      await prisma.caseParty.create({
        data: {
          caseId: case_.id,
          partyId: party.id,
          role: 'plaintiff',
        },
      });

      await agent
        .delete(`/api/cases/${case_.id}/parties/${party.id}/plaintiff`)
        .expect(204);

      // 削除されたことを確認
      const caseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: case_.id,
            partyId: party.id,
            role: 'plaintiff',
          },
        },
      });
      expect(caseParty).toBeNull();
    });

    it('should return 404 for non-existent case party', async () => {
      const response = await agent
        .delete('/api/cases/case-id/parties/party-id/role')
        .expect(404);

      expect(response.body.error).toBe('Case party not found');
    });
  });
});
