import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from '../models';

const prisma = new PrismaClient();

// サブスクリプションプランの定義
export enum SubscriptionPlan {
  FREE = 'Free',
  BASIC = 'Basic',
  PROFESSIONAL = 'Professional',
  ENTERPRISE = 'Enterprise'
}

// プラン別の制限設定
export interface PlanLimits {
  maxCases: number;
  maxUsers: number;
  maxStorageGB: number;
  maxDocumentsPerCase: number;
  maxTimesheetEntries: number;
  maxExpenses: number;
  features: string[];
  price: number;
  billingCycle: 'monthly' | 'yearly';
}

// プラン制限の設定
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.FREE]: {
    maxCases: 3,
    maxUsers: 1,
    maxStorageGB: 1,
    maxDocumentsPerCase: 10,
    maxTimesheetEntries: 100,
    maxExpenses: 50,
    features: [
      'Basic case management',
      'Document storage (1GB)',
      'Basic reporting',
      'Email support'
    ],
    price: 0,
    billingCycle: 'monthly'
  },
  [SubscriptionPlan.BASIC]: {
    maxCases: 10,
    maxUsers: 3,
    maxStorageGB: 5,
    maxDocumentsPerCase: 50,
    maxTimesheetEntries: 500,
    maxExpenses: 200,
    features: [
      'Advanced case management',
      'Document storage (5GB)',
      'Advanced reporting',
      'Priority email support',
      'Basic integrations'
    ],
    price: 29,
    billingCycle: 'monthly'
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    maxCases: 50,
    maxUsers: 10,
    maxStorageGB: 25,
    maxDocumentsPerCase: 200,
    maxTimesheetEntries: 2000,
    maxExpenses: 1000,
    features: [
      'Full case management',
      'Document storage (25GB)',
      'Advanced reporting & analytics',
      'Priority support',
      'Advanced integrations',
      'API access',
      'Custom workflows'
    ],
    price: 79,
    billingCycle: 'monthly'
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxCases: -1, // 無制限
    maxUsers: -1, // 無制限
    maxStorageGB: -1, // 無制限
    maxDocumentsPerCase: -1, // 無制限
    maxTimesheetEntries: -1, // 無制限
    maxExpenses: -1, // 無制限
    features: [
      'Unlimited everything',
      'Custom storage',
      'Advanced analytics',
      'Dedicated support',
      'All integrations',
      'Full API access',
      'Custom workflows',
      'White-label options',
      'On-premise deployment'
    ],
    price: 199,
    billingCycle: 'monthly'
  }
};

// 使用量統計の型定義
export interface UsageStats {
  currentCases: number;
  currentUsers: number;
  currentStorageGB: number;
  currentDocuments: number;
  currentTimesheetEntries: number;
  currentExpenses: number;
  limits: PlanLimits;
  usagePercentages: {
    cases: number;
    users: number;
    storage: number;
    documents: number;
    timesheetEntries: number;
    expenses: number;
  };
  isOverLimit: boolean;
  overLimitItems: string[];
}

