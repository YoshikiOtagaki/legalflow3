'use client'

import {
  CaseStatusDistribution,
  CaseCategoryDistribution,
  RevenueByMonth,
  TimeTrackingStats
} from '@/types/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

interface ChartsProps {
  caseStatusDistribution: CaseStatusDistribution[]
  caseCategoryDistribution: CaseCategoryDistribution[]
  revenueByMonth: RevenueByMonth[]
  timeTrackingStats: TimeTrackingStats
}

export function Charts({
  caseStatusDistribution,
  caseCategoryDistribution,
  revenueByMonth,
  timeTrackingStats
}: ChartsProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ケースステータス分布 */}
      <Card>
        <CardHeader>
          <CardTitle>ケースステータス分布</CardTitle>
          <CardDescription>
            現在のケースのステータス別分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={caseStatusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {caseStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ケースカテゴリ分布 */}
      <Card>
        <CardHeader>
          <CardTitle>ケースカテゴリ分布</CardTitle>
          <CardDescription>
            ケースのカテゴリ別分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={caseCategoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {caseCategoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 月別収益推移 */}
      <Card>
        <CardHeader>
          <CardTitle>月別収益推移</CardTitle>
          <CardDescription>
            過去12ヶ月の収益とケース数の推移
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `¥${value.toLocaleString()}` : value,
                  name === 'revenue' ? '収益' : 'ケース数'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="revenue" />
              <Bar yAxisId="right" dataKey="cases" fill="#82ca9d" name="cases" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 時間追跡統計 */}
      <Card>
        <CardHeader>
          <CardTitle>時間追跡統計</CardTitle>
          <CardDescription>
            ケース別の作業時間分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {timeTrackingStats.totalHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">総作業時間</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {timeTrackingStats.billableHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">請求可能時間</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">上位ケース（作業時間）</h4>
              {timeTrackingStats.topCases.map((case_, index) => (
                <div key={case_.caseId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">{case_.caseTitle}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${case_.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 ml-2">
                    {case_.hours.toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
