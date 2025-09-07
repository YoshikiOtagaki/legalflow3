'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { NotificationList } from '@/components/notifications/notification-list'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { NotificationPreferences } from '@/components/notifications/notification-preferences'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('list')

  const handleNotificationSelect = (notificationId: string) => {
    // TODO: 通知詳細ページに遷移
    console.log('Notification selected:', notificationId)
  }

  const handleMarkAllRead = () => {
    // TODO: 一括既読化後の処理
    console.log('All notifications marked as read')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">通知・設定</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">通知一覧</TabsTrigger>
                <TabsTrigger value="settings">設定</TabsTrigger>
                <TabsTrigger value="preferences">通知設定</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <NotificationList
                  onNotificationSelect={handleNotificationSelect}
                  onMarkAllRead={handleMarkAllRead}
                />
              </TabsContent>

              <TabsContent value="settings">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="preferences">
                <NotificationPreferences />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
