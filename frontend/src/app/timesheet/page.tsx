'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TimesheetList } from '@/components/timesheet/timesheet-list'
import { TimerWidget } from '@/components/timesheet/timer-widget'

export default function TimesheetPage() {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  const handleEntrySelect = (entryId: string) => {
    setSelectedEntryId(entryId)
    // TODO: エントリ詳細ページに遷移
    console.log('Entry selected:', entryId)
  }

  const handleCreateEntry = () => {
    // TODO: エントリ作成ページに遷移
    console.log('Create entry')
  }

  const handleEditEntry = (entryId: string) => {
    // TODO: エントリ編集ページに遷移
    console.log('Edit entry:', entryId)
  }

  const handleDeleteEntry = (entryId: string) => {
    // TODO: エントリ削除後の処理
    console.log('Delete entry:', entryId)
  }

  const handleTimerStop = (timerId: string) => {
    // TODO: タイマー停止後の処理（エントリ作成など）
    console.log('Timer stopped:', timerId)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">タイムシート</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* タイマーウィジェット */}
              <div className="lg:col-span-1">
                <TimerWidget onTimerStop={handleTimerStop} />
              </div>

              {/* タイムシート一覧 */}
              <div className="lg:col-span-3">
                <TimesheetList
                  onEntrySelect={handleEntrySelect}
                  onCreateEntry={handleCreateEntry}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
