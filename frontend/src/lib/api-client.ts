'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: HeadersInit

  constructor() {
    this.baseURL = API_BASE_URL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    // 認証トークンを取得
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // 認証関連
  async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: any): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
    })
  }

  // ケース関連
  async getCases(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.status) searchParams.set('status', params.status)

    const query = searchParams.toString()
    return this.request(`/cases${query ? `?${query}` : ''}`)
  }

  async getCase(id: string): Promise<ApiResponse<any>> {
    return this.request(`/cases/${id}`)
  }

  async createCase(caseData: any): Promise<ApiResponse<any>> {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    })
  }

  async updateCase(id: string, caseData: any): Promise<ApiResponse<any>> {
    return this.request(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    })
  }

  async deleteCase(id: string): Promise<ApiResponse> {
    return this.request(`/cases/${id}`, {
      method: 'DELETE',
    })
  }

  // 当事者関連
  async getParties(params?: { page?: number; limit?: number; search?: string; type?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.type) searchParams.set('type', params.type)

    const query = searchParams.toString()
    return this.request(`/parties${query ? `?${query}` : ''}`)
  }

  async getParty(id: string): Promise<ApiResponse<any>> {
    return this.request(`/parties/${id}`)
  }

  async createParty(partyData: any): Promise<ApiResponse<any>> {
    return this.request('/parties', {
      method: 'POST',
      body: JSON.stringify(partyData),
    })
  }

  async updateParty(id: string, partyData: any): Promise<ApiResponse<any>> {
    return this.request(`/parties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partyData),
    })
  }

  async deleteParty(id: string): Promise<ApiResponse> {
    return this.request(`/parties/${id}`, {
      method: 'DELETE',
    })
  }

  // ドキュメント関連
  async getDocuments(params?: { page?: number; limit?: number; search?: string; caseId?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.caseId) searchParams.set('caseId', params.caseId)

    const query = searchParams.toString()
    return this.request(`/documents${query ? `?${query}` : ''}`)
  }

  async getDocument(id: string): Promise<ApiResponse<any>> {
    return this.request(`/documents/${id}`)
  }

  async uploadDocument(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/documents/upload', {
      method: 'POST',
      headers: {}, // FormDataの場合はContent-Typeを設定しない
      body: formData,
    })
  }

  async deleteDocument(id: string): Promise<ApiResponse> {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    })
  }

  // タイムシート関連
  async getTimesheets(params?: { page?: number; limit?: number; caseId?: string; userId?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.caseId) searchParams.set('caseId', params.caseId)
    if (params?.userId) searchParams.set('userId', params.userId)

    const query = searchParams.toString()
    return this.request(`/timesheets${query ? `?${query}` : ''}`)
  }

  async createTimesheet(timesheetData: any): Promise<ApiResponse<any>> {
    return this.request('/timesheets', {
      method: 'POST',
      body: JSON.stringify(timesheetData),
    })
  }

  async updateTimesheet(id: string, timesheetData: any): Promise<ApiResponse<any>> {
    return this.request(`/timesheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timesheetData),
    })
  }

  async deleteTimesheet(id: string): Promise<ApiResponse> {
    return this.request(`/timesheets/${id}`, {
      method: 'DELETE',
    })
  }

  // 通知関連
  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.unreadOnly) searchParams.set('unreadOnly', params.unreadOnly.toString())

    const query = searchParams.toString()
    return this.request(`/notifications${query ? `?${query}` : ''}`)
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    })
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    })
  }

  // ダッシュボード関連
  async getDashboardData(): Promise<ApiResponse<any>> {
    return this.request('/dashboard')
  }

  // ユーザー関連
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/users/me')
  }

  async updateUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }
}

export const apiClient = new ApiClient()
