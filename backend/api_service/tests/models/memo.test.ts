import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Memo Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Memo', () => {
    let caseId: string;

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
      caseId = case_.id;
    });

    it('should create a new memo with required fields', async () => {
      const memoData = {
        caseId: caseId,
        content: 'これはテストメモです。重要な情報を記録します。',
        authorId: 'test-author-id',
      };

      const memo = await prisma.memo.create({
        data: memoData,
      });

      expect(memo).toBeDefined();
      expect(memo.id).toBeDefined();
      expect(memo.caseId).toBe(caseId);
      expect(memo.content).toBe(memoData.content);
      expect(memo.authorId).toBe(memoData.authorId);
      expect(memo.createdAt).toBeDefined();
    });

    it('should create a memo with long content', async () => {
      const longContent = 'これは非常に長いメモの内容です。'.repeat(100);

      const memo = await prisma.memo.create({
        data: {
          caseId: caseId,
          content: longContent,
          authorId: 'test-author-id',
        },
      });

      expect(memo.content).toBe(longContent);
    });

    it('should create multiple memos for same case', async () => {
      const memos = [
        { content: 'メモ1: 初期調査結果', authorId: 'author1' },
        { content: 'メモ2: 証拠収集状況', authorId: 'author2' },
        { content: 'メモ3: 今後の方針', authorId: 'author1' },
      ];

      for (const memoData of memos) {
        const memo = await prisma.memo.create({
          data: {
            caseId: caseId,
            ...memoData,
          },
        });

        expect(memo.content).toBe(memoData.content);
        expect(memo.authorId).toBe(memoData.authorId);
      }
    });

    it('should create memo with different author ids', async () => {
      const authorIds = ['author1', 'author2', 'author3', 'admin', 'lawyer-001'];

      for (const authorId of authorIds) {
        const memo = await prisma.memo.create({
          data: {
            caseId: caseId,
            content: `${authorId}によるメモ`,
            authorId: authorId,
          },
        });

        expect(memo.authorId).toBe(authorId);
      }
    });

    it('should fail to create memo without case', async () => {
      await expect(
        prisma.memo.create({
          data: {
            caseId: 'non-existent-case-id',
            content: 'テストメモ',
            authorId: 'test-author',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Memo', () => {
    let memoId: string;

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

      const memo = await prisma.memo.create({
        data: {
          caseId: case_.id,
          content: '読取テストメモの内容です。',
          authorId: 'read-test-author',
        },
      });
      memoId = memo.id;
    });

    it('should find memo by id', async () => {
      const foundMemo = await prisma.memo.findUnique({
        where: { id: memoId },
      });

      expect(foundMemo).toBeDefined();
      expect(foundMemo?.id).toBe(memoId);
      expect(foundMemo?.content).toBe('読取テストメモの内容です。');
    });

    it('should find memo with case relation', async () => {
      const foundMemo = await prisma.memo.findUnique({
        where: { id: memoId },
        include: {
          case: true,
        },
      });

      expect(foundMemo?.case).toBeDefined();
      expect(foundMemo?.case.name).toBe('読取テスト事件');
    });

    it('should find all memos', async () => {
      const memos = await prisma.memo.findMany();

      expect(memos).toHaveLength(1);
      expect(memos[0].content).toBe('読取テストメモの内容です。');
    });

    it('should find memos by case', async () => {
      const memos = await prisma.memo.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(memos).toHaveLength(1);
      expect(memos[0].content).toBe('読取テストメモの内容です。');
    });

    it('should find memos by author id', async () => {
      const memos = await prisma.memo.findMany({
        where: {
          authorId: 'read-test-author',
        },
      });

      expect(memos).toHaveLength(1);
      expect(memos[0].content).toBe('読取テストメモの内容です。');
    });

    it('should find memos by content search', async () => {
      const memos = await prisma.memo.findMany({
        where: {
          content: {
            contains: '読取テスト',
          },
        },
      });

      expect(memos).toHaveLength(1);
      expect(memos[0].content).toBe('読取テストメモの内容です。');
    });

    it('should find memos by creation date range', async () => {
      const memos = await prisma.memo.findMany({
        where: {
          createdAt: {
            gte: new Date('2024-01-01T00:00:00Z'),
            lte: new Date('2025-12-31T23:59:59Z'),
          },
        },
      });

      expect(memos).toHaveLength(1);
      expect(memos[0].content).toBe('読取テストメモの内容です。');
    });

    it('should find memos ordered by creation date', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '順序テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '順序テスト事件',
          categoryId: category.id,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const memo2 = await prisma.memo.create({
        data: {
          caseId: case_.id,
          content: '2番目のメモ',
          authorId: 'author2',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const memo3 = await prisma.memo.create({
        data: {
          caseId: case_.id,
          content: '3番目のメモ',
          authorId: 'author3',
        },
      });

      const memos = await prisma.memo.findMany({
        where: { caseId: case_.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(memos).toHaveLength(3);
      expect(memos[0].content).toBe('1番目のメモ');
      expect(memos[1].content).toBe('2番目のメモ');
      expect(memos[2].content).toBe('3番目のメモ');
    });

    it('should return null for non-existent memo', async () => {
      const foundMemo = await prisma.memo.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundMemo).toBeNull();
    });
  });

  describe('Update Memo', () => {
    let memoId: string;

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

      const memo = await prisma.memo.create({
        data: {
          caseId: case_.id,
          content: '更新前メモの内容',
          authorId: 'update-test-author',
        },
      });
      memoId = memo.id;
    });

    it('should update memo content', async () => {
      const updatedMemo = await prisma.memo.update({
        where: { id: memoId },
        data: {
          content: '更新後メモの内容',
        },
      });

      expect(updatedMemo.content).toBe('更新後メモの内容');
    });

    it('should update memo author id', async () => {
      const updatedMemo = await prisma.memo.update({
        where: { id: memoId },
        data: {
          authorId: 'new-author-id',
        },
      });

      expect(updatedMemo.authorId).toBe('new-author-id');
    });

    it('should update multiple fields', async () => {
      const updatedMemo = await prisma.memo.update({
        where: { id: memoId },
        data: {
          content: '複数更新メモの内容',
          authorId: 'updated-author-id',
        },
      });

      expect(updatedMemo.content).toBe('複数更新メモの内容');
      expect(updatedMemo.authorId).toBe('updated-author-id');
    });

    it('should fail to update non-existent memo', async () => {
      await expect(
        prisma.memo.update({
          where: { id: 'non-existent-id' },
          data: { content: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Memo', () => {
    let memoId: string;

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

      const memo = await prisma.memo.create({
        data: {
          caseId: case_.id,
          content: '削除テストメモの内容',
          authorId: 'delete-test-author',
        },
      });
      memoId = memo.id;
    });

    it('should delete memo by id', async () => {
      const deletedMemo = await prisma.memo.delete({
        where: { id: memoId },
      });

      expect(deletedMemo.id).toBe(memoId);
      expect(deletedMemo.content).toBe('削除テストメモの内容');

      const foundMemo = await prisma.memo.findUnique({
        where: { id: memoId },
      });
      expect(foundMemo).toBeNull();
    });

    it('should fail to delete non-existent memo', async () => {
      await expect(
        prisma.memo.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Memo Relations', () => {
    it('should find case with memos', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '案件メモ一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '案件メモ一覧テスト事件',
          categoryId: category.id,
        },
      });

      await prisma.memo.createMany({
        data: [
          {
            caseId: case_.id,
            content: 'メモ1: 初期調査',
            authorId: 'author1',
          },
          {
            caseId: case_.id,
            content: 'メモ2: 証拠収集',
            authorId: 'author2',
          },
          {
            caseId: case_.id,
            content: 'メモ3: 今後の方針',
            authorId: 'author1',
          },
        ],
      });

      const caseWithMemos = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          memos: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      expect(caseWithMemos?.memos).toHaveLength(3);
      expect(caseWithMemos?.memos[0].content).toBe('メモ1: 初期調査');
      expect(caseWithMemos?.memos[1].content).toBe('メモ2: 証拠収集');
      expect(caseWithMemos?.memos[2].content).toBe('メモ3: 今後の方針');
    });

    it('should find memos by author with case information', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '著者メモ一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '著者メモ一覧テスト事件',
          categoryId: category.id,
        },
      });

      await prisma.memo.createMany({
        data: [
          {
            caseId: case_.id,
            content: '著者Aのメモ1',
            authorId: 'author-a',
          },
          {
            caseId: case_.id,
            content: '著者Aのメモ2',
            authorId: 'author-a',
          },
          {
            caseId: case_.id,
            content: '著者Bのメモ1',
            authorId: 'author-b',
          },
        ],
      });

      const authorMemos = await prisma.memo.findMany({
        where: {
          authorId: 'author-a',
        },
        include: {
          case: true,
        },
      });

      expect(authorMemos).toHaveLength(2);
      expect(authorMemos[0].content).toBe('著者Aのメモ1');
      expect(authorMemos[1].content).toBe('著者Aのメモ2');
      expect(authorMemos[0].case.name).toBe('著者メモ一覧テスト事件');
    });
  });
});
