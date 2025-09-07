import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { googleCalendarService } from '../services/google-calendar'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// 認証が必要なすべてのルートにミドルウェアを適用
router.use(authenticateToken)

// Google Calendar認証URL取得
router.get('/auth-url', async (req, res) => {
  try {
    const authUrl = await googleCalendarService.getAuthUrl()

    res.json({
      success: true,
      data: { authUrl },
    })
  } catch (error) {
    console.error('Failed to get Google Calendar auth URL:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Calendar auth URL',
    })
  }
})

// Google Calendar認証完了
router.post('/auth', async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      })
    }

    const tokens = await googleCalendarService.getToken(code)

    // ユーザーのGoogle Calendar認証情報を保存
    await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        googleCalendarAccessToken: tokens.accessToken,
        googleCalendarRefreshToken: tokens.refreshToken,
      },
    })

    res.json({
      success: true,
      data: { message: 'Google Calendar connected successfully' },
    })
  } catch (error) {
    console.error('Failed to authenticate with Google Calendar:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Google Calendar',
    })
  }
})

// Google Calendar認証解除
router.delete('/auth', async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
      },
    })

    res.json({
      success: true,
      data: { message: 'Google Calendar disconnected successfully' },
    })
  } catch (error) {
    console.error('Failed to disconnect Google Calendar:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google Calendar',
    })
  }
})

// カレンダー一覧取得
router.get('/calendars', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { googleCalendarAccessToken: true, googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar not connected',
      })
    }

    googleCalendarService.setCredentials(
      user.googleCalendarAccessToken,
      user.googleCalendarRefreshToken || undefined
    )

    const calendars = await googleCalendarService.getCalendars()

    res.json({
      success: true,
      data: calendars,
    })
  } catch (error) {
    console.error('Failed to get Google calendars:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Google calendars',
    })
  }
})

// イベント一覧取得
router.get('/events', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { googleCalendarAccessToken: true, googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar not connected',
      })
    }

    googleCalendarService.setCredentials(
      user.googleCalendarAccessToken,
      user.googleCalendarRefreshToken || undefined
    )

    const { calendarId = 'primary', timeMin, timeMax, maxResults } = req.query

    const events = await googleCalendarService.getEvents(calendarId as string, {
      timeMin: timeMin as string,
      timeMax: timeMax as string,
      maxResults: maxResults ? parseInt(maxResults as string) : undefined,
    })

    res.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error('Failed to get Google Calendar events:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Calendar events',
    })
  }
})

// ケースイベント作成
router.post('/events/case', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { googleCalendarAccessToken: true, googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar not connected',
      })
    }

    googleCalendarService.setCredentials(
      user.googleCalendarAccessToken,
      user.googleCalendarRefreshToken || undefined
    )

    const { caseId, title, description, startDate, endDate, location, attendees } = req.body

    if (!caseId || !title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseId, title, startDate, endDate',
      })
    }

    const event = await googleCalendarService.createCaseEvent({
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
    console.error('Failed to create Google Calendar case event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Google Calendar case event',
    })
  }
})

// 期限イベント作成
router.post('/events/deadline', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { googleCalendarAccessToken: true, googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar not connected',
      })
    }

    googleCalendarService.setCredentials(
      user.googleCalendarAccessToken,
      user.googleCalendarRefreshToken || undefined
    )

    const { title, description, deadline, caseTitle } = req.body

    if (!title || !deadline || !caseTitle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, deadline, caseTitle',
      })
    }

    const event = await googleCalendarService.createDeadlineEvent({
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
    console.error('Failed to create Google Calendar deadline event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Google Calendar deadline event',
    })
  }
})

// 法廷イベント作成
router.post('/events/court-hearing', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { googleCalendarAccessToken: true, googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar not connected',
      })
    }

    googleCalendarService.setCredentials(
      user.googleCalendarAccessToken,
      user.googleCalendarRefreshToken || undefined
    )

    const { caseTitle, courtName, hearingDate, hearingTime, description } = req.body

    if (!caseTitle || !courtName || !hearingDate || !hearingTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseTitle, courtName, hearingDate, hearingTime',
      })
    }

    const event = await googleCalendarService.createCourtHearingEvent({
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
    console.error('Failed to create Google Calendar court hearing event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Google Calendar court hearing event',
    })
  }
})

// クライアント面談イベント作成
router.post('/events/client-meeting', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { googleCalendarAccessToken: true, googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar not connected',
      })
    }

    googleCalendarService.setCredentials(
      user.googleCalendarAccessToken,
      user.googleCalendarRefreshToken || undefined
    )

    const { caseTitle, clientName, meetingDate, meetingTime, location, description } = req.body

    if (!caseTitle || !clientName || !meetingDate || !meetingTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseTitle, clientName, meetingDate, meetingTime',
      })
    }

    const event = await googleCalendarService.createClientMeetingEvent({
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
    console.error('Failed to create Google Calendar client meeting event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create Google Calendar client meeting event',
    })
  }
})

export default router
