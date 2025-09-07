'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuthStore } from '@/store/auth'
import { useDashboard } from '@/hooks/use-dashboard'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Charts } from '@/components/dashboard/charts'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Bell
} from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const {
    stats,
    caseStatusDistribution,
    caseCategoryDistribution,
    revenueByMonth,
    timeTrackingStats,
    recentActivities,
    upcomingDeadlines,
    isLoading,
    error
  } = useDashboard()

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">ダッシュボードを読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">エラーが発生しました</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} className="w-full">
                再読み込み
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">LegalFlow3</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  こんにちは、{user?.name || user?.username}さん
                </span>
                <Button onClick={handleLogout} variant="outline">
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-8">
            {/* 統計カード */}
            <StatsCards stats={stats} />

            {/* チャート */}
            <Charts
              caseStatusDistribution={caseStatusDistribution}
              caseCategoryDistribution={caseCategoryDistribution}
              revenueByMonth={revenueByMonth}
              timeTrackingStats={timeTrackingStats}
            />

            {/* アクティビティフィード */}
            <ActivityFeed
              recentActivities={recentActivities}
              upcomingDeadlines={upcomingDeadlines}
            />

            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
                <CardDescription>
                  よく使用する機能に素早くアクセス
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => window.location.href = '/cases'}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">ケース管理</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => window.location.href = '/parties'}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">当事者管理</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => window.location.href = '/timesheet'}
                  >
                    <Clock className="h-6 w-6" />
                    <span className="text-sm">タイムシート</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => window.location.href = '/documents'}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">ドキュメント</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
