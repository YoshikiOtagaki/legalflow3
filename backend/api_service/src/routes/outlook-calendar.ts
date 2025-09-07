import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { outlookCalendarService } from '../services/outlook-calendar'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// 認証が必要なすべてのルートにミドルウェアを適用
router.use(authenticateToken)

// Outlook Calendar認証URL取得
router.get('/auth-url', async (req, res) => {
  try {
    const authUrl = await outlookCalendarService.getAuthUrl()

    res.json({
      success: true,
      data: { authUrl },
    })
  } catch (error) {
    console.error('Failed to get Outlook Calendar auth URL:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Outlook Calendar auth URL',
    })
  }
})

// Outlook Calendar認証完了
router.post('/auth', async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      })
    }

    const tokens = await outlookCalendarService.getToken(code)

    // ユーザーのOutlook Calendar認証情報を保存
    await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        outlookCalendarAccessToken: tokens.accessToken,
        outlookCalendarRefreshToken: tokens.refreshToken,
      },
    })

    res.json({
      success: true,
      data: { message: 'Outlook Calendar connected successfully' },
    })
  } catch (error) {
    console.error('Failed to authenticate with Outlook Calendar:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Outlook Calendar',
    })
  }
})

// Outlook Calendar認証解除
router.delete('/auth', async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        outlookCalendarAccessToken: null,
        outlookCalendarRefreshToken: null,
      },
    })

    res.json({
      success: true,
      data: { message: 'Outlook Calendar disconnected successfully' },
    })
  } catch (error) {
    console.error('Failed to disconnect Outlook Calendar:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Outlook Calendar',
    })
  }
})

// カレンダー一覧取得
router.get('/calendars', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { outlookCalendarAccessToken: true, outlookCalendarRefreshToken: true },
    })

    if (!user?.outlookCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Outlook Calendar not connected',
      })
    }

    outlookCalendarService.setCredentials(
      user.outlookCalendarAccessToken,
      user.outlookCalendarRefreshToken || undefined
    )

    const calendars = await outlookCalendarService.getCalendars()

    res.json({
      success: true,
      data: calendars,
    })
  } catch (error) {
    console.error('Failed to get Outlook calendars:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Outlook calendars',
    })
  }
})

// イベント一覧取得
router.get('/events', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { outlookCalendarAccessToken: true, outlookCalendarRefreshToken: true },
    })

    if (!user?.outlookCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Outlook Calendar not connected',
      })
    }

    outlookCalendarService.setCredentials(
      user.outlookCalendarAccessToken,
      user.outlookCalendarRefreshToken || undefined
    )

    const { calendarId = 'primary', startDateTime, endDateTime, top } = req.query

    const events = await outlookCalendarService.getEvents(calendarId as string, {
      startDateTime: startDateTime as string,
      endDateTime: endDateTime as string,
      top: top ? parseInt(top as string) : undefined,
    })

    res.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error('Failed to get Outlook Calendar events:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Outlook Calendar events',
    })
  }
})

// ケースイベント作成
router.post('/events/case', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { outlookCalendarAccessToken: true, outlookCalendarRefreshToken: true },
    })

    if (!user?.outlookCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Outlook Calendar not connected',
      })
    }

    outlookCalendarService.setCredentials(
      user.outlookCalendarAccessToken,
      user.outlookCalendarRefreshToken || undefined
    )

    const { caseId, title, description, startDate, endDate, location, attendees } = req.body

    if (!caseId || !title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseId, title, startDate, endDate',
      })
    }

    const event = await outlookCalendarService.createCaseEvent({
      title,
      description,
      startDate,
      endDate,
      location,
      attendees,
    })

    res.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Failed to create Outlook Calendar case event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Outlook Calendar case event',
    })
  }
})

// 期限イベント作成
router.post('/events/deadline', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { outlookCalendarAccessToken: true, outlookCalendarRefreshToken: true },
    })

    if (!user?.outlookCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Outlook Calendar not connected',
      })
    }

    outlookCalendarService.setCredentials(
      user.outlookCalendarAccessToken,
      user.outlookCalendarRefreshToken || undefined
    )

    const { title, description, deadline, caseTitle } = req.body

    if (!title || !deadline || !caseTitle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, deadline, caseTitle',
      })
    }

    const event = await outlookCalendarService.createDeadlineEvent({
      title,
      description,
      deadline,
      caseTitle,
    })

    res.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Failed to create Outlook Calendar deadline event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Outlook Calendar deadline event',
    })
  }
})

// 法廷イベント作成
router.post('/events/court-hearing', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { outlookCalendarAccessToken: true, outlookCalendarRefreshToken: true },
    })

    if (!user?.outlookCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Outlook Calendar not connected',
      })
    }

    outlookCalendarService.setCredentials(
      user.outlookCalendarAccessToken,
      user.outlookCalendarRefreshToken || undefined
    )

    const { caseTitle, courtName, hearingDate, hearingTime, description } = req.body

    if (!caseTitle || !courtName || !hearingDate || !hearingTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseTitle, courtName, hearingDate, hearingTime',
      })
    }

    const event = await outlookCalendarService.createCourtHearingEvent({
      caseTitle,
      courtName,
      hearingDate,
      hearingTime,
      description,
    })

    res.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Failed to create Outlook Calendar court hearing event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Outlook Calendar court hearing event',
    })
  }
})

// クライアント面談イベント作成
router.post('/events/client-meeting', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { outlookCalendarAccessToken: true, outlookCalendarRefreshToken: true },
    })

    if (!user?.outlookCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Outlook Calendar not connected',
      })
    }

    outlookCalendarService.setCredentials(
      user.outlookCalendarAccessToken,
      user.outlookCalendarRefreshToken || undefined
    )

    const { caseTitle, clientName, meetingDate, meetingTime, location, description } = req.body

    if (!caseTitle || !clientName || !meetingDate || !meetingTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseTitle, clientName, meetingDate, meetingTime',
      })
    }

    const event = await outlookCalendarService.createClientMeetingEvent({
      caseTitle,
      clientName,
      meetingDate,
      meetingTime,
      location,
      description,
    })

    res.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Failed to create Outlook Calendar client meeting event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Outlook Calendar client meeting event',
    })
  }
})

export default router
