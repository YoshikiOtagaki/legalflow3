'use client';

import { useState } from 'react';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentFilters } from '@/types/document';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  File,
} from 'lucide-react';

interface DocumentListProps {
  caseId?: string;
  onDocumentSelect?: (documentId: string) => void;
  onCreateDocument?: () => void;
  onUploadDocument?: () => void;
  onGenerateDocument?: () => void;
}

export function DocumentList({
  caseId,
  onDocumentSelect,
  onCreateDocument,
  onUploadDocument,
  onGenerateDocument,
}: DocumentListProps) {
  const [filters, setFilters] = useState<DocumentFilters>({
    caseId,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { documents, loading, error, pagination, fetchDocuments } =
    useDocuments(filters);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const newFilters = { ...filters, search: value, page: 1 };
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '下書き':
        return 'bg-gray-100 text-gray-800';
      case 'レビュー中':
        return 'bg-yellow-100 text-yellow-800';
      case '承認済み':
        return 'bg-green-100 text-green-800';
      case '公開済み':
        return 'bg-blue-100 text-blue-800';
      case 'アーカイブ':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <File className="h-4 w-4" />;
      case 'Word':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '不明';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

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
        <Button onClick={() => fetchDocuments()}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ドキュメント一覧</h2>
        <div className="flex gap-2">
          <Button onClick={onGenerateDocument} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            生成
          </Button>
          <Button onClick={onUploadDocument} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            アップロード
          </Button>
          <Button onClick={onCreateDocument}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
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
                  placeholder="タイトル、説明で検索..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ステータス</label>
              <select
                value={filters.statusId || ''}
                onChange={e => handleFilterChange('statusId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">すべて</option>
                <option value="1">下書き</option>
                <option value="2">レビュー中</option>
                <option value="3">承認済み</option>
                <option value="4">公開済み</option>
                <option value="5">アーカイブ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">並び順</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={e => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="createdAt-desc">作成日（新しい順）</option>
                <option value="createdAt-asc">作成日（古い順）</option>
                <option value="title-asc">タイトル（A-Z）</option>
                <option value="title-desc">タイトル（Z-A）</option>
                <option value="updatedAt-desc">更新日（新しい順）</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ドキュメント一覧 */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                ドキュメントが見つかりませんでした
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onCreateDocument}>新規作成</Button>
                <Button onClick={onUploadDocument} variant="outline">
                  アップロード
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          documents.map(document => (
            <Card
              key={document.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(document.type?.name || '')}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {document.title}
                      </CardTitle>
                      <CardDescription>
                        {document.case?.title} -{' '}
                        {document.type?.name || '不明なタイプ'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getStatusColor(document.status?.name || '')}
                    >
                      {document.status?.name || '未設定'}
                    </Badge>
                    {document.version > 1 && (
                      <Badge variant="outline">v{document.version}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {document.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {document.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">作成者</p>
                    <p className="font-medium">
                      {document.createdBy?.name || '不明'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ファイルサイズ</p>
                    <p className="font-medium">
                      {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">作成日</p>
                    <p className="font-medium">
                      {new Date(document.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">更新日</p>
                    <p className="font-medium">
                      {new Date(document.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>

                {document.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {document.isLatest ? '最新版' : '旧版'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDocumentSelect?.(document.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
  );
}
