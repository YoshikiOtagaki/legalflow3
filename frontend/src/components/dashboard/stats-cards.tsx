'use client'

import { DashboardStats } from '@/types/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar
} from 'lucide-react'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}時間`
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 総ケース数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総ケース数</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCases}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getGrowthIcon(stats.caseGrowth)}
            <span className={`ml-1 ${getGrowthColor(stats.caseGrowth)}`}>
              {formatPercentage(stats.caseGrowth)} 前月比
            </span>
          </div>
        </CardContent>
      </Card>

      {/* アクティブケース */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">アクティブケース</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCases}</div>
          <p className="text-xs text-muted-foreground">
            完了済み: {stats.completedCases}件
          </p>
        </CardContent>
      </Card>

      {/* クライアント数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">クライアント数</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">
            ドキュメント: {stats.totalDocuments}件
          </p>
        </CardContent>
      </Card>

      {/* 総作業時間 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総作業時間</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(stats.totalHours)}</div>
          <p className="text-xs text-muted-foreground">
            請求可能: {formatHours(stats.billableHours)}
          </p>
        </CardContent>
      </Card>

      {/* 総収益 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総収益</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getGrowthIcon(stats.revenueGrowth)}
            <span className={`ml-1 ${getGrowthColor(stats.revenueGrowth)}`}>
              {formatPercentage(stats.revenueGrowth)} 前月比
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 今月の収益 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の収益</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            今月のケース: {stats.casesThisMonth}件
          </p>
        </CardContent>
      </Card>

      {/* 平均ケース期間 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均ケース期間</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageCaseDuration}日</div>
          <p className="text-xs text-muted-foreground">
            前月比: {stats.casesLastMonth}件
          </p>
        </CardContent>
      </Card>

      {/* 成長率 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">成長率</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(stats.caseGrowth)}</div>
          <p className="text-xs text-muted-foreground">
            ケース成長率
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
