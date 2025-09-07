import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('CaseCategory and CasePhase Model CRUD Operations', () => {
  beforeAll(async () => {
    // テスト用のデータベース接続を確立
    await prisma.$connect();
  });

  afterAll(async () => {
    // テスト用のデータベース接続を閉じる
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create CaseCategory', () => {
    it('should create a new case category with required fields', async () => {
      const categoryData = {
        name: '民事事件',
        roleDefinitions: {
          plaintiff: '原告',
          defendant: '被告',
          lawyer: '弁護士',
        },
      };

      const category = await prisma.caseCategory.create({
        data: categoryData,
      });

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.roleDefinitions).toEqual(categoryData.roleDefinitions);
      expect(category.parentCategoryId).toBeNull();
    });

    it('should create a case category with parent category', async () => {
      // 親カテゴリを作成
      const parentCategory = await prisma.caseCategory.create({
        data: {
          name: '民事事件',
          roleDefinitions: {},
        },
      });

      const category = await prisma.caseCategory.create({
        data: {
          name: '交通事故',
          parentCategoryId: parentCategory.id,
          roleDefinitions: {
            plaintiff: '被害者',
            defendant: '加害者',
          },
        },
      });

      expect(category.parentCategoryId).toBe(parentCategory.id);
      expect(category.name).toBe('交通事故');
    });

    it('should create a case category with complex role definitions', async () => {
      const complexRoleDefinitions = {
        plaintiff: '原告',
        defendant: '被告',
        lawyer: '弁護士',
        judge: '裁判官',
        clerk: '書記官',
        witness: '証人',
        expert: '専門家',
      };

      const category = await prisma.caseCategory.create({
        data: {
          name: '複雑な事件',
          roleDefinitions: complexRoleDefinitions,
        },
      });

      expect(category.roleDefinitions).toEqual(complexRoleDefinitions);
    });

    it('should fail to create category with duplicate name', async () => {
      // 最初のカテゴリを作成
      await prisma.caseCategory.create({
        data: {
          name: '重複テストカテゴリ',
          roleDefinitions: {},
        },
      });

      // 同じ名前でカテゴリを作成しようとして失敗
      await expect(
        prisma.caseCategory.create({
          data: {
            name: '重複テストカテゴリ',
            roleDefinitions: {},
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create category with non-existent parent', async () => {
      await expect(
        prisma.caseCategory.create({
          data: {
            name: '存在しない親カテゴリ',
            parentCategoryId: 'non-existent-parent-id',
            roleDefinitions: {},
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CaseCategory', () => {
    let categoryId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: '読取テストカテゴリ',
          roleDefinitions: {
            plaintiff: '原告',
            defendant: '被告',
          },
        },
      });
      categoryId = category.id;
    });

    it('should find case category by id', async () => {
      const foundCategory = await prisma.caseCategory.findUnique({
        where: { id: categoryId },
      });

      expect(foundCategory).toBeDefined();
      expect(foundCategory?.id).toBe(categoryId);
      expect(foundCategory?.name).toBe('読取テストカテゴリ');
    });

    it('should find case category by name', async () => {
      const foundCategory = await prisma.caseCategory.findUnique({
        where: { name: '読取テストカテゴリ' },
      });

      expect(foundCategory).toBeDefined();
      expect(foundCategory?.id).toBe(categoryId);
    });

    it('should find all case categories', async () => {
      const categories = await prisma.caseCategory.findMany();

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('読取テストカテゴリ');
    });

    it('should find case categories with parent-child relations', async () => {
      // 親カテゴリを作成
      const parentCategory = await prisma.caseCategory.create({
        data: {
          name: '親カテゴリ',
          roleDefinitions: {},
        },
      });

      // 子カテゴリを作成
      const childCategory = await prisma.caseCategory.create({
        data: {
          name: '子カテゴリ',
          parentCategoryId: parentCategory.id,
          roleDefinitions: {},
        },
      });

      const parentWithChildren = await prisma.caseCategory.findUnique({
        where: { id: parentCategory.id },
        include: {
          subCategories: true,
        },
      });

      const childWithParent = await prisma.caseCategory.findUnique({
        where: { id: childCategory.id },
        include: {
          parentCategory: true,
        },
      });

      expect(parentWithChildren?.subCategories).toHaveLength(1);
      expect(parentWithChildren?.subCategories[0].name).toBe('子カテゴリ');
      expect(childWithParent?.parentCategory).toBeDefined();
      expect(childWithParent?.parentCategory?.name).toBe('親カテゴリ');
    });

    it('should return null for non-existent category', async () => {
      const foundCategory = await prisma.caseCategory.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundCategory).toBeNull();
    });
  });

  describe('Update CaseCategory', () => {
    let categoryId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新前カテゴリ',
          roleDefinitions: {
            oldRole: '古い役割',
          },
        },
      });
      categoryId = category.id;
    });

    it('should update case category name', async () => {
      const updatedCategory = await prisma.caseCategory.update({
        where: { id: categoryId },
        data: {
          name: '更新後カテゴリ',
        },
      });

      expect(updatedCategory.name).toBe('更新後カテゴリ');
    });

    it('should update case category role definitions', async () => {
      const newRoleDefinitions = {
        plaintiff: '原告',
        defendant: '被告',
        lawyer: '弁護士',
      };

      const updatedCategory = await prisma.caseCategory.update({
        where: { id: categoryId },
        data: {
          roleDefinitions: newRoleDefinitions,
        },
      });

      expect(updatedCategory.roleDefinitions).toEqual(newRoleDefinitions);
    });

    it('should update case category parent', async () => {
      // 新しい親カテゴリを作成
      const newParent = await prisma.caseCategory.create({
        data: {
          name: '新しい親カテゴリ',
          roleDefinitions: {},
        },
      });

      const updatedCategory = await prisma.caseCategory.update({
        where: { id: categoryId },
        data: {
          parentCategoryId: newParent.id,
        },
      });

      expect(updatedCategory.parentCategoryId).toBe(newParent.id);
    });

    it('should fail to update non-existent category', async () => {
      await expect(
        prisma.caseCategory.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CaseCategory', () => {
    let categoryId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: '削除テストカテゴリ',
          roleDefinitions: {},
        },
      });
      categoryId = category.id;
    });

    it('should delete case category by id', async () => {
      const deletedCategory = await prisma.caseCategory.delete({
        where: { id: categoryId },
      });

      expect(deletedCategory.id).toBe(categoryId);
      expect(deletedCategory.name).toBe('削除テストカテゴリ');

      // 削除されたカテゴリが存在しないことを確認
      const foundCategory = await prisma.caseCategory.findUnique({
        where: { id: categoryId },
      });
      expect(foundCategory).toBeNull();
    });

    it('should fail to delete non-existent category', async () => {
      await expect(
        prisma.caseCategory.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create CasePhase', () => {
    let categoryId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'フェーズテストカテゴリ',
          roleDefinitions: {},
        },
      });
      categoryId = category.id;
    });

    it('should create a new case phase with required fields', async () => {
      const phaseData = {
        name: '準備書面提出',
        order: 1,
        categoryId: categoryId,
      };

      const phase = await prisma.casePhase.create({
        data: phaseData,
      });

      expect(phase).toBeDefined();
      expect(phase.id).toBeDefined();
      expect(phase.name).toBe(phaseData.name);
      expect(phase.order).toBe(phaseData.order);
      expect(phase.categoryId).toBe(categoryId);
    });

    it('should create multiple phases for same category', async () => {
      const phases = [
        { name: '準備書面提出', order: 1 },
        { name: '証拠調べ', order: 2 },
        { name: '口頭弁論', order: 3 },
        { name: '判決', order: 4 },
      ];

      for (const phaseData of phases) {
        const phase = await prisma.casePhase.create({
          data: {
            ...phaseData,
            categoryId: categoryId,
          },
        });

        expect(phase.name).toBe(phaseData.name);
        expect(phase.order).toBe(phaseData.order);
      }
    });

    it('should fail to create phase without category', async () => {
      await expect(
        prisma.casePhase.create({
          data: {
            name: 'テストフェーズ',
            order: 1,
            categoryId: 'non-existent-category-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CasePhase', () => {
    let phaseId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリとフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'フェーズ読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: '読取テストフェーズ',
          order: 5,
          categoryId: category.id,
        },
      });
      phaseId = phase.id;
    });

    it('should find case phase by id', async () => {
      const foundPhase = await prisma.casePhase.findUnique({
        where: { id: phaseId },
      });

      expect(foundPhase).toBeDefined();
      expect(foundPhase?.id).toBe(phaseId);
      expect(foundPhase?.name).toBe('読取テストフェーズ');
    });

    it('should find case phase with category relation', async () => {
      const foundPhase = await prisma.casePhase.findUnique({
        where: { id: phaseId },
        include: {
          category: true,
        },
      });

      expect(foundPhase?.category).toBeDefined();
      expect(foundPhase?.category.name).toBe('フェーズ読取テストカテゴリ');
    });

    it('should find all case phases', async () => {
      const phases = await prisma.casePhase.findMany();

      expect(phases).toHaveLength(1);
      expect(phases[0].name).toBe('読取テストフェーズ');
    });

    it('should find case phases by category', async () => {
      const phases = await prisma.casePhase.findMany({
        where: {
          category: {
            name: 'フェーズ読取テストカテゴリ',
          },
        },
      });

      expect(phases).toHaveLength(1);
      expect(phases[0].name).toBe('読取テストフェーズ');
    });

    it('should find case phases ordered by order field', async () => {
      // 複数のフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: '順序テストカテゴリ',
          roleDefinitions: {},
        },
      });

      await prisma.casePhase.createMany({
        data: [
          { name: 'フェーズ3', order: 3, categoryId: category.id },
          { name: 'フェーズ1', order: 1, categoryId: category.id },
          { name: 'フェーズ2', order: 2, categoryId: category.id },
        ],
      });

      const phases = await prisma.casePhase.findMany({
        where: { categoryId: category.id },
        orderBy: { order: 'asc' },
      });

      expect(phases).toHaveLength(3);
      expect(phases[0].name).toBe('フェーズ1');
      expect(phases[1].name).toBe('フェーズ2');
      expect(phases[2].name).toBe('フェーズ3');
    });

    it('should return null for non-existent phase', async () => {
      const foundPhase = await prisma.casePhase.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundPhase).toBeNull();
    });
  });

  describe('Update CasePhase', () => {
    let phaseId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリとフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'フェーズ更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: '更新前フェーズ',
          order: 1,
          categoryId: category.id,
        },
      });
      phaseId = phase.id;
    });

    it('should update case phase name', async () => {
      const updatedPhase = await prisma.casePhase.update({
        where: { id: phaseId },
        data: {
          name: '更新後フェーズ',
        },
      });

      expect(updatedPhase.name).toBe('更新後フェーズ');
    });

    it('should update case phase order', async () => {
      const updatedPhase = await prisma.casePhase.update({
        where: { id: phaseId },
        data: {
          order: 10,
        },
      });

      expect(updatedPhase.order).toBe(10);
    });

    it('should fail to update non-existent phase', async () => {
      await expect(
        prisma.casePhase.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CasePhase', () => {
    let phaseId: string;

    beforeEach(async () => {
      // テスト用の案件カテゴリとフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'フェーズ削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: '削除テストフェーズ',
          order: 1,
          categoryId: category.id,
        },
      });
      phaseId = phase.id;
    });

    it('should delete case phase by id', async () => {
      const deletedPhase = await prisma.casePhase.delete({
        where: { id: phaseId },
      });

      expect(deletedPhase.id).toBe(phaseId);
      expect(deletedPhase.name).toBe('削除テストフェーズ');

      // 削除されたフェーズが存在しないことを確認
      const foundPhase = await prisma.casePhase.findUnique({
        where: { id: phaseId },
      });
      expect(foundPhase).toBeNull();
    });

    it('should fail to delete non-existent phase', async () => {
      await expect(
        prisma.casePhase.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('CaseCategory and CasePhase Relations', () => {
    it('should find category with phases', async () => {
      // 案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'カテゴリフェーズ一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      // 複数のフェーズを作成
      await prisma.casePhase.createMany({
        data: [
          { name: 'フェーズ1', order: 1, categoryId: category.id },
          { name: 'フェーズ2', order: 2, categoryId: category.id },
          { name: 'フェーズ3', order: 3, categoryId: category.id },
        ],
      });

      const categoryWithPhases = await prisma.caseCategory.findUnique({
        where: { id: category.id },
        include: {
          phases: {
            orderBy: { order: 'asc' },
          },
        },
      });

      expect(categoryWithPhases?.phases).toHaveLength(3);
      expect(categoryWithPhases?.phases[0].name).toBe('フェーズ1');
      expect(categoryWithPhases?.phases[1].name).toBe('フェーズ2');
      expect(categoryWithPhases?.phases[2].name).toBe('フェーズ3');
    });

    it('should find category with cases', async () => {
      // 案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'カテゴリ案件一覧テストカテゴリ',
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

    it('should find phase with cases', async () => {
      // 案件カテゴリとフェーズを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'フェーズ案件一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const phase = await prisma.casePhase.create({
        data: {
          name: 'フェーズ案件一覧テストフェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      // 複数の案件を作成
      await prisma.case.createMany({
        data: [
          { name: '案件1', categoryId: category.id, currentPhaseId: phase.id },
          { name: '案件2', categoryId: category.id, currentPhaseId: phase.id },
        ],
      });

      const phaseWithCases = await prisma.casePhase.findUnique({
        where: { id: phase.id },
        include: {
          cases: true,
        },
      });

      expect(phaseWithCases?.cases).toHaveLength(2);
      expect(phaseWithCases?.cases[0].name).toBe('案件1');
      expect(phaseWithCases?.cases[1].name).toBe('案件2');
    });
  });
});
