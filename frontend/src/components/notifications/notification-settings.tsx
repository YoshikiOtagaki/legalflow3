'use client'

import { useState, useEffect } from 'react'
import { useNotificationSettings } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Save,
  RefreshCw
} from 'lucide-react'

export function NotificationSettings() {
  const { settings, loading, error, updateSettings } = useNotificationSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    emailEnabled: false,
    smsEnabled: false,
    pushEnabled: false,
    lineEnabled: false,
    inAppEnabled: false,
    emailAddress: '',
    phoneNumber: '',
    lineUserId: '',
    quietHoursStart: '',
    quietHoursEnd: '',
    timezone: 'Asia/Tokyo',
    language: 'ja',
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        pushEnabled: settings.pushEnabled,
        lineEnabled: settings.lineEnabled,
        inAppEnabled: settings.inAppEnabled,
        emailAddress: settings.emailAddress || '',
        phoneNumber: settings.phoneNumber || '',
        lineUserId: settings.lineUserId || '',
        quietHoursStart: settings.quietHoursStart || '',
        quietHoursEnd: settings.quietHoursEnd || '',
        timezone: settings.timezone,
        language: settings.language,
      })
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await updateSettings(formData)
      alert('設定を保存しました')
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (settings) {
      setFormData({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        pushEnabled: settings.pushEnabled,
        lineEnabled: settings.lineEnabled,
        inAppEnabled: settings.inAppEnabled,
        emailAddress: settings.emailAddress || '',
        phoneNumber: settings.phoneNumber || '',
        lineUserId: settings.lineUserId || '',
        quietHoursStart: settings.quietHoursStart || '',
        quietHoursEnd: settings.quietHoursEnd || '',
        timezone: settings.timezone,
        language: settings.language,
      })
    }
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
        <Button onClick={() => window.location.reload()}>再読み込み</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">通知設定</h2>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            リセット
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 通知チャンネル設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知チャンネル
          </CardTitle>
          <CardDescription>
            どの方法で通知を受け取るかを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* メール通知 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base font-medium">メール通知</Label>
                    <p className="text-sm text-gray-600">メールで通知を受け取る</p>
                  </div>
                </div>
                <Switch
                  checked={formData.emailEnabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, emailEnabled: checked }))
                  }
                />
              </div>
              {formData.emailEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">メールアドレス</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    placeholder="example@example.com"
                    value={formData.emailAddress}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, emailAddress: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            {/* SMS通知 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base font-medium">SMS通知</Label>
                    <p className="text-sm text-gray-600">SMSで通知を受け取る</p>
                  </div>
                </div>
                <Switch
                  checked={formData.smsEnabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, smsEnabled: checked }))
                  }
                />
              </div>
              {formData.smsEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">電話番号</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="090-1234-5678"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            {/* プッシュ通知 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base font-medium">プッシュ通知</Label>
                    <p className="text-sm text-gray-600">アプリでプッシュ通知を受け取る</p>
                  </div>
                </div>
                <Switch
                  checked={formData.pushEnabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, pushEnabled: checked }))
                  }
                />
              </div>
            </div>

            {/* LINE通知 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base font-medium">LINE通知</Label>
                    <p className="text-sm text-gray-600">LINEで通知を受け取る</p>
                  </div>
                </div>
                <Switch
                  checked={formData.lineEnabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, lineEnabled: checked }))
                  }
                />
              </div>
              {formData.lineEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="lineUserId">LINEユーザーID</Label>
                  <Input
                    id="lineUserId"
                    placeholder="LINEユーザーIDを入力"
                    value={formData.lineUserId}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, lineUserId: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* アプリ内通知 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600" />
              <div>
                <Label className="text-base font-medium">アプリ内通知</Label>
                <p className="text-sm text-gray-600">アプリ内で通知を表示する</p>
              </div>
            </div>
            <Switch
              checked={formData.inAppEnabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, inAppEnabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 時間設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            時間設定
          </CardTitle>
          <CardDescription>
            通知を受け取る時間帯を設定してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietHoursStart">通知停止開始時間</Label>
              <Input
                id="quietHoursStart"
                type="time"
                value={formData.quietHoursStart}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, quietHoursStart: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietHoursEnd">通知停止終了時間</Label>
              <Input
                id="quietHoursEnd"
                type="time"
                value={formData.quietHoursEnd}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* その他の設定 */}
      <Card>
        <CardHeader>
          <CardTitle>その他の設定</CardTitle>
          <CardDescription>
            言語やタイムゾーンを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">タイムゾーン</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">言語</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
