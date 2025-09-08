// Document Upload Component
// Handles file upload with drag and drop functionality

"use client";

import React, { useState, useCallback } from "react";
import { useDocumentUpload, useDocumentTypes } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  File,
  FileText,
  Image,
  Video,
  Archive,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DocumentUploadProps {
  caseId: string;
  onSuccess?: (document: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  document?: any;
}

export function DocumentUpload({
  caseId,
  onSuccess,
  onCancel,
  className = "",
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const {
    uploadDocument,
    isUploading,
    error: uploadError,
  } = useDocumentUpload();
  const { types, loading: typesLoading } = useDocumentTypes();

  const getFileIcon = (file: File) => {
    const mimeType = file.type;
    if (mimeType.startsWith("image/"))
      return <Image className="h-8 w-8 text-blue-500" />;
    if (mimeType.startsWith("video/"))
      return <Video className="h-8 w-8 text-purple-500" />;
    if (mimeType.includes("pdf"))
      return <FileText className="h-8 w-8 text-red-500" />;
    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return <Archive className="h-8 w-8 text-orange-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending" as const,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending" as const,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "uploading", progress: 0 }
            : f,
        ),
      );

      const document = await uploadDocument(
        uploadedFile.file,
        caseId,
        selectedTypeId,
      );

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "success", progress: 100, document }
            : f,
        ),
      );

      onSuccess?.(document);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "アップロードに失敗しました",
              }
            : f,
        ),
      );
    }
  };

  const uploadAllFiles = async () => {
    if (!selectedTypeId) {
      alert("ドキュメントタイプを選択してください");
      return;
    }

    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
        return (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "success":
        return "アップロード完了";
      case "error":
        return "エラー";
      case "uploading":
        return "アップロード中...";
      default:
        return "待機中";
    }
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const hasFiles = files.length > 0;
  const canUpload = pendingFiles.length > 0 && selectedTypeId;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          ドキュメントアップロード
        </CardTitle>
        <CardDescription>
          ファイルをドラッグ&ドロップまたはクリックしてアップロード
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Document Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ドキュメントタイプ <span className="text-red-500">*</span>
          </label>
          <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
            <SelectTrigger>
              <SelectValue placeholder="ドキュメントタイプを選択" />
            </SelectTrigger>
            <SelectContent>
              {typesLoading ? (
                <SelectItem value="" disabled>
                  読み込み中...
                </SelectItem>
              ) : (
                types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            ファイルをドラッグ&ドロップ
          </p>
          <p className="text-sm text-gray-500 mb-4">または</p>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>ファイルを選択</span>
            </Button>
            <Input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.zip,.rar"
            />
          </label>
          <p className="text-xs text-gray-400 mt-2">
            対応形式: PDF, Word, テキスト, 画像, 動画, アーカイブ
          </p>
        </div>

        {/* File List */}
        {hasFiles && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">アップロードファイル</h3>
              <div className="flex gap-2">
                <Button
                  onClick={uploadAllFiles}
                  disabled={!canUpload || isUploading}
                  size="sm"
                >
                  {isUploading ? "アップロード中..." : "すべてアップロード"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                  size="sm"
                >
                  クリア
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">{getFileIcon(file.file)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="mt-2" />
                    )}
                    {file.status === "error" && file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <span className="text-xs text-gray-500">
                      {getStatusText(file.status)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            キャンセル
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
