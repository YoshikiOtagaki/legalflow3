// Document Detail Component
// Displays detailed information about a single document

"use client";

import React, { useState } from "react";
import {
  useDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "@/hooks/use-documents";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  File,
  Clock,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface DocumentDetailProps {
  documentId: string;
  onEdit?: (document: any) => void;
  onDelete?: (document: any) => void;
  className?: string;
}

export function DocumentDetail({
  documentId,
  onEdit,
  onDelete,
  className = "",
}: DocumentDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const { document, loading, error, refetch } = useDocument(documentId);
  const { updateDocument, isUpdating } = useUpdateDocument();
  const { deleteDocument } = useDeleteDocument();

  const handleDownload = () => {
    if (document?.filePath) {
      // In a real implementation, this would generate a signed URL
      window.open(document.filePath, "_blank");
    }
  };

  const handleEdit = () => {
    if (document) {
      onEdit?.(document);
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    if (
      window.confirm(
        "このドキュメントを削除しますか？この操作は元に戻せません。",
      )
    ) {
      try {
        setIsDeleting(true);
        await deleteDocument(document.id);
        onDelete?.(document);
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("ドキュメントの削除に失敗しました");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "下書き":
        return "bg-gray-100 text-gray-800";
      case "レビュー中":
        return "bg-yellow-100 text-yellow-800";
      case "承認済み":
        return "bg-green-100 text-green-800";
      case "公開済み":
        return "bg-blue-100 text-blue-800";
      case "アーカイブ":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "Word":
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "不明";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refetch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">ドキュメントが見つかりませんでした</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getTypeIcon(document.type?.name || "")}
            </div>
            <div>
              <CardTitle className="text-xl">{document.title}</CardTitle>
              <CardDescription>
                {document.case?.name} - {document.type?.name || "不明なタイプ"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(document.status?.name || "")}>
              {document.status?.name || "未設定"}
            </Badge>
            {document.version > 1 && (
              <Badge variant="outline">v{document.version}</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="metadata">メタデータ</TabsTrigger>
            <TabsTrigger value="history">履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            {document.description && (
              <div>
                <h4 className="font-medium mb-2">説明</h4>
                <p className="text-sm text-gray-600">{document.description}</p>
              </div>
            )}

            {/* File Information */}
            <div>
              <h4 className="font-medium mb-3">ファイル情報</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <File className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">ファイルサイズ:</span>
                    <span className="font-medium">
                      {formatFileSize(document.fileSize)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">MIMEタイプ:</span>
                    <span className="font-medium">
                      {document.mimeType || "不明"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">作成日:</span>
                    <span className="font-medium">
                      {format(
                        new Date(document.createdAt),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: ja },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">更新日:</span>
                    <span className="font-medium">
                      {format(
                        new Date(document.updatedAt),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: ja },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">タグ</h4>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                ダウンロード
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={isUpdating}
              >
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">基本情報</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">ID:</span>
                  <span className="text-sm font-mono">{document.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">バージョン:</span>
                  <span className="text-sm">{document.version}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">最新版:</span>
                  <span className="text-sm">
                    {document.isLatest ? "はい" : "いいえ"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">テンプレート:</span>
                  <span className="text-sm">
                    {document.template?.name || "なし"}
                  </span>
                </div>
              </div>
            </div>

            {document.metadata && Object.keys(document.metadata).length > 0 && (
              <div>
                <h4 className="font-medium mb-3">カスタムメタデータ</h4>
                <div className="space-y-2">
                  {Object.entries(document.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between py-2 border-b"
                    >
                      <span className="text-sm text-gray-600">{key}:</span>
                      <span className="text-sm font-mono">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">作成者・更新者</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 py-2 border-b">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">作成者:</span>
                  <span className="text-sm">
                    {document.createdBy?.name || "不明"}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-2 border-b">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">最終更新者:</span>
                  <span className="text-sm">
                    {document.updatedBy?.name || "不明"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">関連ケース</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {document.case?.name}
                  </span>
                </div>
                {document.case?.caseNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    ケース番号: {document.case.caseNumber}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
