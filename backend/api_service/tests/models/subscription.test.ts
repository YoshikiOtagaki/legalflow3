import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Subscription Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Subscription', () => {
    it('should create a new subscription with required fields', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const subscriptionData = {
        userId: user.id,
        plan: 'Free' as const,
        status: 'active',
        caseCount: 0,
      };

      const subscription = await prisma.subscription.create({
        data: subscriptionData,
      });

      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.userId).toBe(user.id);
      expect(subscription.plan).toBe(subscriptionData.plan);
      expect(subscription.status).toBe(subscriptionData.status);
      expect(subscription.caseCount).toBe(subscriptionData.caseCount);
    });

    it('should create a subscription with default values', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test2@example.com',
          name: 'Test User 2',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'active',
        },
      });

      expect(subscription.plan).toBe('Free');
      expect(subscription.caseCount).toBe(0);
    });

    it('should create a lawyer plan subscription', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'lawyer@example.com',
          name: 'Lawyer User',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Lawyer',
          status: 'active',
          caseCount: 5,
        },
      });

      expect(subscription.plan).toBe('Lawyer');
      expect(subscription.caseCount).toBe(5);
    });

    it('should create a paralegal plan subscription', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'paralegal@example.com',
          name: 'Paralegal User',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Paralegal',
          status: 'active',
          caseCount: 3,
        },
      });

      expect(subscription.plan).toBe('Paralegal');
      expect(subscription.caseCount).toBe(3);
    });

    it('should fail to create subscription without user', async () => {
      await expect(
        prisma.subscription.create({
          data: {
            userId: 'non-existent-user-id',
            plan: 'Free',
            status: 'active',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create duplicate subscription for same user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          name: 'Duplicate User',
        },
      });

      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Free',
          status: 'active',
        },
      });

      await expect(
        prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'Lawyer',
            status: 'active',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Subscription', () => {
    let userId: string;
    let subscriptionId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'read-test@example.com',
          name: 'Read Test User',
        },
      });
      userId = user.id;

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Lawyer',
          status: 'active',
          caseCount: 10,
        },
      });
      subscriptionId = subscription.id;
    });

    it('should find subscription by id', async () => {
      const foundSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      expect(foundSubscription).toBeDefined();
      expect(foundSubscription?.id).toBe(subscriptionId);
      expect(foundSubscription?.plan).toBe('Lawyer');
      expect(foundSubscription?.caseCount).toBe(10);
    });

    it('should find subscription by user id', async () => {
      const foundSubscription = await prisma.subscription.findUnique({
        where: { userId: userId },
      });

      expect(foundSubscription).toBeDefined();
      expect(foundSubscription?.userId).toBe(userId);
      expect(foundSubscription?.plan).toBe('Lawyer');
    });

    it('should find all subscriptions', async () => {
      const subscriptions = await prisma.subscription.findMany();

      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].plan).toBe('Lawyer');
    });

    it('should find subscriptions by plan', async () => {
      const lawyerSubscriptions = await prisma.subscription.findMany({
        where: { plan: 'Lawyer' },
      });

      const freeSubscriptions = await prisma.subscription.findMany({
        where: { plan: 'Free' },
      });

      expect(lawyerSubscriptions).toHaveLength(1);
      expect(freeSubscriptions).toHaveLength(0);
      expect(lawyerSubscriptions[0].plan).toBe('Lawyer');
    });

    it('should find subscriptions by status', async () => {
      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'active' },
      });

      const inactiveSubscriptions = await prisma.subscription.findMany({
        where: { status: 'inactive' },
      });

      expect(activeSubscriptions).toHaveLength(1);
      expect(inactiveSubscriptions).toHaveLength(0);
      expect(activeSubscriptions[0].status).toBe('active');
    });

    it('should return null for non-existent subscription', async () => {
      const foundSubscription = await prisma.subscription.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundSubscription).toBeNull();
    });
  });

  describe('Update Subscription', () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update-test@example.com',
          name: 'Update Test User',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Free',
          status: 'active',
          caseCount: 0,
        },
      });
      subscriptionId = subscription.id;
    });

    it('should update subscription plan', async () => {
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { plan: 'Lawyer' },
      });

      expect(updatedSubscription.plan).toBe('Lawyer');
      expect(updatedSubscription.status).toBe('active');
      expect(updatedSubscription.caseCount).toBe(0);
    });

    it('should update subscription status', async () => {
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'inactive' },
      });

      expect(updatedSubscription.status).toBe('inactive');
      expect(updatedSubscription.plan).toBe('Free');
    });

    it('should update case count', async () => {
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { caseCount: 5 },
      });

      expect(updatedSubscription.caseCount).toBe(5);
      expect(updatedSubscription.plan).toBe('Free');
    });

    it('should update multiple fields', async () => {
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          plan: 'Paralegal',
          status: 'inactive',
          caseCount: 3,
        },
      });

      expect(updatedSubscription.plan).toBe('Paralegal');
      expect(updatedSubscription.status).toBe('inactive');
      expect(updatedSubscription.caseCount).toBe(3);
    });

    it('should fail to update non-existent subscription', async () => {
      await expect(
        prisma.subscription.update({
          where: { id: 'non-existent-id' },
          data: { plan: 'Lawyer' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Subscription', () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete-test@example.com',
          name: 'Delete Test User',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Free',
          status: 'active',
          caseCount: 0,
        },
      });
      subscriptionId = subscription.id;
    });

    it('should delete subscription by id', async () => {
      const deletedSubscription = await prisma.subscription.delete({
        where: { id: subscriptionId },
      });

      expect(deletedSubscription.id).toBe(subscriptionId);
      expect(deletedSubscription.plan).toBe('Free');

      const foundSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });
      expect(foundSubscription).toBeNull();
    });

    it('should fail to delete non-existent subscription', async () => {
      await expect(
        prisma.subscription.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Subscription Relations', () => {
    it('should create subscription with user relation', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'relation-test@example.com',
          name: 'Relation Test User',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'Lawyer',
          status: 'active',
          caseCount: 5,
        },
        include: {
          user: true,
        },
      });

      expect(subscription.user).toBeDefined();
      expect(subscription.user.id).toBe(user.id);
      expect(subscription.user.email).toBe('relation-test@example.com');
    });

    it('should find user with subscription relation', async () => {
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
    });
  });
});
