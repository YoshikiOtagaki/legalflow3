'use client'

import { RecentActivity, UpcomingDeadlines } from '@/types/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Clock,
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus
} from 'lucide-react'

interface ActivityFeedProps {
  recentActivities: RecentActivity[]
  upcomingDeadlines: UpcomingDeadlines[]
}

export function ActivityFeed({ recentActivities, upcomingDeadlines }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_created':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'case_updated':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'document_created':
        return <FileText className="h-4 w-4 text-purple-600" />
      case 'timesheet_entry':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'notification':
        return <Bell className="h-4 w-4 text-red-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'case_created':
        return 'bg-green-100 text-green-800'
      case 'case_updated':
        return 'bg-blue-100 text-blue-800'
      case 'document_created':
        return 'bg-purple-100 text-purple-800'
      case 'timesheet_entry':
        return 'bg-orange-100 text-orange-800'
      case 'notification':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) { // 1分未満
      return 'たった今'
    } else if (diff < 3600000) { // 1時間未満
      return `${Math.floor(diff / 60000)}分前`
    } else if (diff < 86400000) { // 1日未満
      return `${Math.floor(diff / 3600000)}時間前`
    } else {
      return date.toLocaleDateString('ja-JP')
    }
  }

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return `${Math.abs(days)}日遅れ`
    } else if (days === 0) {
      return '今日'
    } else if (days === 1) {
      return '明日'
    } else {
      return `${days}日後`
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 最近のアクティビティ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近のアクティビティ
          </CardTitle>
          <CardDescription>
            システム内で発生した最近のアクティビティ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">アクティビティがありません</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                      <Badge className={`text-xs ${getActivityColor(activity.type)}`}>
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                    {activity.caseTitle && (
                      <p className="text-xs text-blue-600">ケース: {activity.caseTitle}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 今後の期限 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            今後の期限
          </CardTitle>
          <CardDescription>
            近づいている期限とタスク
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-gray-500 text-center py-4">期限がありません</p>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {deadline.isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{deadline.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(deadline.priority)}`}>
                        {deadline.priority}
                      </Badge>
                      {deadline.isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          期限切れ
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{deadline.description}</p>
                    <p className="text-xs text-blue-600 mb-1">ケース: {deadline.caseTitle}</p>
                    <p className="text-xs text-gray-500">
                      {formatDeadline(deadline.dueDate)} ({new Date(deadline.dueDate).toLocaleDateString('ja-JP')})
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
