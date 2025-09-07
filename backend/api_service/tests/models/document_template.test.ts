import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('DocumentTemplate Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create DocumentTemplate', () => {
    it('should create a new document template with required fields', async () => {
      const templateData = {
        name: '準備書面テンプレート',
        filePath: '/templates/preparation_document.docx',
        placeholders: {
          caseName: '案件名',
          clientName: '依頼人名',
          lawyerName: '弁護士名',
          date: '日付',
        },
      };

      const template = await prisma.documentTemplate.create({
        data: templateData,
      });

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.filePath).toBe(templateData.filePath);
      expect(template.placeholders).toEqual(templateData.placeholders);
    });

    it('should create a document template with minimal placeholders', async () => {
      const template = await prisma.documentTemplate.create({
        data: {
          name: 'シンプルテンプレート',
          filePath: '/templates/simple.docx',
          placeholders: {},
        },
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('シンプルテンプレート');
      expect(template.placeholders).toEqual({});
    });

    it('should create a document template with complex placeholders', async () => {
      const complexPlaceholders = {
        case: {
          name: '案件名',
          number: '事件番号',
          status: '事件の状況',
        },
        client: {
          name: '依頼人名',
          address: '住所',
          phone: '電話番号',
        },
        lawyer: {
          name: '弁護士名',
          firm: '所属事務所',
          license: '弁護士登録番号',
        },
        court: {
          name: '裁判所名',
          division: '部',
          judge: '裁判官名',
        },
        dates: {
          filing: '提訴日',
          hearing: '期日',
          deadline: '期限',
        },
        custom: {
          field1: 'カスタムフィールド1',
          field2: 'カスタムフィールド2',
          field3: 'カスタムフィールド3',
        },
      };

      const template = await prisma.documentTemplate.create({
        data: {
          name: '複雑テンプレート',
          filePath: '/templates/complex.docx',
          placeholders: complexPlaceholders,
        },
      });

      expect(template.placeholders).toEqual(complexPlaceholders);
    });

    it('should create multiple document templates', async () => {
      const templates = [
        {
          name: '準備書面テンプレート',
          filePath: '/templates/preparation.docx',
          placeholders: { caseName: '案件名' },
        },
        {
          name: '答弁書テンプレート',
          filePath: '/templates/answer.docx',
          placeholders: { defendantName: '被告名' },
        },
        {
          name: '上訴状テンプレート',
          filePath: '/templates/appeal.docx',
          placeholders: { appealReason: '上訴理由' },
        },
        {
          name: '和解書テンプレート',
          filePath: '/templates/settlement.docx',
          placeholders: { settlementAmount: '和解金額' },
        },
      ];

      for (const templateData of templates) {
        const template = await prisma.documentTemplate.create({
          data: templateData,
        });

        expect(template.name).toBe(templateData.name);
        expect(template.filePath).toBe(templateData.filePath);
        expect(template.placeholders).toEqual(templateData.placeholders);
      }
    });

    it('should create template with different file paths', async () => {
      const filePaths = [
        '/templates/doc1.docx',
        '/templates/subfolder/doc2.docx',
        '/templates/2024/doc3.docx',
        '/shared/templates/doc4.docx',
        'C:\\Documents\\Templates\\doc5.docx',
      ];

      for (const filePath of filePaths) {
        const template = await prisma.documentTemplate.create({
          data: {
            name: `テンプレート${filePath.split('/').pop()}`,
            filePath: filePath,
            placeholders: { test: 'テスト' },
          },
        });

        expect(template.filePath).toBe(filePath);
      }
    });
  });

  describe('Read DocumentTemplate', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.documentTemplate.create({
        data: {
          name: '読取テストテンプレート',
          filePath: '/templates/read_test.docx',
          placeholders: {
            caseName: '案件名',
            clientName: '依頼人名',
            lawyerName: '弁護士名',
          },
        },
      });
      templateId = template.id;
    });

    it('should find document template by id', async () => {
      const foundTemplate = await prisma.documentTemplate.findUnique({
        where: { id: templateId },
      });

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate?.id).toBe(templateId);
      expect(foundTemplate?.name).toBe('読取テストテンプレート');
    });

    it('should find all document templates', async () => {
      const templates = await prisma.documentTemplate.findMany();

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('読取テストテンプレート');
    });

    it('should find document template by name', async () => {
      const foundTemplate = await prisma.documentTemplate.findFirst({
        where: { name: '読取テストテンプレート' },
      });

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate?.name).toBe('読取テストテンプレート');
    });

    it('should find document template by file path', async () => {
      const foundTemplate = await prisma.documentTemplate.findFirst({
        where: { filePath: '/templates/read_test.docx' },
      });

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate?.filePath).toBe('/templates/read_test.docx');
    });

    it('should find templates by name pattern', async () => {
      const templates = await prisma.documentTemplate.findMany({
        where: {
          name: {
            contains: '読取テスト',
          },
        },
      });

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('読取テストテンプレート');
    });

    it('should find templates by file path pattern', async () => {
      const templates = await prisma.documentTemplate.findMany({
        where: {
          filePath: {
            contains: '/templates/',
          },
        },
      });

      expect(templates).toHaveLength(1);
      expect(templates[0].filePath).toBe('/templates/read_test.docx');
    });

    it('should return null for non-existent template', async () => {
      const foundTemplate = await prisma.documentTemplate.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundTemplate).toBeNull();
    });
  });

  describe('Update DocumentTemplate', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.documentTemplate.create({
        data: {
          name: '更新前テンプレート',
          filePath: '/templates/before.docx',
          placeholders: {
            oldField: '古いフィールド',
          },
        },
      });
      templateId = template.id;
    });

    it('should update document template name', async () => {
      const updatedTemplate = await prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          name: '更新後テンプレート',
        },
      });

      expect(updatedTemplate.name).toBe('更新後テンプレート');
    });

    it('should update document template file path', async () => {
      const updatedTemplate = await prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          filePath: '/templates/after.docx',
        },
      });

      expect(updatedTemplate.filePath).toBe('/templates/after.docx');
    });

    it('should update document template placeholders', async () => {
      const newPlaceholders = {
        newField: '新しいフィールド',
        anotherField: '別のフィールド',
        complexField: {
          subField1: 'サブフィールド1',
          subField2: 'サブフィールド2',
        },
      };

      const updatedTemplate = await prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          placeholders: newPlaceholders,
        },
      });

      expect(updatedTemplate.placeholders).toEqual(newPlaceholders);
    });

    it('should update multiple fields', async () => {
      const updatedTemplate = await prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          name: '複数更新テンプレート',
          filePath: '/templates/multiple_update.docx',
          placeholders: {
            updatedField: '更新されたフィールド',
            newField: '新しいフィールド',
          },
        },
      });

      expect(updatedTemplate.name).toBe('複数更新テンプレート');
      expect(updatedTemplate.filePath).toBe('/templates/multiple_update.docx');
      expect(updatedTemplate.placeholders).toEqual({
        updatedField: '更新されたフィールド',
        newField: '新しいフィールド',
      });
    });

    it('should fail to update non-existent template', async () => {
      await expect(
        prisma.documentTemplate.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete DocumentTemplate', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await prisma.documentTemplate.create({
        data: {
          name: '削除テストテンプレート',
          filePath: '/templates/delete_test.docx',
          placeholders: {
            testField: 'テストフィールド',
          },
        },
      });
      templateId = template.id;
    });

    it('should delete document template by id', async () => {
      const deletedTemplate = await prisma.documentTemplate.delete({
        where: { id: templateId },
      });

      expect(deletedTemplate.id).toBe(templateId);
      expect(deletedTemplate.name).toBe('削除テストテンプレート');

      const foundTemplate = await prisma.documentTemplate.findUnique({
        where: { id: templateId },
      });
      expect(foundTemplate).toBeNull();
    });

    it('should fail to delete non-existent template', async () => {
      await expect(
        prisma.documentTemplate.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('DocumentTemplate Advanced Operations', () => {
    it('should handle templates with special characters in placeholders', async () => {
      const specialPlaceholders = {
        'field-with-dash': 'ハイフン付きフィールド',
        'field_with_underscore': 'アンダースコア付きフィールド',
        'field.with.dots': 'ドット付きフィールド',
        'field with spaces': 'スペース付きフィールド',
        'field123': '数字付きフィールド',
        '日本語フィールド': '日本語フィールド',
        'field@#$%': '特殊文字フィールド',
      };

      const template = await prisma.documentTemplate.create({
        data: {
          name: '特殊文字テンプレート',
          filePath: '/templates/special.docx',
          placeholders: specialPlaceholders,
        },
      });

      expect(template.placeholders).toEqual(specialPlaceholders);
    });

    it('should handle templates with array placeholders', async () => {
      const arrayPlaceholders = {
        items: [
          { name: '項目1', value: '値1' },
          { name: '項目2', value: '値2' },
          { name: '項目3', value: '値3' },
        ],
        tags: ['タグ1', 'タグ2', 'タグ3'],
        numbers: [1, 2, 3, 4, 5],
      };

      const template = await prisma.documentTemplate.create({
        data: {
          name: '配列テンプレート',
          filePath: '/templates/array.docx',
          placeholders: arrayPlaceholders,
        },
      });

      expect(template.placeholders).toEqual(arrayPlaceholders);
    });

    it('should handle templates with nested object placeholders', async () => {
      const nestedPlaceholders = {
        case: {
          basic: {
            name: '案件名',
            number: '事件番号',
          },
          details: {
            description: '事件の詳細',
            status: '現在の状況',
          },
        },
        parties: {
          plaintiff: {
            name: '原告名',
            address: '原告住所',
          },
          defendant: {
            name: '被告名',
            address: '被告住所',
          },
        },
        court: {
          basic: {
            name: '裁判所名',
            division: '部',
          },
          personnel: {
            judge: '裁判官名',
            clerk: '書記官名',
          },
        },
      };

      const template = await prisma.documentTemplate.create({
        data: {
          name: 'ネストテンプレート',
          filePath: '/templates/nested.docx',
          placeholders: nestedPlaceholders,
        },
      });

      expect(template.placeholders).toEqual(nestedPlaceholders);
    });

    it('should handle templates with null and undefined values in placeholders', async () => {
      const mixedPlaceholders = {
        stringField: '文字列フィールド',
        nullField: null,
        undefinedField: undefined,
        emptyString: '',
        zeroValue: 0,
        falseValue: false,
        trueValue: true,
      };

      const template = await prisma.documentTemplate.create({
        data: {
          name: '混合値テンプレート',
          filePath: '/templates/mixed.docx',
          placeholders: mixedPlaceholders,
        },
      });

      expect(template.placeholders).toEqual(mixedPlaceholders);
    });
  });
});
