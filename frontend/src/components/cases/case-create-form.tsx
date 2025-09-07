'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ArrowLeft, Save } from 'lucide-react'

const caseCreateSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください'),
  caseNumber: z.string().min(1, 'ケース番号を入力してください'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  statusId: z.string().min(1, 'ステータスを選択してください'),
  phaseId: z.string().min(1, 'フェーズを選択してください'),
  priorityId: z.string().min(1, '優先度を選択してください'),
  courtId: z.string().optional(),
  assignedLawyerId: z.string().optional(),
  clientId: z.string().optional(),
  opposingPartyId: z.string().optional(),
  startDate: z.string().min(1, '開始日を入力してください'),
  endDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
})

type CaseCreateFormData = z.infer<typeof caseCreateSchema>

interface CaseCreateFormProps {
  onSuccess?: (caseId: string) => void
  onCancel?: () => void
}

interface Option {
  id: string
  name: string
}

export function CaseCreateForm({ onSuccess, onCancel }: CaseCreateFormProps) {
  const { accessToken } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Option[]>([])
  const [statuses, setStatuses] = useState<Option[]>([])
  const [phases, setPhases] = useState<Option[]>([])
  const [priorities, setPriorities] = useState<Option[]>([])
  const [courts, setCourts] = useState<Option[]>([])
  const [lawyers, setLawyers] = useState<Option[]>([])
  const [parties, setParties] = useState<Option[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CaseCreateFormData>({
    resolver: zodResolver(caseCreateSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  // オプションデータの取得
  useEffect(() => {
    const fetchOptions = async () => {
      if (!accessToken) return

      try {
        // カテゴリ
        const categoriesRes = await fetch(`${API_BASE_URL}/case-categories`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }

        // ステータス
        const statusesRes = await fetch(`${API_BASE_URL}/case-statuses`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setStatuses(statusesData.statuses || [])
        }

        // フェーズ
        const phasesRes = await fetch(`${API_BASE_URL}/case-phases`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (phasesRes.ok) {
          const phasesData = await phasesRes.json()
          setPhases(phasesData.phases || [])
        }

        // 優先度
        const prioritiesRes = await fetch(`${API_BASE_URL}/case-priorities`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (prioritiesRes.ok) {
          const prioritiesData = await prioritiesRes.json()
          setPriorities(prioritiesData.priorities || [])
        }

        // 裁判所
        const courtsRes = await fetch(`${API_BASE_URL}/courthouses`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (courtsRes.ok) {
          const courtsData = await courtsRes.json()
          setCourts(courtsData.courthouses || [])
        }

        // 弁護士
        const lawyersRes = await fetch(`${API_BASE_URL}/lawyers`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (lawyersRes.ok) {
          const lawyersData = await lawyersRes.json()
          setLawyers(lawyersData.lawyers || [])
        }

        // 当事者
        const partiesRes = await fetch(`${API_BASE_URL}/parties`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        if (partiesRes.ok) {
          const partiesData = await partiesRes.json()
          setParties(partiesData.parties || [])
        }
      } catch (error) {
        console.error('オプションデータの取得に失敗:', error)
      }
    }

    fetchOptions()
  }, [accessToken])

  const onSubmit = async (data: CaseCreateFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'ケースの作成に失敗しました')
      }

      const result = await response.json()
      onSuccess?.(result.id)
    } catch (error) {
      console.error('ケース作成エラー:', error)
      alert(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        )}
        <h1 className="text-3xl font-bold">新しいケースを作成</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              ケースの基本的な情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  placeholder="ケースのタイトルを入力"
                  {...register('title')}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseNumber">ケース番号 *</Label>
                <Input
                  id="caseNumber"
                  placeholder="例: 2024-001"
                  {...register('caseNumber')}
                  disabled={isSubmitting}
                />
                {errors.caseNumber && (
                  <p className="text-sm text-red-500">{errors.caseNumber.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                placeholder="ケースの詳細な説明を入力"
                rows={4}
                {...register('description')}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 分類・ステータス */}
        <Card>
          <CardHeader>
            <CardTitle>分類・ステータス</CardTitle>
            <CardDescription>
              ケースの分類と現在の状況を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">カテゴリ *</Label>
                <Select
                  value={watch('categoryId') || ''}
                  onValueChange={(value) => setValue('categoryId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusId">ステータス *</Label>
                <Select
                  value={watch('statusId') || ''}
                  onValueChange={(value) => setValue('statusId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.statusId && (
                  <p className="text-sm text-red-500">{errors.statusId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phaseId">フェーズ *</Label>
                <Select
                  value={watch('phaseId') || ''}
                  onValueChange={(value) => setValue('phaseId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="フェーズを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.phaseId && (
                  <p className="text-sm text-red-500">{errors.phaseId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorityId">優先度 *</Label>
                <Select
                  value={watch('priorityId') || ''}
                  onValueChange={(value) => setValue('priorityId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="優先度を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priorityId && (
                  <p className="text-sm text-red-500">{errors.priorityId.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 担当者・当事者 */}
        <Card>
          <CardHeader>
            <CardTitle>担当者・当事者</CardTitle>
            <CardDescription>
              担当弁護士と当事者を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedLawyerId">担当弁護士</Label>
                <Select
                  value={watch('assignedLawyerId') || ''}
                  onValueChange={(value) => setValue('assignedLawyerId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="担当弁護士を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {lawyers.map((lawyer) => (
                      <SelectItem key={lawyer.id} value={lawyer.id}>
                        {lawyer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courtId">裁判所</Label>
                <Select
                  value={watch('courtId') || ''}
                  onValueChange={(value) => setValue('courtId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="裁判所を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">クライアント</Label>
                <Select
                  value={watch('clientId') || ''}
                  onValueChange={(value) => setValue('clientId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="クライアントを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposingPartyId">相手方</Label>
                <Select
                  value={watch('opposingPartyId') || ''}
                  onValueChange={(value) => setValue('opposingPartyId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="相手方を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 日程 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              日程
            </CardTitle>
            <CardDescription>
              ケースの開始日と終了日を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">終了日</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedEndDate">予定終了日</Label>
                <Input
                  id="estimatedEndDate"
                  type="date"
                  {...register('estimatedEndDate')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                作成中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                ケースを作成
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
