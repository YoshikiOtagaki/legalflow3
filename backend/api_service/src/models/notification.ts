import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  eventType: string;
  message: string;
  isRead?: boolean;
}

export interface UpdateNotificationData {
  eventType?: string;
  message?: string;
  isRead?: boolean;
}

export class NotificationService {
  /**
   * 通知を作成
   */
  static async create(data: CreateNotificationData) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        message: data.message,
        isRead: data.isRead || false,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * 複数の通知を一括作成
   */
  static async createMany(notifications: CreateNotificationData[]) {
    return await prisma.notification.createMany({
      data: notifications.map(notification => ({
        userId: notification.userId,
        eventType: notification.eventType,
        message: notification.message,
        isRead: notification.isRead || false,
      })),
    });
  }

  /**
   * IDで通知を取得
   */
  static async findById(id: string) {
    return await prisma.notification.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザーIDで通知を取得
   */
  static async findByUserId(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 未読通知を取得
   */
  static async findUnread(userId?: string) {
    return await prisma.notification.findMany({
      where: {
        isRead: false,
        ...(userId && { userId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 既読通知を取得
   */
  static async findRead(userId?: string) {
    return await prisma.notification.findMany({
      where: {
        isRead: true,
        ...(userId && { userId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * イベントタイプ別通知を取得
   */
  static async findByEventType(eventType: string, userId?: string) {
    return await prisma.notification.findMany({
      where: {
        eventType,
        ...(userId && { userId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 日付範囲で通知を取得
   */
  static async findByDateRange(startDate: Date, endDate: Date, userId?: string) {
    return await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { userId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * メッセージで通知を検索
   */
  static async searchByMessage(message: string, userId?: string) {
    return await prisma.notification.findMany({
      where: {
        message: { contains: message },
        ...(userId && { userId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 全通知を取得
   */
  static async findAll() {
    return await prisma.notification.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 通知を更新
   */
  static async update(id: string, data: UpdateNotificationData) {
    return await prisma.notification.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * 通知を既読にする
   */
  static async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        user: true,
      },
    });
  }

  /**
   * 通知を未読にする
   */
  static async markAsUnread(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: false },
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザーの全通知を既読にする
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  /**
   * 通知を削除
   */
  static async delete(id: string) {
    return await prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * ユーザーの全通知を削除
   */
  static async deleteByUserId(userId: string) {
    return await prisma.notification.deleteMany({
      where: { userId },
    });
  }

  /**
   * 既読通知を削除
   */
  static async deleteRead(userId?: string) {
    return await prisma.notification.deleteMany({
      where: {
        isRead: true,
        ...(userId && { userId }),
      },
    });
  }

  /**
   * 古い通知を削除（指定日数より古い）
   */
  static async deleteOld(daysOld: number, userId?: string) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        ...(userId && { userId }),
      },
    });
  }

  /**
   * 通知が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!notification;
  }

  /**
   * ユーザーの通知数を取得
   */
  static async countByUser(userId: string) {
    return await prisma.notification.count({
      where: { userId },
    });
  }

  /**
   * 全通知数を取得
   */
  static async count() {
    return await prisma.notification.count();
  }

  /**
   * 未読通知数を取得
   */
  static async countUnread(userId?: string) {
    return await prisma.notification.count({
      where: {
        isRead: false,
        ...(userId && { userId }),
      },
    });
  }

  /**
   * 既読通知数を取得
   */
  static async countRead(userId?: string) {
    return await prisma.notification.count({
      where: {
        isRead: true,
        ...(userId && { userId }),
      },
    });
  }

  /**
   * イベントタイプ別通知数を取得
   */
  static async countByEventType(eventType: string) {
    return await prisma.notification.count({
      where: { eventType },
    });
  }
}
