import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('TimesheetEntry Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create TimesheetEntry', () => {
    let caseId: string;
    let userId: string;

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

      const user = await prisma.user.create({
        data: {
          email: 'timesheet@example.com',
          name: 'タイムシートユーザー',
        },
      });

      caseId = case_.id;
      userId = user.id;
    });

    it('should create a new timesheet entry with required fields', async () => {
      const entryData = {
        caseId: caseId,
        userId: userId,
        startTime: new Date('2024-12-15T09:00:00Z'),
        endTime: new Date('2024-12-15T17:00:00Z'),
        description: '準備書面作成',
      };

      const entry = await prisma.timesheetEntry.create({
        data: entryData,
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.caseId).toBe(caseId);
      expect(entry.userId).toBe(userId);
      expect(entry.startTime).toEqual(entryData.startTime);
      expect(entry.endTime).toEqual(entryData.endTime);
      expect(entry.description).toBe(entryData.description);
    });

    it('should create a timesheet entry with minimal required fields', async () => {
      const entry = await prisma.timesheetEntry.create({
        data: {
          caseId: caseId,
          userId: userId,
          startTime: new Date('2024-12-15T10:00:00Z'),
          endTime: new Date('2024-12-15T12:00:00Z'),
        },
      });

      expect(entry).toBeDefined();
      expect(entry.caseId).toBe(caseId);
      expect(entry.userId).toBe(userId);
      expect(entry.description).toBeNull();
    });

    it('should create multiple timesheet entries for same case and user', async () => {
      const entries = [
        {
          startTime: new Date('2024-12-15T09:00:00Z'),
          endTime: new Date('2024-12-15T12:00:00Z'),
          description: '午前の作業',
        },
        {
          startTime: new Date('2024-12-15T13:00:00Z'),
          endTime: new Date('2024-12-15T17:00:00Z'),
          description: '午後の作業',
        },
      ];

      for (const entryData of entries) {
        const entry = await prisma.timesheetEntry.create({
          data: {
            caseId: caseId,
            userId: userId,
            ...entryData,
          },
        });

        expect(entry.description).toBe(entryData.description);
      }
    });

    it('should create timesheet entries with different durations', async () => {
      const durations = [
        { start: '09:00', end: '09:30', desc: '30分作業' },
        { start: '10:00', end: '12:00', desc: '2時間作業' },
        { start: '14:00', end: '18:00', desc: '4時間作業' },
      ];

      for (const duration of durations) {
        const entry = await prisma.timesheetEntry.create({
          data: {
            caseId: caseId,
            userId: userId,
            startTime: new Date(`2024-12-15T${duration.start}:00Z`),
            endTime: new Date(`2024-12-15T${duration.end}:00Z`),
            description: duration.desc,
          },
        });

        expect(entry.description).toBe(duration.desc);
      }
    });

    it('should fail to create entry without case', async () => {
      await expect(
        prisma.timesheetEntry.create({
          data: {
            caseId: 'non-existent-case-id',
            userId: userId,
            startTime: new Date('2024-12-15T09:00:00Z'),
            endTime: new Date('2024-12-15T17:00:00Z'),
          },
        })
      ).rejects.toThrow();
    });

    it('should create entry with non-existent user id (no foreign key constraint)', async () => {
      const entry = await prisma.timesheetEntry.create({
        data: {
          caseId: caseId,
          userId: 'non-existent-user-id',
          startTime: new Date('2024-12-15T09:00:00Z'),
          endTime: new Date('2024-12-15T17:00:00Z'),
        },
      });

      expect(entry).toBeDefined();
      expect(entry.userId).toBe('non-existent-user-id');
    });
  });

  describe('Read TimesheetEntry', () => {
    let entryId: string;

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

      const user = await prisma.user.create({
        data: {
          email: 'read@example.com',
          name: '読取ユーザー',
        },
      });

      const entry = await prisma.timesheetEntry.create({
        data: {
          caseId: case_.id,
          userId: user.id,
          startTime: new Date('2024-12-15T09:00:00Z'),
          endTime: new Date('2024-12-15T17:00:00Z'),
          description: '読取テスト作業',
        },
      });
      entryId = entry.id;
    });

    it('should find timesheet entry by id', async () => {
      const foundEntry = await prisma.timesheetEntry.findUnique({
        where: { id: entryId },
      });

      expect(foundEntry).toBeDefined();
      expect(foundEntry?.id).toBe(entryId);
      expect(foundEntry?.description).toBe('読取テスト作業');
    });

    it('should find timesheet entry with case relation', async () => {
      const foundEntry = await prisma.timesheetEntry.findUnique({
        where: { id: entryId },
        include: {
          case: true,
        },
      });

      expect(foundEntry?.case).toBeDefined();
      expect(foundEntry?.case.name).toBe('読取テスト事件');
    });

    it('should find timesheet entry with case relation', async () => {
      const foundEntry = await prisma.timesheetEntry.findUnique({
        where: { id: entryId },
        include: {
          case: true,
        },
      });

      expect(foundEntry?.case).toBeDefined();
      expect(foundEntry?.case.name).toBe('読取テスト事件');
    });

    it('should find all timesheet entries', async () => {
      const entries = await prisma.timesheetEntry.findMany();

      expect(entries).toHaveLength(1);
      expect(entries[0].description).toBe('読取テスト作業');
    });

    it('should find timesheet entries by case', async () => {
      const entries = await prisma.timesheetEntry.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].description).toBe('読取テスト作業');
    });

    it('should find timesheet entries by user id', async () => {
      const entries = await prisma.timesheetEntry.findMany({
        where: {
          userId: 'test-user-id',
        },
      });

      expect(entries).toHaveLength(0);
    });

    it('should find timesheet entries by date range', async () => {
      const entries = await prisma.timesheetEntry.findMany({
        where: {
          startTime: {
            gte: new Date('2024-12-15T00:00:00Z'),
            lte: new Date('2024-12-15T23:59:59Z'),
          },
        },
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].description).toBe('読取テスト作業');
    });

    it('should find timesheet entries by duration', async () => {
      const entries = await prisma.timesheetEntry.findMany({
        where: {
          startTime: {
            gte: new Date('2024-12-15T08:00:00Z'),
          },
          endTime: {
            lte: new Date('2024-12-15T18:00:00Z'),
          },
        },
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].description).toBe('読取テスト作業');
    });

    it('should return null for non-existent entry', async () => {
      const foundEntry = await prisma.timesheetEntry.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundEntry).toBeNull();
    });
  });

  describe('Update TimesheetEntry', () => {
    let entryId: string;

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

      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          name: '更新ユーザー',
        },
      });

      const entry = await prisma.timesheetEntry.create({
        data: {
          caseId: case_.id,
          userId: user.id,
          startTime: new Date('2024-12-15T09:00:00Z'),
          endTime: new Date('2024-12-15T17:00:00Z'),
          description: '更新前作業',
        },
      });
      entryId = entry.id;
    });

    it('should update timesheet entry description', async () => {
      const updatedEntry = await prisma.timesheetEntry.update({
        where: { id: entryId },
        data: {
          description: '更新後作業',
        },
      });

      expect(updatedEntry.description).toBe('更新後作業');
    });

    it('should update timesheet entry start time', async () => {
      const newStartTime = new Date('2024-12-15T08:00:00Z');
      const updatedEntry = await prisma.timesheetEntry.update({
        where: { id: entryId },
        data: {
          startTime: newStartTime,
        },
      });

      expect(updatedEntry.startTime).toEqual(newStartTime);
    });

    it('should update timesheet entry end time', async () => {
      const newEndTime = new Date('2024-12-15T18:00:00Z');
      const updatedEntry = await prisma.timesheetEntry.update({
        where: { id: entryId },
        data: {
          endTime: newEndTime,
        },
      });

      expect(updatedEntry.endTime).toEqual(newEndTime);
    });

    it('should update multiple fields', async () => {
      const newStartTime = new Date('2024-12-15T08:30:00Z');
      const newEndTime = new Date('2024-12-15T16:30:00Z');

      const updatedEntry = await prisma.timesheetEntry.update({
        where: { id: entryId },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          description: '複数更新作業',
        },
      });

      expect(updatedEntry.startTime).toEqual(newStartTime);
      expect(updatedEntry.endTime).toEqual(newEndTime);
      expect(updatedEntry.description).toBe('複数更新作業');
    });

    it('should fail to update non-existent entry', async () => {
      await expect(
        prisma.timesheetEntry.update({
          where: { id: 'non-existent-id' },
          data: { description: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete TimesheetEntry', () => {
    let entryId: string;

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

      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          name: '削除ユーザー',
        },
      });

      const entry = await prisma.timesheetEntry.create({
        data: {
          caseId: case_.id,
          userId: user.id,
          startTime: new Date('2024-12-15T09:00:00Z'),
          endTime: new Date('2024-12-15T17:00:00Z'),
          description: '削除テスト作業',
        },
      });
      entryId = entry.id;
    });

    it('should delete timesheet entry by id', async () => {
      const deletedEntry = await prisma.timesheetEntry.delete({
        where: { id: entryId },
      });

      expect(deletedEntry.id).toBe(entryId);
      expect(deletedEntry.description).toBe('削除テスト作業');

      const foundEntry = await prisma.timesheetEntry.findUnique({
        where: { id: entryId },
      });
      expect(foundEntry).toBeNull();
    });

    it('should fail to delete non-existent entry', async () => {
      await expect(
        prisma.timesheetEntry.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('TimesheetEntry Relations', () => {
    it('should find case with timesheet entries', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '案件タイムシート一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '案件タイムシート一覧テスト事件',
          categoryId: category.id,
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'case@example.com',
          name: '案件ユーザー',
        },
      });

      await prisma.timesheetEntry.createMany({
        data: [
          {
            caseId: case_.id,
            userId: user.id,
            startTime: new Date('2024-12-15T09:00:00Z'),
            endTime: new Date('2024-12-15T12:00:00Z'),
            description: '午前の作業',
          },
          {
            caseId: case_.id,
            userId: user.id,
            startTime: new Date('2024-12-15T13:00:00Z'),
            endTime: new Date('2024-12-15T17:00:00Z'),
            description: '午後の作業',
          },
        ],
      });

      const caseWithEntries = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          timesheetEntries: true,
        },
      });

      expect(caseWithEntries?.timesheetEntries).toHaveLength(2);
      expect(caseWithEntries?.timesheetEntries[0].description).toBe('午前の作業');
      expect(caseWithEntries?.timesheetEntries[1].description).toBe('午後の作業');
    });

    it('should find timesheet entries by user id', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          name: 'ユーザータイムシート一覧',
        },
      });

      const category = await prisma.caseCategory.create({
        data: {
          name: 'ユーザータイムシート一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'ユーザータイムシート一覧テスト事件',
          categoryId: category.id,
        },
      });

      await prisma.timesheetEntry.createMany({
        data: [
          {
            caseId: case_.id,
            userId: user.id,
            startTime: new Date('2024-12-15T09:00:00Z'),
            endTime: new Date('2024-12-15T12:00:00Z'),
            description: 'ユーザー作業1',
          },
          {
            caseId: case_.id,
            userId: user.id,
            startTime: new Date('2024-12-16T09:00:00Z'),
            endTime: new Date('2024-12-16T12:00:00Z'),
            description: 'ユーザー作業2',
          },
        ],
      });

      const userEntries = await prisma.timesheetEntry.findMany({
        where: {
          userId: user.id,
        },
        include: {
          case: true,
        },
      });

      expect(userEntries).toHaveLength(2);
      expect(userEntries[0].description).toBe('ユーザー作業1');
      expect(userEntries[1].description).toBe('ユーザー作業2');
      expect(userEntries[0].case.name).toBe('ユーザータイムシート一覧テスト事件');
    });
  });
});
