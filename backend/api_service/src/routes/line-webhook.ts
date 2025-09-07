import { Router } from 'express'
import { lineMessagingService } from '../services/line-messaging'

const router = Router()

// LINE webhookエンドポイント
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-line-signature'] as string
    const body = JSON.stringify(req.body)

    // 署名検証
    const isValidSignature = await lineMessagingService.verifyWebhookSignature(body, signature)

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      })
    }

    // イベント処理
    const events = req.body.events || []

    for (const event of events) {
      const result = await lineMessagingService.handleWebhookEvent(event)

      if (!result.success) {
        console.error('Failed to handle event:', result.error)
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('LINE webhook error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

// LINE通知送信（内部API）
router.post('/send-notification', async (req, res) => {
  try {
    const { userId, type, data } = req.body

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, type',
      })
    }

    let result: { success: boolean; error?: string }

    switch (type) {
      case 'case_update':
        result = await lineMessagingService.sendCaseUpdateNotification(
          userId,
          data.caseTitle,
          data.updateType
        )
        break
      case 'deadline_reminder':
        result = await lineMessagingService.sendDeadlineReminder(
          userId,
          data.caseTitle,
          data.deadline
        )
        break
      case 'document_upload':
        result = await lineMessagingService.sendDocumentUploadNotification(
          userId,
          data.caseTitle,
          data.documentTitle
        )
        break
      case 'timesheet_reminder':
        result = await lineMessagingService.sendTimesheetReminder(
          userId,
          data.caseTitle,
          data.hours
        )
        break
      case 'system_alert':
        result = await lineMessagingService.sendSystemAlert(
          userId,
          data.alertType,
          data.message
        )
        break
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid notification type',
        })
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send notification',
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Failed to send LINE notification:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    })
  }
})

// LINE設定状態確認
router.get('/status', async (req, res) => {
  try {
    const isConfigured = lineMessagingService.isConfigured()

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        message: isConfigured
          ? 'LINE Messaging API is configured'
          : 'LINE Messaging API is not configured',
      },
    })
  } catch (error) {
    console.error('Failed to check LINE status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
    })
  }
})

export default router
