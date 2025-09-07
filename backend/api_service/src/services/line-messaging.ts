import axios from 'axios'

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message'
const LINE_OAUTH_API_URL = 'https://api.line.me/v2/oauth'

export interface LineMessage {
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker' | 'imagemap' | 'template' | 'flex'
  text?: string
  originalContentUrl?: string
  previewImageUrl?: string
  duration?: number
  title?: string
  address?: string
  latitude?: number
  longitude?: number
  packageId?: string
  stickerId?: string
  altText?: string
  template?: any
  contents?: any
}

export interface LinePushMessage {
  to: string
  messages: LineMessage[]
}

export interface LineBroadcastMessage {
  messages: LineMessage[]
}

export interface LineUserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export class LineMessagingService {
  private channelAccessToken: string
  private channelSecret: string

  constructor() {
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
    this.channelSecret = process.env.LINE_CHANNEL_SECRET || ''

    if (!this.channelAccessToken || !this.channelSecret) {
      console.warn('LINE Messaging API credentials not configured')
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.channelAccessToken}`,
      'Content-Type': 'application/json',
    }
  }

  async sendPushMessage(message: LinePushMessage): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channelAccessToken) {
        return {
          success: false,
          error: 'LINE Messaging API not configured',
        }
      }

      const response = await axios.post(
        `${LINE_MESSAGING_API_URL}/push`,
        message,
        { headers: this.getHeaders() }
      )

      return { success: true }
    } catch (error) {
      console.error('Failed to send LINE push message:', error)
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.message : 'Unknown error occurred',
      }
    }
  }

  async sendBroadcastMessage(message: LineBroadcastMessage): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channelAccessToken) {
        return {
          success: false,
          error: 'LINE Messaging API not configured',
        }
      }

      const response = await axios.post(
        `${LINE_MESSAGING_API_URL}/broadcast`,
        message,
        { headers: this.getHeaders() }
      )

      return { success: true }
    } catch (error) {
      console.error('Failed to send LINE broadcast message:', error)
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.message : 'Unknown error occurred',
      }
    }
  }

  async getUserProfile(userId: string): Promise<{ success: boolean; profile?: LineUserProfile; error?: string }> {
    try {
      if (!this.channelAccessToken) {
        return {
          success: false,
          error: 'LINE Messaging API not configured',
        }
      }

      const response = await axios.get(
        `${LINE_MESSAGING_API_URL}/profile/${userId}`,
        { headers: this.getHeaders() }
      )

      return {
        success: true,
        profile: response.data,
      }
    } catch (error) {
      console.error('Failed to get LINE user profile:', error)
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.message : 'Unknown error occurred',
      }
    }
  }

  async sendTextMessage(to: string, text: string): Promise<{ success: boolean; error?: string }> {
    return this.sendPushMessage({
      to,
      messages: [{
        type: 'text',
        text,
      }],
    })
  }

  async sendCaseUpdateNotification(userId: string, caseTitle: string, updateType: string): Promise<{ success: boolean; error?: string }> {
    const message = `ケース更新通知\n\nケース: ${caseTitle}\n更新内容: ${updateType}\n\n詳細はアプリでご確認ください。`

    return this.sendTextMessage(userId, message)
  }

  async sendDeadlineReminder(userId: string, caseTitle: string, deadline: string): Promise<{ success: boolean; error?: string }> {
    const message = `期限リマインダー\n\nケース: ${caseTitle}\n期限: ${deadline}\n\nお忘れなくご対応ください。`

    return this.sendTextMessage(userId, message)
  }

  async sendDocumentUploadNotification(userId: string, caseTitle: string, documentTitle: string): Promise<{ success: boolean; error?: string }> {
    const message = `ドキュメントアップロード通知\n\nケース: ${caseTitle}\nドキュメント: ${documentTitle}\n\n新しいドキュメントがアップロードされました。`

    return this.sendTextMessage(userId, message)
  }

  async sendTimesheetReminder(userId: string, caseTitle: string, hours: number): Promise<{ success: boolean; error?: string }> {
    const message = `タイムシートリマインダー\n\nケース: ${caseTitle}\n作業時間: ${hours}時間\n\nタイムシートの記録をお忘れなく。`

    return this.sendTextMessage(userId, message)
  }

  async sendSystemAlert(userId: string, alertType: string, message: string): Promise<{ success: boolean; error?: string }> {
    const fullMessage = `システムアラート\n\n種類: ${alertType}\n内容: ${message}`

    return this.sendTextMessage(userId, fullMessage)
  }

  async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    try {
      if (!this.channelSecret) {
        return false
      }

      const crypto = require('crypto')
      const hash = crypto
        .createHmac('sha256', this.channelSecret)
        .update(body)
        .digest('base64')

      return hash === signature
    } catch (error) {
      console.error('Failed to verify LINE webhook signature:', error)
      return false
    }
  }

  async handleWebhookEvent(event: any): Promise<{ success: boolean; error?: string }> {
    try {
      // LINE webhookイベントの処理
      switch (event.type) {
        case 'message':
          // メッセージ受信時の処理
          console.log('Received message:', event.message)
          break
        case 'follow':
          // 友達追加時の処理
          console.log('User followed:', event.source.userId)
          break
        case 'unfollow':
          // ブロック時の処理
          console.log('User unfollowed:', event.source.userId)
          break
        default:
          console.log('Unknown event type:', event.type)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to handle LINE webhook event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  isConfigured(): boolean {
    return !!(this.channelAccessToken && this.channelSecret)
  }
}

export const lineMessagingService = new LineMessagingService()
