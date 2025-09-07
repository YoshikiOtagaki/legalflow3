'use client';

import { useCase } from '@/hooks/use-cases';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface CaseDetailProps {
  caseId: string;
  onBack?: () => void;
  onEdit?: () => void;
}

export function CaseDetail({ caseId, onBack, onEdit }: CaseDetailProps) {
  const { case: case_, loading, error } = useCase(caseId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>再読み込み</Button>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">ケースが見つかりませんでした</p>
        {onBack && (
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        )}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '進行中':
        return 'bg-blue-100 text-blue-800';
      case '完了':
        return 'bg-green-100 text-green-800';
      case '保留':
        return 'bg-yellow-100 text-yellow-800';
      case 'キャンセル':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高':
        return 'bg-red-100 text-red-800';
      case '中':
        return 'bg-yellow-100 text-yellow-800';
      case '低':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            )}
            <h1 className="text-3xl font-bold">{case_.title}</h1>
          </div>
          <p className="text-lg text-gray-600">
            ケース番号: {case_.caseNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(case_.status?.name || '')}>
            {case_.status?.name || '未設定'}
          </Badge>
          <Badge className={getPriorityColor(case_.priority?.name || '')}>
            {case_.priority?.name || '未設定'}
          </Badge>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            編集
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メイン情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">カテゴリ</h4>
                <p className="text-gray-600">
                  {case_.category?.name || '未設定'}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">フェーズ</h4>
                <p className="text-gray-600">{case_.phase?.name || '未設定'}</p>
              </div>

              {case_.description && (
                <div>
                  <h4 className="font-medium text-gray-900">説明</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {case_.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">開始日</h4>
                  <p className="text-gray-600">
                    {new Date(case_.startDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {case_.endDate && (
                  <div>
                    <h4 className="font-medium text-gray-900">終了日</h4>
                    <p className="text-gray-600">
                      {new Date(case_.endDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
                {case_.estimatedEndDate && (
                  <div>
                    <h4 className="font-medium text-gray-900">予定終了日</h4>
                    <p className="text-gray-600">
                      {new Date(case_.estimatedEndDate).toLocaleDateString(
                        'ja-JP'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 当事者情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                当事者情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {case_.client && (
                <div>
                  <h4 className="font-medium text-gray-900">クライアント</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{case_.client.name}</p>
                    <p className="text-sm text-gray-600">
                      {case_.client.type === 'Individual' ? '個人' : '法人'}
                    </p>
                    {case_.client.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {case_.client.email}
                      </p>
                    )}
                    {case_.client.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {case_.client.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {case_.opposingParty && (
                <div>
                  <h4 className="font-medium text-gray-900">相手方</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{case_.opposingParty.name}</p>
                    <p className="text-sm text-gray-600">
                      {case_.opposingParty.type === 'Individual'
                        ? '個人'
                        : '法人'}
                    </p>
                    {case_.opposingParty.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {case_.opposingParty.email}
                      </p>
                    )}
                    {case_.opposingParty.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {case_.opposingParty.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 担当者情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                担当者
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {case_.assignedLawyer ? (
                <div>
                  <h4 className="font-medium text-gray-900">担当弁護士</h4>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">{case_.assignedLawyer.name}</p>
                    {case_.assignedLawyer.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {case_.assignedLawyer.email}
                      </p>
                    )}
                    {case_.assignedLawyer.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {case_.assignedLawyer.phone}
                      </p>
                    )}
                    {case_.assignedLawyer.barNumber && (
                      <p className="text-sm text-gray-600">
                        弁護士番号: {case_.assignedLawyer.barNumber}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  担当弁護士が割り当てられていません
                </p>
              )}

              {case_.lawFirm && (
                <div>
                  <h4 className="font-medium text-gray-900">所属事務所</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{case_.lawFirm.name}</p>
                    {case_.lawFirm.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {case_.lawFirm.email}
                      </p>
                    )}
                    {case_.lawFirm.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {case_.lawFirm.phone}
                      </p>
                    )}
                    {case_.lawFirm.address && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {case_.lawFirm.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 裁判所情報 */}
          {case_.court && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  裁判所
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{case_.court.name}</p>
                  <p className="text-sm text-gray-600">{case_.court.type}</p>
                  {case_.court.jurisdiction && (
                    <p className="text-sm text-gray-600">
                      管轄: {case_.court.jurisdiction}
                    </p>
                  )}
                  {case_.court.address && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {case_.court.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* メタ情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                メタ情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">作成日</span>
                <span className="text-sm">
                  {new Date(case_.createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">更新日</span>
                <span className="text-sm">
                  {new Date(case_.updatedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
