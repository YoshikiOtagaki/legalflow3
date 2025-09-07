import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NotificationService } from '../../../src/services/notification'
import { PrismaClient } from '@prisma/client'

// Prismaクライアントのモック
const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  case: {
    findUnique: jest.fn(),
  },
} as any

// 通知サービスインスタンス
const notificationService = new NotificationService(mockPrisma)

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        userId: 'user-1',
        type: 'case_update',
        title: 'ケース更新',
        message: 'ケースが更新されました',
        caseId: 'case-1',
      }

      const expectedNotification = {
        id: 'notification-1',
        ...notificationData,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.notification.create.mockResolvedValue(expectedNotification)

      const result = await notificationService.createNotification(notificationData)

      expect(result).toEqual(expectedNotification)
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: notificationData,
      })
    })

    it('should throw error when user does not exist', async () => {
      const notificationData = {
        userId: 'non-existent-user',
        type: 'case_update',
        title: 'ケース更新',
        message: 'ケースが更新されました',
        caseId: 'case-1',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(notificationService.createNotification(notificationData))
        .rejects.toThrow('User not found')
    })

    it('should throw error when case does not exist for case-related notification', async () => {
      const notificationData = {
        userId: 'user-1',
        type: 'case_update',
        title: 'ケース更新',
        message: 'ケースが更新されました',
        caseId: 'non-existent-case',
      }

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.case.findUnique.mockResolvedValue(null)

      await expect(notificationService.createNotification(notificationData))
        .rejects.toThrow('Case not found')
    })
  })

  describe('getUserNotifications', () => {
    it('should return user notifications with pagination', async () => {
      const userId = 'user-1'
      const page = 1
      const limit = 10

      const mockNotifications = [
        {
          id: 'notification-1',
          userId,
          type: 'case_update',
          title: 'ケース更新',
          message: 'ケースが更新されました',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notification-2',
          userId,
          type: 'deadline_reminder',
          title: '期限リマインダー',
          message: '期限が近づいています',
          isRead: true,
          createdAt: new Date(),
        },
      ]

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications)

      const result = await notificationService.getUserNotifications(userId, page, limit)

      expect(result.data).toEqual(mockNotifications)
      expect(result.pagination.page).toBe(page)
      expect(result.pagination.limit).toBe(limit)
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    })

    it('should filter by unread notifications when specified', async () => {
      const userId = 'user-1'
      const unreadOnly = true

      mockPrisma.notification.findMany.mockResolvedValue([])

      await notificationService.getUserNotifications(userId, 1, 10, unreadOnly)

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notification-1'
      const userId = 'user-1'

      const updatedNotification = {
        id: notificationId,
        userId,
        isRead: true,
        updatedAt: new Date(),
      }

      mockPrisma.notification.update.mockResolvedValue(updatedNotification)

      const result = await notificationService.markAsRead(notificationId, userId)

      expect(result).toEqual(updatedNotification)
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
        data: { isRead: true },
      })
    })

    it('should throw error when notification not found', async () => {
      const notificationId = 'non-existent-notification'
      const userId = 'user-1'

      mockPrisma.notification.update.mockResolvedValue(null)

      await expect(notificationService.markAsRead(notificationId, userId))
        .rejects.toThrow('Notification not found')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const userId = 'user-1'
      const updateResult = { count: 5 }

      mockPrisma.notification.updateMany.mockResolvedValue(updateResult)

      const result = await notificationService.markAllAsRead(userId)

      expect(result).toEqual(updateResult)
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      const notificationId = 'notification-1'
      const userId = 'user-1'

      const deletedNotification = {
        id: notificationId,
        userId,
        title: 'Test Notification',
      }

      mockPrisma.notification.delete.mockResolvedValue(deletedNotification)

      const result = await notificationService.deleteNotification(notificationId, userId)

      expect(result).toEqual(deletedNotification)
      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
      })
    })

    it('should throw error when notification not found', async () => {
      const notificationId = 'non-existent-notification'
      const userId = 'user-1'

      mockPrisma.notification.delete.mockResolvedValue(null)

      await expect(notificationService.deleteNotification(notificationId, userId))
        .rejects.toThrow('Notification not found')
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-1'
      const unreadCount = 3

      mockPrisma.notification.count.mockResolvedValue(unreadCount)

      const result = await notificationService.getUnreadCount(userId)

      expect(result).toBe(unreadCount)
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      })
    })
  })

  describe('sendCaseUpdateNotification', () => {
    it('should create case update notification', async () => {
      const caseId = 'case-1'
      const userId = 'user-1'
      const updateType = 'status_change'

      const expectedNotification = {
        id: 'notification-1',
        userId,
        type: 'case_update',
        title: 'ケース更新',
        message: `ケースの${updateType}が更新されました`,
        caseId,
        isRead: false,
        createdAt: new Date(),
      }

      mockPrisma.notification.create.mockResolvedValue(expectedNotification)

      const result = await notificationService.sendCaseUpdateNotification(
        caseId,
        userId,
        updateType
      )

      expect(result).toEqual(expectedNotification)
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          type: 'case_update',
          title: 'ケース更新',
          message: `ケースの${updateType}が更新されました`,
          caseId,
        },
      })
    })
  })

  describe('sendDeadlineReminder', () => {
    it('should create deadline reminder notification', async () => {
      const caseId = 'case-1'
      const userId = 'user-1'
      const deadline = '2024-12-31'
      const caseTitle = 'Test Case'

      const expectedNotification = {
        id: 'notification-1',
        userId,
        type: 'deadline_reminder',
        title: '期限リマインダー',
        message: `ケース「${caseTitle}」の期限（${deadline}）が近づいています`,
        caseId,
        isRead: false,
        createdAt: new Date(),
      }

      mockPrisma.notification.create.mockResolvedValue(expectedNotification)

      const result = await notificationService.sendDeadlineReminder(
        caseId,
        userId,
        deadline,
        caseTitle
      )

      expect(result).toEqual(expectedNotification)
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          type: 'deadline_reminder',
          title: '期限リマインダー',
          message: `ケース「${caseTitle}」の期限（${deadline}）が近づいています`,
          caseId,
        },
      })
    })
  })
})