// サブスクリプションサービスクラス
export class SubscriptionManagementService {
  /**
   * ユーザーの使用量統計を取得
   * @param userId ユーザーID
   * @returns 使用量統計
   */
  static async getUserUsageStats(userId: string): Promise<UsageStats> {
    try {
      // サブスクリプション情報を取得
      const subscription = await SubscriptionService.findByUserId(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const plan = subscription.plan as SubscriptionPlan;
      const limits = PLAN_LIMITS[plan];

      // 現在の使用量を計算
      const currentCases = await prisma.case.count({
        where: { userId }
      });

      const currentUsers = await prisma.user.count({
        where: {
          subscriptions: {
            some: {
              userId: subscription.userId
            }
          }
        }
      });

      // ストレージ使用量を計算（ドキュメントのサイズ合計）
      const storageResult = await prisma.submittedDocument.aggregate({
        where: {
          case: {
            userId
          }
        },
        _sum: {
          fileSize: true
        }
      });

      const currentStorageGB = (storageResult._sum.fileSize || 0) / (1024 * 1024 * 1024);

      const currentDocuments = await prisma.submittedDocument.count({
        where: {
          case: {
            userId
          }
        }
      });

      const currentTimesheetEntries = await prisma.timesheetEntry.count({
        where: {
          case: {
            userId
          }
        }
      });

      const currentExpenses = await prisma.expense.count({
        where: {
          case: {
            userId
          }
        }
      });

      // 使用率を計算
      const calculatePercentage = (current: number, limit: number): number => {
        if (limit === -1) return 0; // 無制限
        return Math.round((current / limit) * 100);
      };

      const usagePercentages = {
        cases: calculatePercentage(currentCases, limits.maxCases),
        users: calculatePercentage(currentUsers, limits.maxUsers),
        storage: calculatePercentage(currentStorageGB, limits.maxStorageGB),
        documents: calculatePercentage(currentDocuments, limits.maxDocumentsPerCase),
        timesheetEntries: calculatePercentage(currentTimesheetEntries, limits.maxTimesheetEntries),
        expenses: calculatePercentage(currentExpenses, limits.maxExpenses)
      };

      // 制限超過チェック
      const isOverLimit = Object.values(usagePercentages).some(percentage => percentage > 100);
      const overLimitItems: string[] = [];

      if (usagePercentages.cases > 100) overLimitItems.push('cases');
      if (usagePercentages.users > 100) overLimitItems.push('users');
      if (usagePercentages.storage > 100) overLimitItems.push('storage');
      if (usagePercentages.documents > 100) overLimitItems.push('documents');
      if (usagePercentages.timesheetEntries > 100) overLimitItems.push('timesheetEntries');
      if (usagePercentages.expenses > 100) overLimitItems.push('expenses');

      return {
        currentCases,
        currentUsers,
        currentStorageGB: Math.round(currentStorageGB * 100) / 100,
        currentDocuments,
        currentTimesheetEntries,
        currentExpenses,
        limits,
        usagePercentages,
        isOverLimit,
        overLimitItems
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw new Error('Failed to get usage statistics');
    }
  }

  /**
   * ケース作成の制限チェック
   * @param userId ユーザーID
   * @returns ケース作成可能かどうか
   */
  static async canCreateCase(userId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    currentCount: number;
    maxCount: number;
  }> {
    try {
      const usageStats = await this.getUserUsageStats(userId);
      const { currentCases, limits, isOverLimit, overLimitItems } = usageStats;

      if (limits.maxCases === -1) {
        return {
          canCreate: true,
          currentCount: currentCases,
          maxCount: -1
        };
      }

      if (currentCases >= limits.maxCases) {
        return {
          canCreate: false,
          reason: `Case limit reached. Maximum ${limits.maxCases} cases allowed on ${limits.billingCycle} plan.`,
          currentCount: currentCases,
          maxCount: limits.maxCases
        };
      }

      if (isOverLimit && overLimitItems.includes('cases')) {
        return {
          canCreate: false,
          reason: 'Case limit exceeded due to subscription restrictions.',
          currentCount: currentCases,
          maxCount: limits.maxCases
        };
      }

      return {
        canCreate: true,
        currentCount: currentCases,
        maxCount: limits.maxCases
      };
    } catch (error) {
      console.error('Error checking case creation limit:', error);
      return {
        canCreate: false,
        reason: 'Error checking subscription limits',
        currentCount: 0,
        maxCount: 0
      };
    }
  }

  /**
   * ユーザー追加の制限チェック
   * @param userId ユーザーID
   * @returns ユーザー追加可能かどうか
   */
  static async canAddUser(userId: string): Promise<{
    canAdd: boolean;
    reason?: string;
    currentCount: number;
    maxCount: number;
  }> {
    try {
      const usageStats = await this.getUserUsageStats(userId);
      const { currentUsers, limits, isOverLimit, overLimitItems } = usageStats;

      if (limits.maxUsers === -1) {
        return {
          canAdd: true,
          currentCount: currentUsers,
          maxCount: -1
        };
      }

      if (currentUsers >= limits.maxUsers) {
        return {
          canAdd: false,
          reason: `User limit reached. Maximum ${limits.maxUsers} users allowed on ${limits.billingCycle} plan.`,
          currentCount: currentUsers,
          maxCount: limits.maxUsers
        };
      }

      if (isOverLimit && overLimitItems.includes('users')) {
        return {
          canAdd: false,
          reason: 'User limit exceeded due to subscription restrictions.',
          currentCount: currentUsers,
          maxCount: limits.maxUsers
        };
      }

      return {
        canAdd: true,
        currentCount: currentUsers,
        maxCount: limits.maxUsers
      };
    } catch (error) {
      console.error('Error checking user addition limit:', error);
      return {
        canAdd: false,
        reason: 'Error checking subscription limits',
        currentCount: 0,
        maxCount: 0
      };
    }
  }

  /**
   * ストレージ使用量の制限チェック
   * @param userId ユーザーID
   * @param additionalSizeGB 追加するサイズ（GB）
   * @returns ストレージ追加可能かどうか
   */
  static async canAddStorage(
    userId: string,
    additionalSizeGB: number
  ): Promise<{
    canAdd: boolean;
    reason?: string;
    currentSizeGB: number;
    maxSizeGB: number;
    remainingSizeGB: number;
  }> {
    try {
      const usageStats = await this.getUserUsageStats(userId);
      const { currentStorageGB, limits, isOverLimit, overLimitItems } = usageStats;

      if (limits.maxStorageGB === -1) {
        return {
          canAdd: true,
          currentSizeGB: currentStorageGB,
          maxSizeGB: -1,
          remainingSizeGB: -1
        };
      }

      const remainingSizeGB = limits.maxStorageGB - currentStorageGB;

      if (additionalSizeGB > remainingSizeGB) {
        return {
          canAdd: false,
          reason: `Storage limit would be exceeded. Only ${remainingSizeGB.toFixed(2)}GB remaining.`,
          currentSizeGB: currentStorageGB,
          maxSizeGB: limits.maxStorageGB,
          remainingSizeGB
        };
      }

      if (isOverLimit && overLimitItems.includes('storage')) {
        return {
          canAdd: false,
          reason: 'Storage limit exceeded due to subscription restrictions.',
          currentSizeGB: currentStorageGB,
          maxSizeGB: limits.maxStorageGB,
          remainingSizeGB
        };
      }

      return {
        canAdd: true,
        currentSizeGB: currentStorageGB,
        maxSizeGB: limits.maxStorageGB,
        remainingSizeGB
      };
    } catch (error) {
      console.error('Error checking storage limit:', error);
      return {
        canAdd: false,
        reason: 'Error checking subscription limits',
        currentSizeGB: 0,
        maxSizeGB: 0,
        remainingSizeGB: 0
      };
    }
  }

  /**
   * サブスクリプションプランをアップグレード
   * @param userId ユーザーID
   * @param newPlan 新しいプラン
   * @returns アップグレード結果
   */
  static async upgradePlan(userId: string, newPlan: SubscriptionPlan): Promise<any> {
    try {
      const subscription = await SubscriptionService.findByUserId(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const currentPlan = subscription.plan as SubscriptionPlan;
      const currentLimits = PLAN_LIMITS[currentPlan];
      const newLimits = PLAN_LIMITS[newPlan];

      // プランアップグレードの妥当性チェック
      if (this.getPlanLevel(currentPlan) >= this.getPlanLevel(newPlan)) {
        throw new Error('New plan must be higher than current plan');
      }

      // 使用量が新しいプランの制限を超えていないかチェック
      const usageStats = await this.getUserUsageStats(userId);
      if (usageStats.isOverLimit) {
        throw new Error('Cannot upgrade while over current plan limits');
      }

      // サブスクリプションを更新
      const updatedSubscription = await SubscriptionService.update(subscription.id, {
        plan: newPlan,
        status: 'Active',
        updatedAt: new Date()
      });

      return {
        success: true,
        oldPlan: currentPlan,
        newPlan,
        oldLimits: currentLimits,
        newLimits,
        message: `Successfully upgraded from ${currentPlan} to ${newPlan}`
      };
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw new Error('Failed to upgrade subscription plan');
    }
  }

  /**
   * サブスクリプションプランをダウングレード
   * @param userId ユーザーID
   * @param newPlan 新しいプラン
   * @returns ダウングレード結果
   */
  static async downgradePlan(userId: string, newPlan: SubscriptionPlan): Promise<any> {
    try {
      const subscription = await SubscriptionService.findByUserId(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const currentPlan = subscription.plan as SubscriptionPlan;
      const currentLimits = PLAN_LIMITS[currentPlan];
      const newLimits = PLAN_LIMITS[newPlan];

      // プランダウングレードの妥当性チェック
      if (this.getPlanLevel(currentPlan) <= this.getPlanLevel(newPlan)) {
        throw new Error('New plan must be lower than current plan');
      }

      // 現在の使用量が新しいプランの制限を超えていないかチェック
      const usageStats = await this.getUserUsageStats(userId);
      const newLimitsCheck = PLAN_LIMITS[newPlan];

      if (usageStats.currentCases > newLimitsCheck.maxCases && newLimitsCheck.maxCases !== -1) {
        throw new Error(`Cannot downgrade: ${usageStats.currentCases} cases exceed new plan limit of ${newLimitsCheck.maxCases}`);
      }

      if (usageStats.currentUsers > newLimitsCheck.maxUsers && newLimitsCheck.maxUsers !== -1) {
        throw new Error(`Cannot downgrade: ${usageStats.currentUsers} users exceed new plan limit of ${newLimitsCheck.maxUsers}`);
      }

      if (usageStats.currentStorageGB > newLimitsCheck.maxStorageGB && newLimitsCheck.maxStorageGB !== -1) {
        throw new Error(`Cannot downgrade: ${usageStats.currentStorageGB}GB storage exceed new plan limit of ${newLimitsCheck.maxStorageGB}GB`);
      }

      // サブスクリプションを更新
      const updatedSubscription = await SubscriptionService.update(subscription.id, {
        plan: newPlan,
        status: 'Active',
        updatedAt: new Date()
      });

      return {
        success: true,
        oldPlan: currentPlan,
        newPlan,
        oldLimits: currentLimits,
        newLimits,
        message: `Successfully downgraded from ${currentPlan} to ${newPlan}`
      };
    } catch (error) {
      console.error('Error downgrading plan:', error);
      throw new Error('Failed to downgrade subscription plan');
    }
  }

  /**
   * プランレベルを取得（数値で比較可能）
   * @param plan プラン
   * @returns プランレベル
   */
  private static getPlanLevel(plan: SubscriptionPlan): number {
    const levels = {
      [SubscriptionPlan.FREE]: 1,
      [SubscriptionPlan.BASIC]: 2,
      [SubscriptionPlan.PROFESSIONAL]: 3,
      [SubscriptionPlan.ENTERPRISE]: 4
    };
    return levels[plan];
  }

  /**
   * サブスクリプションの有効期限をチェック
   * @param userId ユーザーID
   * @returns 有効期限情報
   */
  static async checkSubscriptionExpiry(userId: string): Promise<{
    isExpired: boolean;
    daysUntilExpiry: number;
    isExpiringSoon: boolean;
    message: string;
  }> {
    try {
      const subscription = await SubscriptionService.findByUserId(userId);
      if (!subscription) {
        return {
          isExpired: true,
          daysUntilExpiry: 0,
          isExpiringSoon: false,
          message: 'No active subscription found'
        };
      }

      const now = new Date();
      const expiryDate = subscription.expiresAt;
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const isExpired = daysUntilExpiry <= 0;
      const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

      let message = '';
      if (isExpired) {
        message = 'Subscription has expired';
      } else if (isExpiringSoon) {
        message = `Subscription expires in ${daysUntilExpiry} days`;
      } else {
        message = `Subscription is active for ${daysUntilExpiry} more days`;
      }

      return {
        isExpired,
        daysUntilExpiry,
        isExpiringSoon,
        message
      };
    } catch (error) {
      console.error('Error checking subscription expiry:', error);
      return {
        isExpired: true,
        daysUntilExpiry: 0,
        isExpiringSoon: false,
        message: 'Error checking subscription status'
      };
    }
  }

  /**
   * 制限超過の警告を生成
   * @param userId ユーザーID
   * @returns 警告メッセージ
   */
  static async generateLimitWarnings(userId: string): Promise<string[]> {
    try {
      const usageStats = await this.getUserUsageStats(userId);
      const warnings: string[] = [];

      if (usageStats.usagePercentages.cases >= 80) {
        warnings.push(`Case usage is at ${usageStats.usagePercentages.cases}% of limit`);
      }

      if (usageStats.usagePercentages.users >= 80) {
        warnings.push(`User count is at ${usageStats.usagePercentages.users}% of limit`);
      }

      if (usageStats.usagePercentages.storage >= 80) {
        warnings.push(`Storage usage is at ${usageStats.usagePercentages.storage}% of limit`);
      }

      if (usageStats.usagePercentages.documents >= 80) {
        warnings.push(`Document count is at ${usageStats.usagePercentages.documents}% of limit`);
      }

      if (usageStats.usagePercentages.timesheetEntries >= 80) {
        warnings.push(`Timesheet entries are at ${usageStats.usagePercentages.timesheetEntries}% of limit`);
      }

      if (usageStats.usagePercentages.expenses >= 80) {
        warnings.push(`Expense count is at ${usageStats.usagePercentages.expenses}% of limit`);
      }

      return warnings;
    } catch (error) {
      console.error('Error generating limit warnings:', error);
      return ['Error checking usage limits'];
    }
  }
}
