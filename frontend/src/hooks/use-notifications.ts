'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Notification, NotificationListResponse, NotificationFilters, NotificationSettings } from '@/types/notification'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export function useNotifications(filters: NotificationFilters = {}) {
  const { accessToken } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })

  const fetchNotifications = async (newFilters: NotificationFilters = {}) => {
    if (!accessToken) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()

      Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('通知の取得に失敗しました')
      }

      const data: NotificationListResponse = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('通知の既読化に失敗しました')
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  const markAsUnread = async (notificationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/unread`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('通知の未読化に失敗しました')
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false, readAt: undefined }
            : notification
        )
      )
      setUnreadCount(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  const archiveNotification = async (notificationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('通知のアーカイブに失敗しました')
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isArchived: true, archivedAt: new Date().toISOString() }
            : notification
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('通知の削除に失敗しました')
      }

      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  const markAllAsRead = async () => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('すべての通知の既読化に失敗しました')
      }

      setNotifications(prev =>
        prev.map(notification =>
          !notification.isRead
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [accessToken])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
  }
}

export function useNotificationSettings() {
  const { accessToken } = useAuthStore()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    if (!accessToken) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('通知設定の取得に失敗しました')
      }

      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error('通知設定の更新に失敗しました')
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      return updatedSettings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [accessToken])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
  }
}
