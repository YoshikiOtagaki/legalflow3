import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../models';

const prisma = new PrismaClient();

// 通知タイプの定義
export enum NotificationType {
  CASE_CREATED = 'case_created',
  CASE_UPDATED = 'case_updated',
  CASE_ASSIGNED = 'case_assigned',
  CASE_PHASE_CHANGED = 'case_phase_changed',
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  DOCUMENT_UPLOADED = 'document_uploaded',
  HEARING_SCHEDULED = 'hearing_scheduled',
  HEARING_REMINDER = 'hearing_reminder',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert'
}

// 通知チャンネルの定義
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  LINE = 'line',
  IN_APP = 'in_app'
}

// 通知優先度の定義
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 通知設定の型定義
export interface NotificationSettings {
  userId: string;
  channels: NotificationChannel[];
  types: NotificationType[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  preferences: {
    caseUpdates: boolean;
    taskReminders: boolean;
    documentUploads: boolean;
    hearingReminders: boolean;
    paymentNotifications: boolean;
    systemAlerts: boolean;
  };
}

// 通知テンプレートの型定義
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  template: {
    email?: string;
    sms?: string;
    push?: string;
    line?: string;
    inApp?: string;
  };
}

// 通知テンプレートの定義
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.CASE_CREATED]: {
    type: NotificationType.CASE_CREATED,
    title: '新しいケースが作成されました',
    message: 'ケース「{{caseName}}」が作成されました。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL,
    template: {
      email: 'ケース「{{caseName}}」が作成されました。\n\nケースID: {{caseId}}\n作成者: {{createdBy}}\n作成日時: {{createdAt}}',
      inApp: 'ケース「{{caseName}}」が作成されました。'
    }
  },
  [NotificationType.CASE_UPDATED]: {
    type: NotificationType.CASE_UPDATED,
    title: 'ケースが更新されました',
    message: 'ケース「{{caseName}}」が更新されました。',
    channels: [NotificationChannel.IN_APP],
    priority: NotificationPriority.LOW,
    template: {
      inApp: 'ケース「{{caseName}}」が更新されました。'
    }
  },
  [NotificationType.CASE_ASSIGNED]: {
    type: NotificationType.CASE_ASSIGNED,
    title: 'ケースが割り当てられました',
    message: 'ケース「{{caseName}}」があなたに割り当てられました。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH,
    template: {
      email: 'ケース「{{caseName}}」があなたに割り当てられました。\n\nケースID: {{caseId}}\n割り当て者: {{assignedBy}}\n割り当て日時: {{assignedAt}}',
      push: 'ケース「{{caseName}}」が割り当てられました。',
      inApp: 'ケース「{{caseName}}」があなたに割り当てられました。'
    }
  },
  [NotificationType.CASE_PHASE_CHANGED]: {
    type: NotificationType.CASE_PHASE_CHANGED,
    title: 'ケースフェーズが変更されました',
    message: 'ケース「{{caseName}}」のフェーズが「{{oldPhase}}」から「{{newPhase}}」に変更されました。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL,
    template: {
      email: 'ケース「{{caseName}}」のフェーズが変更されました。\n\n変更前: {{oldPhase}}\n変更後: {{newPhase}}\n変更者: {{changedBy}}\n変更日時: {{changedAt}}',
      inApp: 'ケース「{{caseName}}」のフェーズが「{{oldPhase}}」から「{{newPhase}}」に変更されました。'
    }
  },
  [NotificationType.TASK_CREATED]: {
    type: NotificationType.TASK_CREATED,
    title: '新しいタスクが作成されました',
    message: 'タスク「{{taskTitle}}」が作成されました。',
    channels: [NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL,
    template: {
      inApp: 'タスク「{{taskTitle}}」が作成されました。'
    }
  },
  [NotificationType.TASK_ASSIGNED]: {
    type: NotificationType.TASK_ASSIGNED,
    title: 'タスクが割り当てられました',
    message: 'タスク「{{taskTitle}}」があなたに割り当てられました。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH,
    template: {
      email: 'タスク「{{taskTitle}}」があなたに割り当てられました。\n\nタスクID: {{taskId}}\n期限: {{dueDate}}\n割り当て者: {{assignedBy}}',
      push: 'タスク「{{taskTitle}}」が割り当てられました。',
      inApp: 'タスク「{{taskTitle}}」があなたに割り当てられました。'
    }
  },
  [NotificationType.TASK_DUE_SOON]: {
    type: NotificationType.TASK_DUE_SOON,
    title: 'タスクの期限が近づいています',
    message: 'タスク「{{taskTitle}}」の期限が近づいています。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH,
    template: {
      email: 'タスク「{{taskTitle}}」の期限が近づいています。\n\n期限: {{dueDate}}\n残り時間: {{timeRemaining}}',
      push: 'タスク「{{taskTitle}}」の期限が近づいています。',
      inApp: 'タスク「{{taskTitle}}」の期限が近づいています。'
    }
  },
  [NotificationType.TASK_OVERDUE]: {
    type: NotificationType.TASK_OVERDUE,
    title: 'タスクが期限切れです',
    message: 'タスク「{{taskTitle}}」が期限切れです。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.URGENT,
    template: {
      email: 'タスク「{{taskTitle}}」が期限切れです。\n\n期限: {{dueDate}}\n超過時間: {{overdueTime}}',
      push: 'タスク「{{taskTitle}}」が期限切れです。',
      inApp: 'タスク「{{taskTitle}}」が期限切れです。'
    }
  },
  [NotificationType.DOCUMENT_UPLOADED]: {
    type: NotificationType.DOCUMENT_UPLOADED,
    title: 'ドキュメントがアップロードされました',
    message: 'ケース「{{caseName}}」にドキュメントがアップロードされました。',
    channels: [NotificationChannel.IN_APP],
    priority: NotificationPriority.LOW,
    template: {
      inApp: 'ケース「{{caseName}}」にドキュメントがアップロードされました。'
    }
  },
  [NotificationType.HEARING_SCHEDULED]: {
    type: NotificationType.HEARING_SCHEDULED,
    title: '法廷がスケジュールされました',
    message: 'ケース「{{caseName}}」の法廷がスケジュールされました。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH,
    template: {
      email: 'ケース「{{caseName}}」の法廷がスケジュールされました。\n\n法廷日時: {{hearingDate}}\n場所: {{hearingLocation}}\n担当裁判官: {{judge}}',
      push: 'ケース「{{caseName}}」の法廷がスケジュールされました。',
      inApp: 'ケース「{{caseName}}」の法廷がスケジュールされました。'
    }
  },
  [NotificationType.HEARING_REMINDER]: {
    type: NotificationType.HEARING_REMINDER,
    title: '法廷のリマインダー',
    message: 'ケース「{{caseName}}」の法廷が{{timeRemaining}}後に開始されます。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH,
    template: {
      email: 'ケース「{{caseName}}」の法廷が{{timeRemaining}}後に開始されます。\n\n法廷日時: {{hearingDate}}\n場所: {{hearingLocation}}',
      push: 'ケース「{{caseName}}」の法廷が{{timeRemaining}}後に開始されます。',
      inApp: 'ケース「{{caseName}}」の法廷が{{timeRemaining}}後に開始されます。'
    }
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    type: NotificationType.PAYMENT_RECEIVED,
    title: '支払いが受領されました',
    message: 'ケース「{{caseName}}」の支払いが受領されました。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL,
    template: {
      email: 'ケース「{{caseName}}」の支払いが受領されました。\n\n金額: {{amount}}\n受領日時: {{receivedAt}}',
      inApp: 'ケース「{{caseName}}」の支払いが受領されました。'
    }
  },
  [NotificationType.PAYMENT_OVERDUE]: {
    type: NotificationType.PAYMENT_OVERDUE,
    title: '支払いが期限切れです',
    message: 'ケース「{{caseName}}」の支払いが期限切れです。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH,
    template: {
      email: 'ケース「{{caseName}}」の支払いが期限切れです。\n\n金額: {{amount}}\n期限: {{dueDate}}',
      push: 'ケース「{{caseName}}」の支払いが期限切れです。',
      inApp: 'ケース「{{caseName}}」の支払いが期限切れです。'
    }
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    type: NotificationType.SYSTEM_MAINTENANCE,
    title: 'システムメンテナンスのお知らせ',
    message: 'システムメンテナンスが予定されています。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL,
    template: {
      email: 'システムメンテナンスが予定されています。\n\nメンテナンス日時: {{maintenanceDate}}\n予想時間: {{duration}}\n影響: {{impact}}',
      inApp: 'システムメンテナンスが予定されています。'
    }
  },
  [NotificationType.SECURITY_ALERT]: {
    type: NotificationType.SECURITY_ALERT,
    title: 'セキュリティアラート',
    message: 'セキュリティに関する重要な通知があります。',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
    priority: NotificationPriority.URGENT,
    template: {
      email: 'セキュリティに関する重要な通知があります。\n\n詳細: {{alertDetails}}\n推奨アクション: {{recommendedAction}}',
      push: 'セキュリティアラート: {{alertDetails}}',
      inApp: 'セキュリティアラート: {{alertDetails}}'
    }
  }
};

