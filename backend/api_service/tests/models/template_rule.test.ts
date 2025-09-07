import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('PhaseTransitionRule, TaskTemplate, and TaskTemplateItem Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create TaskTemplate', () => {
    it('should create a new task template with required fields', async () => {
      const templateData = {
        name: '民事事件テンプレート',
      };

      const template = await prisma.taskTemplate.create({
        data: templateData,
      });

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe(templateData.name);
    });

    it('should create multiple task templates', async () => {
      const templates = [
        { name: '民事事件テンプレート' },
        { name: '刑事事件テンプレート' },
        { name: '家事事件テンプレート' },
        { name: '労働事件テンプレート' },
      ];

      for (const templateData of templates) {
        const template = await prisma.taskTemplate.create({
          data: templateData,
        });

        expect(template.name).toBe(templateData.name);
      }
    });
  });

  describe('Read TaskTemplate', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: '読取テストテンプレート',
        },
      });
      templateId = template.id;
    });

    it('should find task template by id', async () => {
      const foundTemplate = await prisma.taskTemplate.findUnique({
        where: { id: templateId },
      });

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate?.id).toBe(templateId);
      expect(foundTemplate?.name).toBe('読取テストテンプレート');
    });

    it('should find all task templates', async () => {
      const templates = await prisma.taskTemplate.findMany();

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('読取テストテンプレート');
    });

    it('should find task template by name', async () => {
      const foundTemplate = await prisma.taskTemplate.findFirst({
        where: { name: '読取テストテンプレート' },
      });

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate?.name).toBe('読取テストテンプレート');
    });

    it('should return null for non-existent template', async () => {
      const foundTemplate = await prisma.taskTemplate.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundTemplate).toBeNull();
    });
  });

  describe('Update TaskTemplate', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: '更新前テンプレート',
        },
      });
      templateId = template.id;
    });

    it('should update task template name', async () => {
      const updatedTemplate = await prisma.taskTemplate.update({
        where: { id: templateId },
        data: {
          name: '更新後テンプレート',
        },
      });

      expect(updatedTemplate.name).toBe('更新後テンプレート');
    });

    it('should fail to update non-existent template', async () => {
      await expect(
        prisma.taskTemplate.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete TaskTemplate', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: '削除テストテンプレート',
        },
      });
      templateId = template.id;
    });

    it('should delete task template by id', async () => {
      const deletedTemplate = await prisma.taskTemplate.delete({
        where: { id: templateId },
      });

      expect(deletedTemplate.id).toBe(templateId);
      expect(deletedTemplate.name).toBe('削除テストテンプレート');

      const foundTemplate = await prisma.taskTemplate.findUnique({
        where: { id: templateId },
      });
      expect(foundTemplate).toBeNull();
    });

    it('should fail to delete non-existent template', async () => {
      await expect(
        prisma.taskTemplate.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create TaskTemplateItem', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: 'アイテムテストテンプレート',
        },
      });
      templateId = template.id;
    });

    it('should create a new task template item with required fields', async () => {
      const itemData = {
        taskTemplateId: templateId,
        description: '準備書面を作成する',
        dueDateOffsetDays: 7,
      };

      const item = await prisma.taskTemplateItem.create({
        data: itemData,
      });

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.taskTemplateId).toBe(templateId);
      expect(item.description).toBe(itemData.description);
      expect(item.dueDateOffsetDays).toBe(itemData.dueDateOffsetDays);
    });

    it('should create multiple items for same template', async () => {
      const items = [
        { description: '準備書面作成', dueDateOffsetDays: 7 },
        { description: '証拠収集', dueDateOffsetDays: 14 },
        { description: '口頭弁論準備', dueDateOffsetDays: 21 },
        { description: '判決待ち', dueDateOffsetDays: 30 },
      ];

      for (const itemData of items) {
        const item = await prisma.taskTemplateItem.create({
          data: {
            taskTemplateId: templateId,
            ...itemData,
          },
        });

        expect(item.description).toBe(itemData.description);
        expect(item.dueDateOffsetDays).toBe(itemData.dueDateOffsetDays);
      }
    });

    it('should create items with different due date offsets', async () => {
      const offsets = [1, 3, 7, 14, 30, 60, 90];

      for (const offset of offsets) {
        const item = await prisma.taskTemplateItem.create({
          data: {
            taskTemplateId: templateId,
            description: `${offset}日後のタスク`,
            dueDateOffsetDays: offset,
          },
        });

        expect(item.dueDateOffsetDays).toBe(offset);
      }
    });

    it('should fail to create item without template', async () => {
      await expect(
        prisma.taskTemplateItem.create({
          data: {
            taskTemplateId: 'non-existent-template-id',
            description: 'テストアイテム',
            dueDateOffsetDays: 7,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read TaskTemplateItem', () => {
    let itemId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: 'アイテム読取テストテンプレート',
        },
      });

      const item = await prisma.taskTemplateItem.create({
        data: {
          taskTemplateId: template.id,
          description: '読取テストアイテム',
          dueDateOffsetDays: 10,
        },
      });
      itemId = item.id;
    });

    it('should find task template item by id', async () => {
      const foundItem = await prisma.taskTemplateItem.findUnique({
        where: { id: itemId },
      });

      expect(foundItem).toBeDefined();
      expect(foundItem?.id).toBe(itemId);
      expect(foundItem?.description).toBe('読取テストアイテム');
    });

    it('should find task template item with template relation', async () => {
      const foundItem = await prisma.taskTemplateItem.findUnique({
        where: { id: itemId },
        include: {
          taskTemplate: true,
        },
      });

      expect(foundItem?.taskTemplate).toBeDefined();
      expect(foundItem?.taskTemplate.name).toBe('アイテム読取テストテンプレート');
    });

    it('should find all task template items', async () => {
      const items = await prisma.taskTemplateItem.findMany();

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('読取テストアイテム');
    });

    it('should find items by template', async () => {
      const items = await prisma.taskTemplateItem.findMany({
        where: {
          taskTemplate: {
            name: 'アイテム読取テストテンプレート',
          },
        },
      });

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('読取テストアイテム');
    });

    it('should find items by due date offset range', async () => {
      const items = await prisma.taskTemplateItem.findMany({
        where: {
          dueDateOffsetDays: {
            gte: 5,
            lte: 15,
          },
        },
      });

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('読取テストアイテム');
    });

    it('should return null for non-existent item', async () => {
      const foundItem = await prisma.taskTemplateItem.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundItem).toBeNull();
    });
  });

  describe('Update TaskTemplateItem', () => {
    let itemId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: 'アイテム更新テストテンプレート',
        },
      });

      const item = await prisma.taskTemplateItem.create({
        data: {
          taskTemplateId: template.id,
          description: '更新前アイテム',
          dueDateOffsetDays: 5,
        },
      });
      itemId = item.id;
    });

    it('should update task template item description', async () => {
      const updatedItem = await prisma.taskTemplateItem.update({
        where: { id: itemId },
        data: {
          description: '更新後アイテム',
        },
      });

      expect(updatedItem.description).toBe('更新後アイテム');
    });

    it('should update task template item due date offset', async () => {
      const updatedItem = await prisma.taskTemplateItem.update({
        where: { id: itemId },
        data: {
          dueDateOffsetDays: 15,
        },
      });

      expect(updatedItem.dueDateOffsetDays).toBe(15);
    });

    it('should update multiple fields', async () => {
      const updatedItem = await prisma.taskTemplateItem.update({
        where: { id: itemId },
        data: {
          description: '複数更新アイテム',
          dueDateOffsetDays: 20,
        },
      });

      expect(updatedItem.description).toBe('複数更新アイテム');
      expect(updatedItem.dueDateOffsetDays).toBe(20);
    });

    it('should fail to update non-existent item', async () => {
      await expect(
        prisma.taskTemplateItem.update({
          where: { id: 'non-existent-id' },
          data: { description: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete TaskTemplateItem', () => {
    let itemId: string;

    beforeEach(async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: 'アイテム削除テストテンプレート',
        },
      });

      const item = await prisma.taskTemplateItem.create({
        data: {
          taskTemplateId: template.id,
          description: '削除テストアイテム',
          dueDateOffsetDays: 8,
        },
      });
      itemId = item.id;
    });

    it('should delete task template item by id', async () => {
      const deletedItem = await prisma.taskTemplateItem.delete({
        where: { id: itemId },
      });

      expect(deletedItem.id).toBe(itemId);
      expect(deletedItem.description).toBe('削除テストアイテム');

      const foundItem = await prisma.taskTemplateItem.findUnique({
        where: { id: itemId },
      });
      expect(foundItem).toBeNull();
    });

    it('should fail to delete non-existent item', async () => {
      await expect(
        prisma.taskTemplateItem.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create PhaseTransitionRule', () => {
    let fromPhaseId: string;
    let toPhaseId: string;
    let templateId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'ルールテストカテゴリ',
          roleDefinitions: {},
        },
      });

      const fromPhase = await prisma.casePhase.create({
        data: {
          name: '準備フェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      const toPhase = await prisma.casePhase.create({
        data: {
          name: '審理フェーズ',
          order: 2,
          categoryId: category.id,
        },
      });

      const template = await prisma.taskTemplate.create({
        data: {
          name: 'ルールテストテンプレート',
        },
      });

      fromPhaseId = fromPhase.id;
      toPhaseId = toPhase.id;
      templateId = template.id;
    });

    it('should create a new phase transition rule with required fields', async () => {
      const ruleData = {
        fromPhaseId: fromPhaseId,
        toPhaseId: toPhaseId,
        taskTemplateId: templateId,
      };

      const rule = await prisma.phaseTransitionRule.create({
        data: ruleData,
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.fromPhaseId).toBe(fromPhaseId);
      expect(rule.toPhaseId).toBe(toPhaseId);
      expect(rule.taskTemplateId).toBe(templateId);
    });

    it('should create multiple transition rules', async () => {
      const category = await prisma.caseCategory.findFirst();
      const toPhase2 = await prisma.casePhase.create({
        data: {
          name: '判決フェーズ',
          order: 3,
          categoryId: category!.id,
        },
      });

      const template2 = await prisma.taskTemplate.create({
        data: {
          name: 'ルールテストテンプレート2',
        },
      });

      const rules = [
        {
          fromPhaseId: fromPhaseId,
          toPhaseId: toPhaseId,
          taskTemplateId: templateId,
        },
        {
          fromPhaseId: toPhaseId,
          toPhaseId: toPhase2.id,
          taskTemplateId: template2.id,
        },
      ];

      for (const ruleData of rules) {
        const rule = await prisma.phaseTransitionRule.create({
          data: ruleData,
        });

        expect(rule.fromPhaseId).toBe(ruleData.fromPhaseId);
        expect(rule.toPhaseId).toBe(ruleData.toPhaseId);
        expect(rule.taskTemplateId).toBe(ruleData.taskTemplateId);
      }
    });

    it('should fail to create rule without from phase', async () => {
      await expect(
        prisma.phaseTransitionRule.create({
          data: {
            fromPhaseId: 'non-existent-phase-id',
            toPhaseId: toPhaseId,
            taskTemplateId: templateId,
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create rule without to phase', async () => {
      await expect(
        prisma.phaseTransitionRule.create({
          data: {
            fromPhaseId: fromPhaseId,
            toPhaseId: 'non-existent-phase-id',
            taskTemplateId: templateId,
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create rule without template', async () => {
      await expect(
        prisma.phaseTransitionRule.create({
          data: {
            fromPhaseId: fromPhaseId,
            toPhaseId: toPhaseId,
            taskTemplateId: 'non-existent-template-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read PhaseTransitionRule', () => {
    let ruleId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'ルール読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const fromPhase = await prisma.casePhase.create({
        data: {
          name: '読取テスト準備フェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      const toPhase = await prisma.casePhase.create({
        data: {
          name: '読取テスト審理フェーズ',
          order: 2,
          categoryId: category.id,
        },
      });

      const template = await prisma.taskTemplate.create({
        data: {
          name: 'ルール読取テストテンプレート',
        },
      });

      const rule = await prisma.phaseTransitionRule.create({
        data: {
          fromPhaseId: fromPhase.id,
          toPhaseId: toPhase.id,
          taskTemplateId: template.id,
        },
      });
      ruleId = rule.id;
    });

    it('should find phase transition rule by id', async () => {
      const foundRule = await prisma.phaseTransitionRule.findUnique({
        where: { id: ruleId },
      });

      expect(foundRule).toBeDefined();
      expect(foundRule?.id).toBe(ruleId);
    });

    it('should find phase transition rule with relations', async () => {
      const foundRule = await prisma.phaseTransitionRule.findUnique({
        where: { id: ruleId },
        include: {
          fromPhase: true,
          toPhase: true,
          taskTemplate: true,
        },
      });

      expect(foundRule?.fromPhase).toBeDefined();
      expect(foundRule?.fromPhase.name).toBe('読取テスト準備フェーズ');
      expect(foundRule?.toPhase).toBeDefined();
      expect(foundRule?.toPhase.name).toBe('読取テスト審理フェーズ');
      expect(foundRule?.taskTemplate).toBeDefined();
      expect(foundRule?.taskTemplate.name).toBe('ルール読取テストテンプレート');
    });

    it('should find all phase transition rules', async () => {
      const rules = await prisma.phaseTransitionRule.findMany();

      expect(rules).toHaveLength(1);
    });

    it('should find rules by from phase', async () => {
      const rules = await prisma.phaseTransitionRule.findMany({
        where: {
          fromPhase: {
            name: '読取テスト準備フェーズ',
          },
        },
      });

      expect(rules).toHaveLength(1);
    });

    it('should find rules by to phase', async () => {
      const rules = await prisma.phaseTransitionRule.findMany({
        where: {
          toPhase: {
            name: '読取テスト審理フェーズ',
          },
        },
      });

      expect(rules).toHaveLength(1);
    });

    it('should find rules by template', async () => {
      const rules = await prisma.phaseTransitionRule.findMany({
        where: {
          taskTemplate: {
            name: 'ルール読取テストテンプレート',
          },
        },
      });

      expect(rules).toHaveLength(1);
    });

    it('should return null for non-existent rule', async () => {
      const foundRule = await prisma.phaseTransitionRule.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundRule).toBeNull();
    });
  });

  describe('Delete PhaseTransitionRule', () => {
    let ruleId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'ルール削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const fromPhase = await prisma.casePhase.create({
        data: {
          name: '削除テスト準備フェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      const toPhase = await prisma.casePhase.create({
        data: {
          name: '削除テスト審理フェーズ',
          order: 2,
          categoryId: category.id,
        },
      });

      const template = await prisma.taskTemplate.create({
        data: {
          name: 'ルール削除テストテンプレート',
        },
      });

      const rule = await prisma.phaseTransitionRule.create({
        data: {
          fromPhaseId: fromPhase.id,
          toPhaseId: toPhase.id,
          taskTemplateId: template.id,
        },
      });
      ruleId = rule.id;
    });

    it('should delete phase transition rule by id', async () => {
      const deletedRule = await prisma.phaseTransitionRule.delete({
        where: { id: ruleId },
      });

      expect(deletedRule.id).toBe(ruleId);

      const foundRule = await prisma.phaseTransitionRule.findUnique({
        where: { id: ruleId },
      });
      expect(foundRule).toBeNull();
    });

    it('should fail to delete non-existent rule', async () => {
      await expect(
        prisma.phaseTransitionRule.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Template and Rule Relations', () => {
    it('should find template with items and rules', async () => {
      const template = await prisma.taskTemplate.create({
        data: {
          name: '関係テストテンプレート',
        },
      });

      await prisma.taskTemplateItem.createMany({
        data: [
          {
            taskTemplateId: template.id,
            description: 'アイテム1',
            dueDateOffsetDays: 7,
          },
          {
            taskTemplateId: template.id,
            description: 'アイテム2',
            dueDateOffsetDays: 14,
          },
        ],
      });

      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const fromPhase = await prisma.casePhase.create({
        data: {
          name: '関係テスト準備フェーズ',
          order: 1,
          categoryId: category.id,
        },
      });

      const toPhase = await prisma.casePhase.create({
        data: {
          name: '関係テスト審理フェーズ',
          order: 2,
          categoryId: category.id,
        },
      });

      await prisma.phaseTransitionRule.create({
        data: {
          fromPhaseId: fromPhase.id,
          toPhaseId: toPhase.id,
          taskTemplateId: template.id,
        },
      });

      const templateWithRelations = await prisma.taskTemplate.findUnique({
        where: { id: template.id },
        include: {
          items: true,
          rules: {
            include: {
              fromPhase: true,
              toPhase: true,
            },
          },
        },
      });

      expect(templateWithRelations?.items).toHaveLength(2);
      expect(templateWithRelations?.rules).toHaveLength(1);
      expect(templateWithRelations?.items[0].description).toBe('アイテム1');
      expect(templateWithRelations?.items[1].description).toBe('アイテム2');
      expect(templateWithRelations?.rules[0].fromPhase.name).toBe('関係テスト準備フェーズ');
      expect(templateWithRelations?.rules[0].toPhase.name).toBe('関係テスト審理フェーズ');
    });
  });
});
