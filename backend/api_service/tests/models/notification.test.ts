import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Notification Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Notification', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'notification@example.com',
          name: '通知テストユーザー',
        },
      });
      userId = user.id;
    });

    it('should create a new notification with required fields', async () => {
      const notificationData = {
        userId: userId,
        eventType: 'case_created',
        message: '新しい案件が作成されました',
        isRead: false,
      };

      const notification = await prisma.notification.create({
        data: notificationData,
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(userId);
      expect(notification.eventType).toBe(notificationData.eventType);
      expect(notification.message).toBe(notificationData.message);
      expect(notification.isRead).toBe(notificationData.isRead);
      expect(notification.createdAt).toBeDefined();
    });

    it('should create a notification with default isRead value', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: userId,
          eventType: 'task_assigned',
          message: '新しいタスクが割り当てられました',
        },
      });

      expect(notification).toBeDefined();
      expect(notification.isRead).toBe(false);
    });

    it('should create notifications with different event types', async () => {
      const eventTypes = [
        'case_created',
        'case_updated',
        'case_closed',
        'task_assigned',
        'task_completed',
        'document_uploaded',
        'hearing_scheduled',
        'deadline_approaching',
        'payment_received',
        'system_maintenance',
      ];

      for (const eventType of eventTypes) {
        const notification = await prisma.notification.create({
          data: {
            userId: userId,
            eventType: eventType,
            message: `${eventType}の通知メッセージ`,
          },
        });

        expect(notification.eventType).toBe(eventType);
      }
    });

    it('should create multiple notifications for same user', async () => {
      const notifications = [
        {
          eventType: 'case_created',
          message: '案件1が作成されました',
          isRead: false,
        },
        {
          eventType: 'task_assigned',
          message: 'タスク1が割り当てられました',
          isRead: true,
        },
        {
          eventType: 'deadline_approaching',
          message: '期限が近づいています',
          isRead: false,
        },
      ];

      for (const notificationData of notifications) {
        const notification = await prisma.notification.create({
          data: {
            userId: userId,
            ...notificationData,
          },
        });

        expect(notification.eventType).toBe(notificationData.eventType);
        expect(notification.message).toBe(notificationData.message);
        expect(notification.isRead).toBe(notificationData.isRead);
      }
    });

    it('should create notifications with long messages', async () => {
      const longMessage = 'これは非常に長い通知メッセージです。'.repeat(50);

      const notification = await prisma.notification.create({
        data: {
          userId: userId,
          eventType: 'system_alert',
          message: longMessage,
        },
      });

      expect(notification.message).toBe(longMessage);
    });

    it('should fail to create notification without user', async () => {
      await expect(
        prisma.notification.create({
          data: {
            userId: 'non-existent-user-id',
            eventType: 'test_event',
            message: 'テスト通知',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Notification', () => {
    let notificationId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'read@example.com',
          name: '読取テストユーザー',
        },
      });

      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          eventType: 'case_updated',
          message: '読取テスト通知メッセージ',
          isRead: false,
        },
      });
      notificationId = notification.id;
    });

    it('should find notification by id', async () => {
      const foundNotification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      expect(foundNotification).toBeDefined();
      expect(foundNotification?.id).toBe(notificationId);
      expect(foundNotification?.message).toBe('読取テスト通知メッセージ');
    });

    it('should find notification with user relation', async () => {
      const foundNotification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          user: true,
        },
      });

      expect(foundNotification?.user).toBeDefined();
      expect(foundNotification?.user.name).toBe('読取テストユーザー');
    });

    it('should find all notifications', async () => {
      const notifications = await prisma.notification.findMany();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('読取テスト通知メッセージ');
    });

    it('should find notifications by user', async () => {
      const notifications = await prisma.notification.findMany({
        where: {
          user: {
            name: '読取テストユーザー',
          },
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('読取テスト通知メッセージ');
    });

    it('should find notifications by event type', async () => {
      const notifications = await prisma.notification.findMany({
        where: {
          eventType: 'case_updated',
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('読取テスト通知メッセージ');
    });

    it('should find notifications by read status', async () => {
      const unreadNotifications = await prisma.notification.findMany({
        where: { isRead: false },
      });

      const readNotifications = await prisma.notification.findMany({
        where: { isRead: true },
      });

      expect(unreadNotifications).toHaveLength(1);
      expect(readNotifications).toHaveLength(0);
    });

    it('should find notifications by message content', async () => {
      const notifications = await prisma.notification.findMany({
        where: {
          message: {
            contains: '読取テスト',
          },
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('読取テスト通知メッセージ');
    });

    it('should find notifications by creation date range', async () => {
      const notifications = await prisma.notification.findMany({
        where: {
          createdAt: {
            gte: new Date('2024-01-01T00:00:00Z'),
            lte: new Date('2025-12-31T23:59:59Z'),
          },
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('読取テスト通知メッセージ');
    });

    it('should find notifications ordered by creation date', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'order@example.com',
          name: '順序テストユーザー',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const notification2 = await prisma.notification.create({
        data: {
          userId: user.id,
          eventType: 'event2',
          message: '2番目の通知',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const notification3 = await prisma.notification.create({
        data: {
          userId: user.id,
          eventType: 'event3',
          message: '3番目の通知',
        },
      });

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(notifications).toHaveLength(3);
      expect(notifications[0].message).toBe('1番目の通知');
      expect(notifications[1].message).toBe('2番目の通知');
      expect(notifications[2].message).toBe('3番目の通知');
    });

    it('should return null for non-existent notification', async () => {
      const foundNotification = await prisma.notification.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundNotification).toBeNull();
    });
  });

  describe('Update Notification', () => {
    let notificationId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          name: '更新テストユーザー',
        },
      });

      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          eventType: 'task_assigned',
          message: '更新前通知メッセージ',
          isRead: false,
        },
      });
      notificationId = notification.id;
    });

    it('should update notification message', async () => {
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          message: '更新後通知メッセージ',
        },
      });

      expect(updatedNotification.message).toBe('更新後通知メッセージ');
    });

    it('should update notification event type', async () => {
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          eventType: 'task_completed',
        },
      });

      expect(updatedNotification.eventType).toBe('task_completed');
    });

    it('should update notification read status', async () => {
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
        },
      });

      expect(updatedNotification.isRead).toBe(true);
    });

    it('should update multiple fields', async () => {
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          eventType: 'case_closed',
          message: '複数更新通知メッセージ',
          isRead: true,
        },
      });

      expect(updatedNotification.eventType).toBe('case_closed');
      expect(updatedNotification.message).toBe('複数更新通知メッセージ');
      expect(updatedNotification.isRead).toBe(true);
    });

    it('should fail to update non-existent notification', async () => {
      await expect(
        prisma.notification.update({
          where: { id: 'non-existent-id' },
          data: { message: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Notification', () => {
    let notificationId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          name: '削除テストユーザー',
        },
      });

      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          eventType: 'system_alert',
          message: '削除テスト通知メッセージ',
        },
      });
      notificationId = notification.id;
    });

    it('should delete notification by id', async () => {
      const deletedNotification = await prisma.notification.delete({
        where: { id: notificationId },
      });

      expect(deletedNotification.id).toBe(notificationId);
      expect(deletedNotification.message).toBe('削除テスト通知メッセージ');

      const foundNotification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      expect(foundNotification).toBeNull();
    });

    it('should fail to delete non-existent notification', async () => {
      await expect(
        prisma.notification.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Notification Relations', () => {
    it('should find user with notifications', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'relation@example.com',
          name: '関係テストユーザー',
        },
      });

      await prisma.notification.createMany({
        data: [
          {
            userId: user.id,
            eventType: 'case_created',
            message: '案件作成通知',
            isRead: false,
          },
          {
            userId: user.id,
            eventType: 'task_assigned',
            message: 'タスク割り当て通知',
            isRead: true,
          },
          {
            userId: user.id,
            eventType: 'deadline_approaching',
            message: '期限接近通知',
            isRead: false,
          },
        ],
      });

      const userWithNotifications = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          notifications: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      expect(userWithNotifications?.notifications).toHaveLength(3);
      expect(userWithNotifications?.notifications[0].message).toBe('案件作成通知');
      expect(userWithNotifications?.notifications[1].message).toBe('タスク割り当て通知');
      expect(userWithNotifications?.notifications[2].message).toBe('期限接近通知');
    });

    it('should find unread notifications for user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'unread@example.com',
          name: '未読通知テストユーザー',
        },
      });

      await prisma.notification.createMany({
        data: [
          {
            userId: user.id,
            eventType: 'event1',
            message: '未読通知1',
            isRead: false,
          },
          {
            userId: user.id,
            eventType: 'event2',
            message: '既読通知1',
            isRead: true,
          },
          {
            userId: user.id,
            eventType: 'event3',
            message: '未読通知2',
            isRead: false,
          },
        ],
      });

      const unreadNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(unreadNotifications).toHaveLength(2);
      expect(unreadNotifications[0].message).toBe('未読通知1');
      expect(unreadNotifications[1].message).toBe('未読通知2');
    });

    it('should find notifications by event type for user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'event@example.com',
          name: 'イベント通知テストユーザー',
        },
      });

      await prisma.notification.createMany({
        data: [
          {
            userId: user.id,
            eventType: 'case_created',
            message: '案件作成通知1',
          },
          {
            userId: user.id,
            eventType: 'task_assigned',
            message: 'タスク割り当て通知1',
          },
          {
            userId: user.id,
            eventType: 'case_created',
            message: '案件作成通知2',
          },
        ],
      });

      const caseCreatedNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          eventType: 'case_created',
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(caseCreatedNotifications).toHaveLength(2);
      expect(caseCreatedNotifications[0].message).toBe('案件作成通知1');
      expect(caseCreatedNotifications[1].message).toBe('案件作成通知2');
    });
  });
});
