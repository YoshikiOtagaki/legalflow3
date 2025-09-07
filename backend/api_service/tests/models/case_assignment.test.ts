import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('CaseAssignment Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create CaseAssignment', () => {
    let userId: string;
    let caseId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'テストユーザー',
        },
      });
      userId = user.id;

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

    it('should create a new case assignment with required fields', async () => {
      const assignmentData = {
        userId: userId,
        caseId: caseId,
        role: 'Lead' as const,
      };

      const assignment = await prisma.caseAssignment.create({
        data: assignmentData,
      });

      expect(assignment).toBeDefined();
      expect(assignment.userId).toBe(userId);
      expect(assignment.caseId).toBe(caseId);
      expect(assignment.role).toBe(assignmentData.role);
    });

    it('should create a case assignment with default role', async () => {
      const assignment = await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
        },
      });

      expect(assignment).toBeDefined();
      expect(assignment.userId).toBe(userId);
      expect(assignment.caseId).toBe(caseId);
      expect(assignment.role).toBe('Collaborator');
    });

    it('should create a case assignment with different roles', async () => {
      const user2 = await prisma.user.create({
        data: {
          email: 'test3@example.com',
          name: 'テストユーザー3',
        },
      });

      const assignment1 = await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
          role: 'Lead' as const,
        },
      });

      const assignment2 = await prisma.caseAssignment.create({
        data: {
          userId: user2.id,
          caseId: caseId,
          role: 'Collaborator' as const,
        },
      });

      expect(assignment1.role).toBe('Lead');
      expect(assignment2.role).toBe('Collaborator');
    });

    it('should create multiple assignments for same case', async () => {
      const user2 = await prisma.user.create({
        data: {
          email: 'test2@example.com',
          name: 'テストユーザー2',
        },
      });

      const assignment1 = await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
          role: 'Lead' as const,
        },
      });

      const assignment2 = await prisma.caseAssignment.create({
        data: {
          userId: user2.id,
          caseId: caseId,
          role: 'Collaborator' as const,
        },
      });

      expect(assignment1.userId).toBe(userId);
      expect(assignment2.userId).toBe(user2.id);
      expect(assignment1.caseId).toBe(caseId);
      expect(assignment2.caseId).toBe(caseId);
      expect(assignment1.role).toBe('Lead');
      expect(assignment2.role).toBe('Collaborator');
    });

    it('should fail to create assignment without user', async () => {
      await expect(
        prisma.caseAssignment.create({
          data: {
            userId: 'non-existent-user-id',
            caseId: caseId,
            role: 'Lead' as const,
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create assignment without case', async () => {
      await expect(
        prisma.caseAssignment.create({
          data: {
            userId: userId,
            caseId: 'non-existent-case-id',
            role: 'Lead' as const,
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create duplicate assignment', async () => {
      await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
          role: 'Lead' as const,
        },
      });

      await expect(
        prisma.caseAssignment.create({
          data: {
            userId: userId,
            caseId: caseId,
            role: 'Collaborator' as const,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CaseAssignment', () => {
    let userId: string;
    let caseId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'read@example.com',
          name: '読取テストユーザー',
        },
      });
      userId = user.id;

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
      caseId = case_.id;

      await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
          role: 'Lead' as const,
        },
      });
    });

    it('should find case assignment by composite key', async () => {
      const foundAssignment = await prisma.caseAssignment.findUnique({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
      });

      expect(foundAssignment).toBeDefined();
      expect(foundAssignment?.userId).toBe(userId);
      expect(foundAssignment?.caseId).toBe(caseId);
      expect(foundAssignment?.role).toBe('Lead');
    });

    it('should find case assignment with user relation', async () => {
      const foundAssignment = await prisma.caseAssignment.findUnique({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
        include: {
          user: true,
        },
      });

      expect(foundAssignment?.user).toBeDefined();
      expect(foundAssignment?.user.name).toBe('読取テストユーザー');
      expect(foundAssignment?.user.email).toBe('read@example.com');
    });

    it('should find case assignment with case relation', async () => {
      const foundAssignment = await prisma.caseAssignment.findUnique({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
        include: {
          case: true,
        },
      });

      expect(foundAssignment?.case).toBeDefined();
      expect(foundAssignment?.case.name).toBe('読取テスト事件');
    });

    it('should find case assignment with all relations', async () => {
      const foundAssignment = await prisma.caseAssignment.findUnique({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
        include: {
          user: true,
          case: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(foundAssignment?.user).toBeDefined();
      expect(foundAssignment?.case).toBeDefined();
      expect(foundAssignment?.case.category).toBeDefined();
      expect(foundAssignment?.user.name).toBe('読取テストユーザー');
      expect(foundAssignment?.case.name).toBe('読取テスト事件');
      expect(foundAssignment?.case.category.name).toBe('読取テストカテゴリ');
    });

    it('should find all case assignments', async () => {
      const assignments = await prisma.caseAssignment.findMany();

      expect(assignments).toHaveLength(1);
      expect(assignments[0].role).toBe('Lead');
    });

    it('should find case assignments by role', async () => {
      const leadAssignments = await prisma.caseAssignment.findMany({
        where: { role: 'Lead' },
      });

      const collaboratorAssignments = await prisma.caseAssignment.findMany({
        where: { role: 'Collaborator' },
      });

      expect(leadAssignments).toHaveLength(1);
      expect(collaboratorAssignments).toHaveLength(0);
    });

    it('should find case assignments by user', async () => {
      const userAssignments = await prisma.caseAssignment.findMany({
        where: {
          user: {
            email: 'read@example.com',
          },
        },
      });

      expect(userAssignments).toHaveLength(1);
      expect(userAssignments[0].role).toBe('Lead');
    });

    it('should find case assignments by case', async () => {
      const caseAssignments = await prisma.caseAssignment.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(caseAssignments).toHaveLength(1);
      expect(caseAssignments[0].role).toBe('Lead');
    });

    it('should return null for non-existent assignment', async () => {
      const foundAssignment = await prisma.caseAssignment.findUnique({
        where: {
          caseId_userId: {
            caseId: 'non-existent-case-id',
            userId: 'non-existent-user-id',
          },
        },
      });

      expect(foundAssignment).toBeNull();
    });
  });

  describe('Update CaseAssignment', () => {
    let userId: string;
    let caseId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          name: '更新テストユーザー',
        },
      });
      userId = user.id;

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
      caseId = case_.id;

      await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
          role: 'Collaborator' as const,
        },
      });
    });

    it('should update assignment role', async () => {
      const updatedAssignment = await prisma.caseAssignment.update({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
        data: {
          role: 'Lead' as const,
        },
      });

      expect(updatedAssignment.role).toBe('Lead');
    });

    it('should fail to update non-existent assignment', async () => {
      await expect(
        prisma.caseAssignment.update({
          where: {
            caseId_userId: {
              caseId: 'non-existent-case-id',
              userId: 'non-existent-user-id',
            },
          },
          data: { role: 'Lead' as const },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CaseAssignment', () => {
    let userId: string;
    let caseId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          name: '削除テストユーザー',
        },
      });
      userId = user.id;

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
      caseId = case_.id;

      await prisma.caseAssignment.create({
        data: {
          userId: userId,
          caseId: caseId,
          role: 'Lead' as const,
        },
      });
    });

    it('should delete case assignment by composite key', async () => {
      const deletedAssignment = await prisma.caseAssignment.delete({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
      });

      expect(deletedAssignment.userId).toBe(userId);
      expect(deletedAssignment.caseId).toBe(caseId);
      expect(deletedAssignment.role).toBe('Lead');

      const foundAssignment = await prisma.caseAssignment.findUnique({
        where: {
          caseId_userId: {
            caseId: caseId,
            userId: userId,
          },
        },
      });
      expect(foundAssignment).toBeNull();
    });

    it('should fail to delete non-existent assignment', async () => {
      await expect(
        prisma.caseAssignment.delete({
          where: {
            caseId_userId: {
              caseId: 'non-existent-case-id',
              userId: 'non-existent-user-id',
            },
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('CaseAssignment Relations', () => {
    it('should find user with case assignments', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'relation@example.com',
          name: '関係テストユーザー',
        },
      });

      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case1 = await prisma.case.create({
        data: {
          name: '案件1',
          categoryId: category.id,
        },
      });

      const case2 = await prisma.case.create({
        data: {
          name: '案件2',
          categoryId: category.id,
        },
      });

      await prisma.caseAssignment.createMany({
        data: [
          {
            userId: user.id,
            caseId: case1.id,
            role: 'Lead' as const,
          },
          {
            userId: user.id,
            caseId: case2.id,
            role: 'Collaborator' as const,
          },
        ],
      });

      const userWithAssignments = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          caseAssignments: {
            include: {
              case: true,
            },
          },
        },
      });

      expect(userWithAssignments?.caseAssignments).toHaveLength(2);
      expect(userWithAssignments?.caseAssignments[0].case.name).toBe('案件1');
      expect(userWithAssignments?.caseAssignments[1].case.name).toBe('案件2');
    });

    it('should find case with assignments', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '案件割り当て一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '案件割り当て一覧テスト事件',
          categoryId: category.id,
        },
      });

      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          name: 'ユーザー1',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          name: 'ユーザー2',
        },
      });

      await prisma.caseAssignment.createMany({
        data: [
          {
            userId: user1.id,
            caseId: case_.id,
            role: 'Lead' as const,
          },
          {
            userId: user2.id,
            caseId: case_.id,
            role: 'Collaborator' as const,
          },
        ],
      });

      const caseWithAssignments = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          assignments: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(caseWithAssignments?.assignments).toHaveLength(2);
      expect(caseWithAssignments?.assignments[0].user.name).toBe('ユーザー1');
      expect(caseWithAssignments?.assignments[1].user.name).toBe('ユーザー2');
    });
  });
});
