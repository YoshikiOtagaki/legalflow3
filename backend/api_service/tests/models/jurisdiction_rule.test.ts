import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('JurisdictionRule Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create JurisdictionRule', () => {
    let lowerCourthouseId: string;
    let superiorCourthouseId: string;

    beforeEach(async () => {
      const lowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '東京地方裁判所',
        },
      });
      lowerCourthouseId = lowerCourthouse.id;

      const superiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '東京高等裁判所',
        },
      });
      superiorCourthouseId = superiorCourthouse.id;
    });

    it('should create a new jurisdiction rule with required fields', async () => {
      const ruleData = {
        lowerCourthouseId: lowerCourthouseId,
        superiorCourthouseId: superiorCourthouseId,
      };

      const rule = await prisma.jurisdictionRule.create({
        data: ruleData,
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.lowerCourthouseId).toBe(lowerCourthouseId);
      expect(rule.superiorCourthouseId).toBe(superiorCourthouseId);
      expect(rule.caseCategoryId).toBeNull();
    });

    it('should create a jurisdiction rule with case category', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '民事事件',
          roleDefinitions: {},
        },
      });

      const rule = await prisma.jurisdictionRule.create({
        data: {
          lowerCourthouseId: lowerCourthouseId,
          superiorCourthouseId: superiorCourthouseId,
          caseCategoryId: category.id,
        },
      });

      expect(rule.caseCategoryId).toBe(category.id);
    });

    it('should fail to create rule without lower courthouse', async () => {
      await expect(
        prisma.jurisdictionRule.create({
          data: {
            lowerCourthouseId: 'non-existent-lower-courthouse-id',
            superiorCourthouseId: superiorCourthouseId,
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create rule without superior courthouse', async () => {
      await expect(
        prisma.jurisdictionRule.create({
          data: {
            lowerCourthouseId: lowerCourthouseId,
            superiorCourthouseId: 'non-existent-superior-courthouse-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create rule with non-existent case category', async () => {
      await expect(
        prisma.jurisdictionRule.create({
          data: {
            lowerCourthouseId: lowerCourthouseId,
            superiorCourthouseId: superiorCourthouseId,
            caseCategoryId: 'non-existent-category-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read JurisdictionRule', () => {
    let ruleId: string;

    beforeEach(async () => {
      const lowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '大阪地方裁判所',
        },
      });

      const superiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '大阪高等裁判所',
        },
      });

      const rule = await prisma.jurisdictionRule.create({
        data: {
          lowerCourthouseId: lowerCourthouse.id,
          superiorCourthouseId: superiorCourthouse.id,
        },
      });
      ruleId = rule.id;
    });

    it('should find jurisdiction rule by id', async () => {
      const foundRule = await prisma.jurisdictionRule.findUnique({
        where: { id: ruleId },
      });

      expect(foundRule).toBeDefined();
      expect(foundRule?.id).toBe(ruleId);
      expect(foundRule?.lowerCourthouseId).toBeDefined();
      expect(foundRule?.superiorCourthouseId).toBeDefined();
    });

    it('should find jurisdiction rule with courthouse relations', async () => {
      const foundRule = await prisma.jurisdictionRule.findUnique({
        where: { id: ruleId },
        include: {
          lowerCourthouse: true,
          superiorCourthouse: true,
        },
      });

      expect(foundRule?.lowerCourthouse).toBeDefined();
      expect(foundRule?.superiorCourthouse).toBeDefined();
      expect(foundRule?.lowerCourthouse.name).toBe('大阪地方裁判所');
      expect(foundRule?.superiorCourthouse.name).toBe('大阪高等裁判所');
    });

    it('should find jurisdiction rule with case category relation', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '刑事事件',
          roleDefinitions: {},
        },
      });

      await prisma.jurisdictionRule.update({
        where: { id: ruleId },
        data: { caseCategoryId: category.id },
      });

      const foundRule = await prisma.jurisdictionRule.findUnique({
        where: { id: ruleId },
        include: {
          caseCategory: true,
        },
      });

      expect(foundRule?.caseCategory).toBeDefined();
      expect(foundRule?.caseCategory?.name).toBe('刑事事件');
    });

    it('should find all jurisdiction rules', async () => {
      const rules = await prisma.jurisdictionRule.findMany();

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe(ruleId);
    });

    it('should find jurisdiction rules by lower courthouse', async () => {
      const rules = await prisma.jurisdictionRule.findMany({
        where: {
          lowerCourthouse: {
            name: '大阪地方裁判所',
          },
        },
      });

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe(ruleId);
    });

    it('should find jurisdiction rules by superior courthouse', async () => {
      const rules = await prisma.jurisdictionRule.findMany({
        where: {
          superiorCourthouse: {
            name: '大阪高等裁判所',
          },
        },
      });

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe(ruleId);
    });

    it('should return null for non-existent rule', async () => {
      const foundRule = await prisma.jurisdictionRule.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundRule).toBeNull();
    });
  });

  describe('Update JurisdictionRule', () => {
    let ruleId: string;
    let newLowerCourthouseId: string;
    let newSuperiorCourthouseId: string;

    beforeEach(async () => {
      const lowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '更新前地方裁判所',
        },
      });

      const superiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '更新前高等裁判所',
        },
      });

      const rule = await prisma.jurisdictionRule.create({
        data: {
          lowerCourthouseId: lowerCourthouse.id,
          superiorCourthouseId: superiorCourthouse.id,
        },
      });
      ruleId = rule.id;

      const newLowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '更新後地方裁判所',
        },
      });
      newLowerCourthouseId = newLowerCourthouse.id;

      const newSuperiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '更新後高等裁判所',
        },
      });
      newSuperiorCourthouseId = newSuperiorCourthouse.id;
    });

    it('should update lower courthouse', async () => {
      const updatedRule = await prisma.jurisdictionRule.update({
        where: { id: ruleId },
        data: {
          lowerCourthouseId: newLowerCourthouseId,
        },
      });

      expect(updatedRule.lowerCourthouseId).toBe(newLowerCourthouseId);
    });

    it('should update superior courthouse', async () => {
      const updatedRule = await prisma.jurisdictionRule.update({
        where: { id: ruleId },
        data: {
          superiorCourthouseId: newSuperiorCourthouseId,
        },
      });

      expect(updatedRule.superiorCourthouseId).toBe(newSuperiorCourthouseId);
    });

    it('should update case category', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const updatedRule = await prisma.jurisdictionRule.update({
        where: { id: ruleId },
        data: {
          caseCategoryId: category.id,
        },
      });

      expect(updatedRule.caseCategoryId).toBe(category.id);
    });

    it('should update multiple fields', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '複数更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const updatedRule = await prisma.jurisdictionRule.update({
        where: { id: ruleId },
        data: {
          lowerCourthouseId: newLowerCourthouseId,
          superiorCourthouseId: newSuperiorCourthouseId,
          caseCategoryId: category.id,
        },
      });

      expect(updatedRule.lowerCourthouseId).toBe(newLowerCourthouseId);
      expect(updatedRule.superiorCourthouseId).toBe(newSuperiorCourthouseId);
      expect(updatedRule.caseCategoryId).toBe(category.id);
    });

    it('should fail to update non-existent rule', async () => {
      await expect(
        prisma.jurisdictionRule.update({
          where: { id: 'non-existent-id' },
          data: {
            lowerCourthouseId: newLowerCourthouseId,
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to update with non-existent lower courthouse', async () => {
      await expect(
        prisma.jurisdictionRule.update({
          where: { id: ruleId },
          data: {
            lowerCourthouseId: 'non-existent-lower-courthouse-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to update with non-existent superior courthouse', async () => {
      await expect(
        prisma.jurisdictionRule.update({
          where: { id: ruleId },
          data: {
            superiorCourthouseId: 'non-existent-superior-courthouse-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete JurisdictionRule', () => {
    let ruleId: string;

    beforeEach(async () => {
      const lowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '削除テスト地方裁判所',
        },
      });

      const superiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '削除テスト高等裁判所',
        },
      });

      const rule = await prisma.jurisdictionRule.create({
        data: {
          lowerCourthouseId: lowerCourthouse.id,
          superiorCourthouseId: superiorCourthouse.id,
        },
      });
      ruleId = rule.id;
    });

    it('should delete jurisdiction rule by id', async () => {
      const deletedRule = await prisma.jurisdictionRule.delete({
        where: { id: ruleId },
      });

      expect(deletedRule.id).toBe(ruleId);
      expect(deletedRule.lowerCourthouseId).toBeDefined();
      expect(deletedRule.superiorCourthouseId).toBeDefined();

      const foundRule = await prisma.jurisdictionRule.findUnique({
        where: { id: ruleId },
      });
      expect(foundRule).toBeNull();
    });

    it('should fail to delete non-existent rule', async () => {
      await expect(
        prisma.jurisdictionRule.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('JurisdictionRule Relations', () => {
    it('should create jurisdiction rule with all relations', async () => {
      const lowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '関係テスト地方裁判所',
        },
      });

      const superiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '関係テスト高等裁判所',
        },
      });

      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const rule = await prisma.jurisdictionRule.create({
        data: {
          lowerCourthouseId: lowerCourthouse.id,
          superiorCourthouseId: superiorCourthouse.id,
          caseCategoryId: category.id,
        },
        include: {
          lowerCourthouse: true,
          superiorCourthouse: true,
          caseCategory: true,
        },
      });

      expect(rule.lowerCourthouse).toBeDefined();
      expect(rule.superiorCourthouse).toBeDefined();
      expect(rule.caseCategory).toBeDefined();
      expect(rule.lowerCourthouse.name).toBe('関係テスト地方裁判所');
      expect(rule.superiorCourthouse.name).toBe('関係テスト高等裁判所');
      expect(rule.caseCategory?.name).toBe('関係テストカテゴリ');
    });

    it('should find courthouse with jurisdiction rules', async () => {
      const lowerCourthouse = await prisma.courthouse.create({
        data: {
          name: '管轄規則一覧テスト地方裁判所',
        },
      });

      const superiorCourthouse1 = await prisma.courthouse.create({
        data: {
          name: '管轄規則一覧テスト高等裁判所1',
        },
      });

      const superiorCourthouse2 = await prisma.courthouse.create({
        data: {
          name: '管轄規則一覧テスト高等裁判所2',
        },
      });

      await prisma.jurisdictionRule.createMany({
        data: [
          {
            lowerCourthouseId: lowerCourthouse.id,
            superiorCourthouseId: superiorCourthouse1.id,
          },
          {
            lowerCourthouseId: lowerCourthouse.id,
            superiorCourthouseId: superiorCourthouse2.id,
          },
        ],
      });

      const courthouseWithRules = await prisma.courthouse.findUnique({
        where: { id: lowerCourthouse.id },
        include: {
          inferiorTo: true,
        },
      });

      expect(courthouseWithRules?.inferiorTo).toHaveLength(2);
    });

    it('should find case category with jurisdiction rules', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '管轄規則一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const lowerCourthouse1 = await prisma.courthouse.create({
        data: {
          name: '管轄規則一覧テスト地方裁判所1',
        },
      });

      const lowerCourthouse2 = await prisma.courthouse.create({
        data: {
          name: '管轄規則一覧テスト地方裁判所2',
        },
      });

      const superiorCourthouse = await prisma.courthouse.create({
        data: {
          name: '管轄規則一覧テスト高等裁判所',
        },
      });

      await prisma.jurisdictionRule.createMany({
        data: [
          {
            lowerCourthouseId: lowerCourthouse1.id,
            superiorCourthouseId: superiorCourthouse.id,
            caseCategoryId: category.id,
          },
          {
            lowerCourthouseId: lowerCourthouse2.id,
            superiorCourthouseId: superiorCourthouse.id,
            caseCategoryId: category.id,
          },
        ],
      });

      const categoryWithRules = await prisma.caseCategory.findUnique({
        where: { id: category.id },
        include: {
          jurisdictionRules: true,
        },
      });

      expect(categoryWithRules?.jurisdictionRules).toHaveLength(2);
    });
  });
});
