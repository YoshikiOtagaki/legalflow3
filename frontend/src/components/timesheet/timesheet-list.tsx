'use client'

import { useState } from 'react'
import { useTimesheet } from '@/hooks/use-timesheet'
import { TimesheetFilters } from '@/types/timesheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Plus,
  Clock,
  FileText,
  Edit,
  Trash2,
  Play
} from 'lucide-react'

interface TimesheetListProps {
  caseId?: string
  onEntrySelect?: (entryId: string) => void
  onCreateEntry?: () => void
  onEditEntry?: (entryId: string) => void
  onDeleteEntry?: (entryId: string) => void
}

export function TimesheetList({
  caseId,
  onEntrySelect,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry
}: TimesheetListProps) {
  const [filters, setFilters] = useState<TimesheetFilters>({
    caseId,
    page: 1,
    limit: 10,
    sortBy: 'startTime',
    sortOrder: 'desc',
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { entries, loading, error, pagination, fetchEntries, deleteEntry } = useTimesheet(filters)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const newFilters = { ...filters, search: value, page: 1 }
    setFilters(newFilters)
    fetchEntries(newFilters)
  }

  const handleFilterChange = (key: keyof TimesheetFilters, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    fetchEntries(newFilters)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    fetchEntries(newFilters)
  }

  const handleDelete = async (entryId: string) => {
    if (window.confirm('このエントリを削除しますか？')) {
      try {
        await deleteEntry(entryId)
        onDeleteEntry?.(entryId)
      } catch (error) {
        console.error('削除エラー:', error)
        alert('削除に失敗しました')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '進行中':
        return 'bg-blue-100 text-blue-800'
      case '完了':
        return 'bg-green-100 text-green-800'
      case '承認待ち':
        return 'bg-yellow-100 text-yellow-800'
      case '請求済み':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchEntries()}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">タイムシート</h2>
        <Button onClick={onCreateEntry} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新しいエントリ
        </Button>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="作業内容で検索..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ステータス</label>
              <select
                value={filters.statusId || ''}
                onChange={(e) => handleFilterChange('statusId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">すべて</option>
                <option value="1">進行中</option>
                <option value="2">完了</option>
                <option value="3">承認待ち</option>
                <option value="4">請求済み</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">並び順</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  handleFilterChange('sortBy', sortBy)
                  handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc')
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="startTime-desc">開始時間（新しい順）</option>
                <option value="startTime-asc">開始時間（古い順）</option>
                <option value="duration-desc">時間（長い順）</option>
                <option value="duration-asc">時間（短い順）</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* エントリ一覧 */}
      <div className="grid gap-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">タイムシートエントリが見つかりませんでした</p>
              <Button onClick={onCreateEntry}>新しいエントリを作成</Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{entry.description}</CardTitle>
                    <CardDescription>
                      {entry.case?.title || 'ケース未指定'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(entry.status?.name || '')}>
                      {entry.status?.name || '未設定'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEntrySelect?.(entry.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditEntry?.(entry.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">開始時間</p>
                    <p className="font-medium">{formatTime(entry.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">終了時間</p>
                    <p className="font-medium">
                      {entry.endTime ? formatTime(entry.endTime) : '未完了'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">作業時間</p>
                    <p className="font-medium">{formatDuration(entry.duration)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">請求時間</p>
                    <p className="font-medium">
                      {entry.billableHours ? formatDuration(entry.billableHours * 60) : '未設定'}
                    </p>
                  </div>
                </div>

                {entry.totalAmount && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">金額</p>
                    <p className="font-medium text-lg">
                      ¥{entry.totalAmount.toLocaleString()}
                    </p>
                  </div>
                )}

                {entry.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    作成日: {new Date(entry.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.endTime && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        再開
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            前へ
          </Button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages} ページ
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}
