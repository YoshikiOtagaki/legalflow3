import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface CalendarListEntry {
  id: string
  summary: string
  description?: string
  primary?: boolean
  accessRole: 'none' | 'freeBusyReader' | 'reader' | 'writer' | 'owner'
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client
  private calendar: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    })
  }

  async getToken(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)

      if (!tokens.access_token) {
        throw new Error('No access token received')
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
      }
    } catch (error) {
      console.error('Failed to get Google Calendar token:', error)
      throw new Error('Failed to get Google Calendar token')
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()

      if (!credentials.access_token) {
        throw new Error('No access token received')
      }

      return credentials.access_token
    } catch (error) {
      console.error('Failed to refresh Google Calendar token:', error)
      throw new Error('Failed to refresh Google Calendar token')
    }
  }

  async getCalendars(): Promise<CalendarListEntry[]> {
    try {
      if (!this.calendar) {
        throw new Error('Calendar not initialized')
      }

      const response = await this.calendar.calendarList.list()
      return response.data.items || []
    } catch (error) {
      console.error('Failed to get Google calendars:', error)
      throw new Error('Failed to get Google calendars')
    }
  }

  async getEvents(calendarId: string = 'primary', params?: {
    timeMin?: string
    timeMax?: string
    maxResults?: number
    singleEvents?: boolean
    orderBy?: 'startTime' | 'updated'
  }): Promise<CalendarEvent[]> {
    try {
      if (!this.calendar) {
        throw new Error('Calendar not initialized')
      }

      const response = await this.calendar.events.list({
        calendarId,
        ...params,
      })

      return response.data.items || []
    } catch (error) {
      console.error('Failed to get Google Calendar events:', error)
      throw new Error('Failed to get Google Calendar events')
    }
  }

  async createEvent(calendarId: string = 'primary', event: CalendarEvent): Promise<CalendarEvent> {
    try {
      if (!this.calendar) {
        throw new Error('Calendar not initialized')
      }

      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
      })

      return response.data
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error)
      throw new Error('Failed to create Google Calendar event')
    }
  }

  async updateEvent(calendarId: string = 'primary', eventId: string, event: CalendarEvent): Promise<CalendarEvent> {
    try {
      if (!this.calendar) {
        throw new Error('Calendar not initialized')
      }

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event,
      })

      return response.data
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error)
      throw new Error('Failed to update Google Calendar event')
    }
  }

  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      if (!this.calendar) {
        throw new Error('Calendar not initialized')
      }

      await this.calendar.events.delete({
        calendarId,
        eventId,
      })
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error)
      throw new Error('Failed to delete Google Calendar event')
    }
  }

  async createCaseEvent(caseData: {
    title: string
    description: string
    startDate: string
    endDate: string
    location?: string
    attendees?: string[]
  }): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      summary: `ケース: ${caseData.title}`,
      description: caseData.description,
      start: {
        dateTime: caseData.startDate,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: caseData.endDate,
        timeZone: 'Asia/Tokyo',
      },
      location: caseData.location,
      attendees: caseData.attendees?.map(email => ({
        email,
        responseStatus: 'needsAction',
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1日前
          { method: 'popup', minutes: 30 }, // 30分前
        ],
      },
    }

    return this.createEvent('primary', event)
  }

  async createDeadlineEvent(deadlineData: {
    title: string
    description: string
    deadline: string
    caseTitle: string
  }): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      summary: `期限: ${deadlineData.title}`,
      description: `${deadlineData.description}\n\nケース: ${deadlineData.caseTitle}`,
      start: {
        dateTime: deadlineData.deadline,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: deadlineData.deadline,
        timeZone: 'Asia/Tokyo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1日前
          { method: 'popup', minutes: 60 }, // 1時間前
        ],
      },
    }

    return this.createEvent('primary', event)
  }

  async createCourtHearingEvent(hearingData: {
    caseTitle: string
    courtName: string
    hearingDate: string
    hearingTime: string
    description?: string
  }): Promise<CalendarEvent> {
    const startDateTime = `${hearingData.hearingDate}T${hearingData.hearingTime}:00`
    const endDateTime = `${hearingData.hearingDate}T${hearingData.hearingTime}:00`

    // 終了時間を1時間後として設定
    const endTime = new Date(endDateTime)
    endTime.setHours(endTime.getHours() + 1)
    const endDateTimeFormatted = endTime.toISOString()

    const event: CalendarEvent = {
      summary: `法廷: ${hearingData.caseTitle}`,
      description: `法廷名: ${hearingData.courtName}\n${hearingData.description || ''}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endDateTimeFormatted,
        timeZone: 'Asia/Tokyo',
      },
      location: hearingData.courtName,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1日前
          { method: 'popup', minutes: 30 }, // 30分前
        ],
      },
    }

    return this.createEvent('primary', event)
  }

  async createClientMeetingEvent(meetingData: {
    caseTitle: string
    clientName: string
    meetingDate: string
    meetingTime: string
    location?: string
    description?: string
  }): Promise<CalendarEvent> {
    const startDateTime = `${meetingData.meetingDate}T${meetingData.meetingTime}:00`
    const endDateTime = `${meetingData.meetingDate}T${meetingData.meetingTime}:00`

    // 終了時間を1時間後として設定
    const endTime = new Date(endDateTime)
    endTime.setHours(endTime.getHours() + 1)
    const endDateTimeFormatted = endTime.toISOString()

    const event: CalendarEvent = {
      summary: `クライアント面談: ${meetingData.caseTitle}`,
      description: `クライアント: ${meetingData.clientName}\n${meetingData.description || ''}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endDateTimeFormatted,
        timeZone: 'Asia/Tokyo',
      },
      location: meetingData.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1日前
          { method: 'popup', minutes: 30 }, // 30分前
        ],
      },
    }

    return this.createEvent('primary', event)
  }
}

export const googleCalendarService = new GoogleCalendarService()
