export interface Notification {
  id: string
  userId: string
  user?: User
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  isArchived: boolean
  priority: NotificationPriority
  channels: NotificationChannel[]
  scheduledAt?: string
  sentAt?: string
  readAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationType {
  id: string
  name: string
  description?: string
  category: string
  template: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationPriority {
  id: string
  name: string
  level: number
  color?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'line' | 'in_app'
  isEnabled: boolean
  config?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface NotificationSettings {
  id: string
  userId: string
  user?: User
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  lineEnabled: boolean
  inAppEnabled: boolean
  emailAddress?: string
  phoneNumber?: string
  lineUserId?: string
  quietHoursStart?: string
  quietHoursEnd?: string
  timezone: string
  language: string
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
}

export interface NotificationFilters {
  typeId?: string
  priorityId?: string
  isRead?: boolean
  isArchived?: boolean
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
