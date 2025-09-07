import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('User Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create User', () => {
    it('should create a new user with required fields', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'Lawyer' as const,
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should create a user with default role when not specified', async () => {
      const userData = {
        email: 'test2@example.com',
        name: 'Test User 2',
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user.role).toBe('Lawyer');
    });

    it('should create a paralegal user', async () => {
      const userData = {
        email: 'paralegal@example.com',
        name: 'Paralegal User',
        role: 'Paralegal' as const,
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user.role).toBe('Paralegal');
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'First User',
      };

      await prisma.user.create({
        data: userData,
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            name: 'Second User',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create user with invalid email format', async () => {
      await expect(
        prisma.user.create({
          data: {
            name: 'Invalid Email User',
            email: 'invalid-email-format',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read User', () => {
    beforeEach(async () => {
      await prisma.user.createMany({
        data: [
          {
            email: 'user1@example.com',
            name: 'User 1',
            role: 'Lawyer',
          },
          {
            email: 'user2@example.com',
            name: 'User 2',
            role: 'Paralegal',
          },
        ],
      });
    });

    it('should find user by id', async () => {
      const users = await prisma.user.findMany();
      const firstUser = users[0];

      const foundUser = await prisma.user.findUnique({
        where: { id: firstUser.id },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(firstUser.id);
      expect(foundUser?.email).toBe(firstUser.email);
    });

    it('should find user by email', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: 'user1@example.com' },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('user1@example.com');
      expect(foundUser?.name).toBe('User 1');
    });

    it('should find all users', async () => {
      const users = await prisma.user.findMany();

      expect(users).toHaveLength(2);
      expect(users[0].email).toBeDefined();
      expect(users[1].email).toBeDefined();
    });

    it('should find users by role', async () => {
      const lawyers = await prisma.user.findMany({
        where: { role: 'Lawyer' },
      });

      const paralegals = await prisma.user.findMany({
        where: { role: 'Paralegal' },
      });

      expect(lawyers).toHaveLength(1);
      expect(paralegals).toHaveLength(1);
      expect(lawyers[0].role).toBe('Lawyer');
      expect(paralegals[0].role).toBe('Paralegal');
    });

    it('should return null for non-existent user', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundUser).toBeNull();
    });
  });

  describe('Update User', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          name: 'Original Name',
          role: 'Lawyer',
        },
      });
      userId = user.id;
    });

    it('should update user name', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name: 'Updated Name' },
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('update@example.com');
      expect(updatedUser.role).toBe('Lawyer');
    });

    it('should update user role', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: 'Paralegal' },
      });

      expect(updatedUser.role).toBe('Paralegal');
      expect(updatedUser.name).toBe('Original Name');
    });

    it('should update multiple fields', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Updated Name',
          role: 'Paralegal',
        },
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.role).toBe('Paralegal');
      expect(updatedUser.email).toBe('update@example.com');
    });

    it('should fail to update non-existent user', async () => {
      await expect(
        prisma.user.update({
          where: { id: 'non-existent-id' },
          data: { name: 'Updated Name' },
        })
      ).rejects.toThrow();
    });

    it('should fail to update email to existing email', async () => {
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          name: 'Existing User',
        },
      });

      await expect(
        prisma.user.update({
          where: { id: userId },
          data: { email: 'existing@example.com' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete User', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          name: 'Delete User',
          role: 'Lawyer',
        },
      });
      userId = user.id;
    });

    it('should delete user by id', async () => {
      const deletedUser = await prisma.user.delete({
        where: { id: userId },
      });

      expect(deletedUser.id).toBe(userId);
      expect(deletedUser.email).toBe('delete@example.com');

      const foundUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(foundUser).toBeNull();
    });

    it('should fail to delete non-existent user', async () => {
      await expect(
        prisma.user.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('User Relations', () => {
    it('should create user with subscription relation', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user-with-sub@example.com',
          name: 'User with Subscription',
          subscription: {
            create: {
              plan: 'Free',
              status: 'active',
              caseCount: 0,
            },
          },
        },
        include: {
          subscription: true,
        },
      });

      expect(user.subscription).toBeDefined();
      expect(user.subscription?.plan).toBe('Free');
      expect(user.subscription?.status).toBe('active');
      expect(user.subscription?.caseCount).toBe(0);
    });

    it('should create user with case assignments', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'Test Category',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'Test Case',
          categoryId: category.id,
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'user-with-cases@example.com',
          name: 'User with Cases',
          caseAssignments: {
            create: {
              caseId: case_.id,
              role: 'Lead',
            },
          },
        },
        include: {
          caseAssignments: true,
        },
      });

      expect(user.caseAssignments).toHaveLength(1);
      expect(user.caseAssignments[0].role).toBe('Lead');

      await prisma.caseAssignment.deleteMany();
      await prisma.case.deleteMany();
      await prisma.caseCategory.deleteMany();
    });
  });
});
