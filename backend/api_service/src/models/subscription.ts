import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSubscriptionData {
  userId: string;
  plan?: string;
  status: string;
  caseCount?: number;
}

export interface UpdateSubscriptionData {
  plan?: string;
  status?: string;
  caseCount?: number;
}

export class SubscriptionService {
  /**
   * サブスクリプションを作成
   */
  static async create(data: CreateSubscriptionData) {
    return await prisma.subscription.create({
      data: {
        userId: data.userId,
        plan: data.plan || 'Free',
        status: data.status,
        caseCount: data.caseCount || 0,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * IDでサブスクリプションを取得
   */
  static async findById(id: string) {
    return await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザーIDでサブスクリプションを取得
   */
  static async findByUserId(userId: string) {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  /**
   * 全サブスクリプションを取得
   */
  static async findAll() {
    return await prisma.subscription.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * プラン別サブスクリプションを取得
   */
  static async findByPlan(plan: string) {
    return await prisma.subscription.findMany({
      where: { plan },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ステータス別サブスクリプションを取得
   */
  static async findByStatus(status: string) {
    return await prisma.subscription.findMany({
      where: { status },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * サブスクリプションを更新
   */
  static async update(id: string, data: UpdateSubscriptionData) {
    return await prisma.subscription.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザーIDでサブスクリプションを更新
   */
  static async updateByUserId(userId: string, data: UpdateSubscriptionData) {
    return await prisma.subscription.update({
      where: { userId },
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * サブスクリプションを削除
   */
  static async delete(id: string) {
    return await prisma.subscription.delete({
      where: { id },
    });
  }

  /**
   * ユーザーIDでサブスクリプションを削除
   */
  static async deleteByUserId(userId: string) {
    return await prisma.subscription.delete({
      where: { userId },
    });
  }

  /**
   * サブスクリプションが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!subscription;
  }

  /**
   * ユーザーがサブスクリプションを持っているかチェック
   */
  static async hasSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !!subscription;
  }

  /**
   * サブスクリプション数を取得
   */
  static async count() {
    return await prisma.subscription.count();
  }

  /**
   * プラン別サブスクリプション数を取得
   */
  static async countByPlan(plan: string) {
    return await prisma.subscription.count({
      where: { plan },
    });
  }

  /**
   * ステータス別サブスクリプション数を取得
   */
  static async countByStatus(status: string) {
    return await prisma.subscription.count({
      where: { status },
    });
  }

  /**
   * ケース数を増加
   */
  static async incrementCaseCount(id: string, increment: number = 1) {
    return await prisma.subscription.update({
      where: { id },
      data: {
        caseCount: {
          increment,
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * ケース数を減少
   */
  static async decrementCaseCount(id: string, decrement: number = 1) {
    return await prisma.subscription.update({
      where: { id },
      data: {
        caseCount: {
          decrement,
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザーIDでケース数を増加
   */
  static async incrementCaseCountByUserId(userId: string, increment: number = 1) {
    return await prisma.subscription.update({
      where: { userId },
      data: {
        caseCount: {
          increment,
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザーIDでケース数を減少
   */
  static async decrementCaseCountByUserId(userId: string, decrement: number = 1) {
    return await prisma.subscription.update({
      where: { userId },
      data: {
        caseCount: {
          decrement,
        },
      },
      include: {
        user: true,
      },
    });
  }
}
