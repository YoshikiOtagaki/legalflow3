import axios from 'axios'

const OUTLOOK_GRAPH_API_URL = 'https://graph.microsoft.com/v1.0'
const OUTLOOK_OAUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0'

export interface OutlookEvent {
  id?: string
  subject: string
  body?: {
    contentType: 'text' | 'html'
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: Array<{
    emailAddress: {
      address: string
      name?: string
    }
    type: 'required' | 'optional' | 'resource'
    status?: {
      response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded'
      time: string
    }
  }>
  reminderMinutesBeforeStart?: number
  isReminderOn?: boolean
}

export interface OutlookCalendar {
  id: string
  name: string
  color?: string
  isDefaultCalendar?: boolean
  canEdit?: boolean
  canShare?: boolean
  canViewPrivateItems?: boolean
  changeKey?: string
}

export class OutlookCalendarService {
  private accessToken: string
  private refreshToken?: string
  private clientId: string
  private clientSecret: string
  private tenantId: string

  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID || ''
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || ''
    this.tenantId = process.env.OUTLOOK_TENANT_ID || 'common'
  }

  setCredentials(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://graph.microsoft.com/calendars.readwrite',
      'https://graph.microsoft.com/calendars.readwrite.shared',
      'offline_access',
    ].join(' ')

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI || '',
      scope: scopes,
      response_mode: 'query',
      state: 'outlook_calendar_auth',
    })

    return `${OUTLOOK_OAUTH_URL}/authorize?${params.toString()}`
  }

  async getToken(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await axios.post(`${OUTLOOK_OAUTH_URL}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI || '',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || '',
      }
    } catch (error) {
      console.error('Failed to get Outlook token:', error)
      throw new Error('Failed to get Outlook token')
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post(`${OUTLOOK_OAUTH_URL}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      this.accessToken = response.data.access_token
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token
      }

      return this.accessToken
    } catch (error) {
      console.error('Failed to refresh Outlook token:', error)
      throw new Error('Failed to refresh Outlook token')
    }
  }

  async getCalendars(): Promise<OutlookCalendar[]> {
    try {
      const response = await axios.get(
        `${OUTLOOK_GRAPH_API_URL}/me/calendars`,
        { headers: this.getHeaders() }
      )

      return response.data.value || []
    } catch (error) {
      console.error('Failed to get Outlook calendars:', error)
      throw new Error('Failed to get Outlook calendars')
    }
  }

  async getEvents(calendarId: string = 'primary', params?: {
    startDateTime?: string
    endDateTime?: string
    top?: number
    orderby?: string
  }): Promise<OutlookEvent[]> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.startDateTime) queryParams.set('startDateTime', params.startDateTime)
      if (params?.endDateTime) queryParams.set('endDateTime', params.endDateTime)
      if (params?.top) queryParams.set('$top', params.top.toString())
      if (params?.orderby) queryParams.set('$orderby', params.orderby)

      const url = `${OUTLOOK_GRAPH_API_URL}/me/calendars/${calendarId}/events?${queryParams.toString()}`
      const response = await axios.get(url, { headers: this.getHeaders() })

      return response.data.value || []
    } catch (error) {
      console.error('Failed to get Outlook events:', error)
      throw new Error('Failed to get Outlook events')
    }
  }

  async createEvent(calendarId: string = 'primary', event: OutlookEvent): Promise<OutlookEvent> {
    try {
      const response = await axios.post(
        `${OUTLOOK_GRAPH_API_URL}/me/calendars/${calendarId}/events`,
        event,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Failed to create Outlook event:', error)
      throw new Error('Failed to create Outlook event')
    }
  }

  async updateEvent(calendarId: string = 'primary', eventId: string, event: OutlookEvent): Promise<OutlookEvent> {
    try {
      const response = await axios.patch(
        `${OUTLOOK_GRAPH_API_URL}/me/calendars/${calendarId}/events/${eventId}`,
        event,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Failed to update Outlook event:', error)
      throw new Error('Failed to update Outlook event')
    }
  }

  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      await axios.delete(
        `${OUTLOOK_GRAPH_API_URL}/me/calendars/${calendarId}/events/${eventId}`,
        { headers: this.getHeaders() }
      )
    } catch (error) {
      console.error('Failed to delete Outlook event:', error)
      throw new Error('Failed to delete Outlook event')
    }
  }

  async createCaseEvent(caseData: {
    title: string
    description: string
    startDate: string
    endDate: string
    location?: string
    attendees?: string[]
  }): Promise<OutlookEvent> {
    const event: OutlookEvent = {
      subject: `ケース: ${caseData.title}`,
      body: {
        contentType: 'text',
        content: caseData.description,
      },
      start: {
        dateTime: caseData.startDate,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: caseData.endDate,
        timeZone: 'Asia/Tokyo',
      },
      location: caseData.location ? {
        displayName: caseData.location,
      } : undefined,
      attendees: caseData.attendees?.map(email => ({
        emailAddress: {
          address: email,
        },
        type: 'required',
        status: {
          response: 'notResponded',
          time: new Date().toISOString(),
        },
      })),
      reminderMinutesBeforeStart: 30,
      isReminderOn: true,
    }

    return this.createEvent('primary', event)
  }

  async createDeadlineEvent(deadlineData: {
    title: string
    description: string
    deadline: string
    caseTitle: string
  }): Promise<OutlookEvent> {
    const event: OutlookEvent = {
      subject: `期限: ${deadlineData.title}`,
      body: {
        contentType: 'text',
        content: `${deadlineData.description}\n\nケース: ${deadlineData.caseTitle}`,
      },
      start: {
        dateTime: deadlineData.deadline,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: deadlineData.deadline,
        timeZone: 'Asia/Tokyo',
      },
      reminderMinutesBeforeStart: 60,
      isReminderOn: true,
    }

    return this.createEvent('primary', event)
  }

  async createCourtHearingEvent(hearingData: {
    caseTitle: string
    courtName: string
    hearingDate: string
    hearingTime: string
    description?: string
  }): Promise<OutlookEvent> {
    const startDateTime = `${hearingData.hearingDate}T${hearingData.hearingTime}:00`
    const endDateTime = `${hearingData.hearingDate}T${hearingData.hearingTime}:00`

    // 終了時間を1時間後として設定
    const endTime = new Date(endDateTime)
    endTime.setHours(endTime.getHours() + 1)
    const endDateTimeFormatted = endTime.toISOString()

    const event: OutlookEvent = {
      subject: `法廷: ${hearingData.caseTitle}`,
      body: {
        contentType: 'text',
        content: `法廷名: ${hearingData.courtName}\n${hearingData.description || ''}`,
      },
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endDateTimeFormatted,
        timeZone: 'Asia/Tokyo',
      },
      location: {
        displayName: hearingData.courtName,
      },
      reminderMinutesBeforeStart: 30,
      isReminderOn: true,
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
  }): Promise<OutlookEvent> {
    const startDateTime = `${meetingData.meetingDate}T${meetingData.meetingTime}:00`
    const endDateTime = `${meetingData.meetingDate}T${meetingData.meetingTime}:00`

    // 終了時間を1時間後として設定
    const endTime = new Date(endDateTime)
    endTime.setHours(endTime.getHours() + 1)
    const endDateTimeFormatted = endTime.toISOString()

    const event: OutlookEvent = {
      subject: `クライアント面談: ${meetingData.caseTitle}`,
      body: {
        contentType: 'text',
        content: `クライアント: ${meetingData.clientName}\n${meetingData.description || ''}`,
      },
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endDateTimeFormatted,
        timeZone: 'Asia/Tokyo',
      },
      location: meetingData.location ? {
        displayName: meetingData.location,
      } : undefined,
      reminderMinutesBeforeStart: 30,
      isReminderOn: true,
    }

    return this.createEvent('primary', event)
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret)
  }
}

export const outlookCalendarService = new OutlookCalendarService()