// 通知管理サービスクラス
export class NotificationManagementService {
  /**
   * 通知を送信
   * @param type 通知タイプ
   * @param recipients 受信者IDの配列
   * @param data 通知データ
   * @param channels 送信チャンネル（オプション）
   * @returns 送信結果
   */
  static async sendNotification(
    type: NotificationType,
    recipients: string[],
    data: Record<string, any>,
    channels?: NotificationChannel[]
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    details: any[];
  }> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        throw new Error(`Notification template not found for type: ${type}`);
      }

      const sendChannels = channels || template.channels;
      const results = [];

      for (const recipientId of recipients) {
        try {
          // 受信者の通知設定を取得
          const settings = await this.getUserNotificationSettings(recipientId);

          // 通知を送信するかチェック
          if (!this.shouldSendNotification(settings, type)) {
            continue;
          }

          // 通知メッセージを生成
          const message = this.generateMessage(template, data);

          // 各チャンネルで送信
          for (const channel of sendChannels) {
            if (settings.channels.includes(channel)) {
              await this.sendToChannel(channel, recipientId, message, data);
            }
          }

          // 通知をデータベースに保存
          await NotificationService.create({
            userId: recipientId,
            type,
            title: message.title,
            message: message.content,
            data: JSON.stringify(data),
            isRead: false,
            priority: template.priority
          });

          results.push({ recipientId, success: true });
        } catch (error) {
          console.error(`Error sending notification to ${recipientId}:`, error);
          results.push({ recipientId, success: false, error: error.message });
        }
      }

      const sent = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: failed === 0,
        sent,
        failed,
        details: results
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * ユーザーの通知設定を取得
   * @param userId ユーザーID
   * @returns 通知設定
   */
  static async getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      // デフォルト設定
      const defaultSettings: NotificationSettings = {
        userId,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        types: Object.values(NotificationType),
        frequency: 'immediate',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'Asia/Tokyo'
        },
        preferences: {
          caseUpdates: true,
          taskReminders: true,
          documentUploads: true,
          hearingReminders: true,
          paymentNotifications: true,
          systemAlerts: true
        }
      };

      // データベースから設定を取得（実装は簡略化）
      // 実際の実装では、ユーザー設定テーブルから取得
      return defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return defaultSettings;
    }
  }

  /**
   * 通知を送信するかチェック
   * @param settings 通知設定
   * @param type 通知タイプ
   * @returns 送信するかどうか
   */
  private static shouldSendNotification(
    settings: NotificationSettings,
    type: NotificationType
  ): boolean {
    // 通知タイプが有効かチェック
    if (!settings.types.includes(type)) {
      return false;
    }

    // 静寂時間チェック
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('ja-JP', {
        timeZone: settings.quietHours.timezone,
        hour12: false
      });

      const startTime = settings.quietHours.start;
      const endTime = settings.quietHours.end;

      if (this.isInQuietHours(currentTime, startTime, endTime)) {
        return false;
      }
    }

    // 優先度別の設定チェック
    const template = NOTIFICATION_TEMPLATES[type];
    if (template.priority === NotificationPriority.LOW && !settings.preferences.caseUpdates) {
      return false;
    }

    return true;
  }

  /**
   * 静寂時間内かチェック
   * @param currentTime 現在時刻
   * @param startTime 開始時刻
   * @param endTime 終了時刻
   * @returns 静寂時間内かどうか
   */
  private static isInQuietHours(
    currentTime: string,
    startTime: string,
    endTime: string
  ): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // 日をまたぐ場合
      return current >= start || current <= end;
    }
  }

  /**
   * 時刻を分に変換
   * @param time 時刻文字列 (HH:MM)
   * @returns 分
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 通知メッセージを生成
   * @param template 通知テンプレート
   * @param data 通知データ
   * @returns 生成されたメッセージ
   */
  private static generateMessage(
    template: NotificationTemplate,
    data: Record<string, any>
  ): { title: string; content: string } {
    let title = template.title;
    let content = template.message;

    // プレースホルダーを置換
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { title, content };
  }

  /**
   * チャンネル別に通知を送信
   * @param channel 送信チャンネル
   * @param recipientId 受信者ID
   * @param message メッセージ
   * @param data 通知データ
   */
  private static async sendToChannel(
    channel: NotificationChannel,
    recipientId: string,
    message: { title: string; content: string },
    data: Record<string, any>
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmail(recipientId, message, data);
        break;
      case NotificationChannel.SMS:
        await this.sendSMS(recipientId, message, data);
        break;
      case NotificationChannel.PUSH:
        await this.sendPush(recipientId, message, data);
        break;
      case NotificationChannel.LINE:
        await this.sendLINE(recipientId, message, data);
        break;
      case NotificationChannel.IN_APP:
        // アプリ内通知は既にデータベースに保存済み
        break;
      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  }

  /**
   * メール通知を送信
   * @param recipientId 受信者ID
   * @param message メッセージ
   * @param data 通知データ
   */
  private static async sendEmail(
    recipientId: string,
    message: { title: string; content: string },
    data: Record<string, any>
  ): Promise<void> {
    // メール送信の実装（実際の実装では、SendGrid、AWS SES等を使用）
    console.log(`Sending email to ${recipientId}: ${message.title}`);
  }

  /**
   * SMS通知を送信
   * @param recipientId 受信者ID
   * @param message メッセージ
   * @param data 通知データ
   */
  private static async sendSMS(
    recipientId: string,
    message: { title: string; content: string },
    data: Record<string, any>
  ): Promise<void> {
    // SMS送信の実装（実際の実装では、Twilio等を使用）
    console.log(`Sending SMS to ${recipientId}: ${message.title}`);
  }

  /**
   * プッシュ通知を送信
   * @param recipientId 受信者ID
   * @param message メッセージ
   * @param data 通知データ
   */
  private static async sendPush(
    recipientId: string,
    message: { title: string; content: string },
    data: Record<string, any>
  ): Promise<void> {
    // プッシュ通知送信の実装（実際の実装では、Firebase Cloud Messaging等を使用）
    console.log(`Sending push notification to ${recipientId}: ${message.title}`);
  }

  /**
   * LINE通知を送信
   * @param recipientId 受信者ID
   * @param message メッセージ
   * @param data 通知データ
   */
  private static async sendLINE(
    recipientId: string,
    message: { title: string; content: string },
    data: Record<string, any>
  ): Promise<void> {
    // LINE通知送信の実装（実際の実装では、LINE Messaging APIを使用）
    console.log(`Sending LINE message to ${recipientId}: ${message.title}`);
  }

  /**
   * 通知設定を更新
   * @param userId ユーザーID
   * @param settings 新しい設定
   * @returns 更新結果
   */
  static async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<any> {
    try {
      // 実際の実装では、ユーザー設定テーブルを更新
      console.log(`Updating notification settings for user ${userId}:`, settings);
      return { success: true };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  /**
   * 通知の一括送信
   * @param notifications 通知の配列
   * @returns 送信結果
   */
  static async sendBulkNotifications(
    notifications: Array<{
      type: NotificationType;
      recipients: string[];
      data: Record<string, any>;
      channels?: NotificationChannel[];
    }>
  ): Promise<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
    results: any[];
  }> {
    try {
      const results = [];
      let totalSent = 0;
      let totalFailed = 0;

      for (const notification of notifications) {
        const result = await this.sendNotification(
          notification.type,
          notification.recipients,
          notification.data,
          notification.channels
        );

        results.push(result);
        totalSent += result.sent;
        totalFailed += result.failed;
      }

      return {
        success: totalFailed === 0,
        totalSent,
        totalFailed,
        results
      };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw new Error('Failed to send bulk notifications');
    }
  }
}
