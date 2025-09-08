// Document Form Component
// Handles document creation and editing with validation

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateDocument,
  useUpdateDocument,
  useDocumentTypes,
  useDocumentStatuses,
} from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Upload, X } from "lucide-react";

// Form validation schema
const documentSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(255, "タイトルは255文字以内で入力してください"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional(),
  typeId: z.string().min(1, "ドキュメントタイプは必須です"),
  statusId: z.string().min(1, "ステータスは必須です"),
  caseId: z.string().min(1, "ケースは必須です"),
  templateId: z.string().optional(),
  tags: z
    .array(z.string())
    .max(10, "タグは最大10個まで設定できます")
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  caseId?: string;
  document?: {
    id: string;
    title: string;
    description?: string;
    typeId: string;
    statusId: string;
    caseId: string;
    templateId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  };
  onSuccess?: (document: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function DocumentForm({
  caseId,
  document,
  onSuccess,
  onCancel,
  className = "",
}: DocumentFormProps) {
  const [tagInput, setTagInput] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>(
    {},
  );
  const [metadataKey, setMetadataKey] = useState("");
  const [metadataValue, setMetadataValue] = useState("");

  const {
    createDocument,
    isCreating,
    error: createError,
  } = useCreateDocument();
  const {
    updateDocument,
    isUpdating,
    error: updateError,
  } = useUpdateDocument();
  const { types, loading: typesLoading } = useDocumentTypes();
  const { statuses, loading: statusesLoading } = useDocumentStatuses();

  const isEditing = !!document;
  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: document?.title || "",
      description: document?.description || "",
      typeId: document?.typeId || "",
      statusId: document?.statusId || "",
      caseId: document?.caseId || caseId || "",
      templateId: document?.templateId || "",
      tags: document?.tags || [],
      metadata: document?.metadata || {},
    },
  });

  const watchedTags = watch("tags") || [];

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      reset({
        title: document.title,
        description: document.description || "",
        typeId: document.typeId,
        statusId: document.statusId,
        caseId: document.caseId,
        templateId: document.templateId || "",
        tags: document.tags || [],
        metadata: document.metadata || {},
      });
      setCustomMetadata(document.metadata || {});
    }
  }, [document, reset]);

  const onSubmit = async (data: DocumentFormData) => {
    try {
      let result;

      if (isEditing) {
        result = await updateDocument({
          id: document.id,
          title: data.title,
          description: data.description,
          statusId: data.statusId,
          tags: data.tags,
          metadata: { ...data.metadata, ...customMetadata },
        });
      } else {
        result = await createDocument({
          title: data.title,
          description: data.description,
          typeId: data.typeId,
          statusId: data.statusId,
          caseId: data.caseId,
          templateId: data.templateId,
          tags: data.tags,
          metadata: { ...data.metadata, ...customMetadata },
        });
      }

      onSuccess?.(result);
    } catch (err) {
      console.error("Error submitting document form:", err);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && watchedTags.length < 10) {
      const newTags = [...watchedTags, tagInput.trim()];
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter((tag) => tag !== tagToRemove);
    setValue("tags", newTags);
  };

  const handleAddMetadata = () => {
    if (metadataKey.trim() && metadataValue.trim()) {
      setCustomMetadata((prev) => ({
        ...prev,
        [metadataKey.trim()]: metadataValue.trim(),
      }));
      setMetadataKey("");
      setMetadataValue("");
    }
  };

  const handleRemoveMetadata = (key: string) => {
    setCustomMetadata((prev) => {
      const newMetadata = { ...prev };
      delete newMetadata[key];
      return newMetadata;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        e.target === document.querySelector('input[placeholder="タグを入力"]')
      ) {
        handleAddTag();
      } else if (
        e.target === document.querySelector('input[placeholder="キー"]')
      ) {
        handleAddMetadata();
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isEditing ? "ドキュメント編集" : "ドキュメント作成"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "ドキュメントの情報を編集します"
            : "新しいドキュメントを作成します"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              タイトル <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              {...register("title")}
              placeholder="ドキュメントのタイトルを入力"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              説明
            </label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="ドキュメントの説明を入力"
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Document Type */}
          {!isEditing && (
            <div className="space-y-2">
              <label htmlFor="typeId" className="text-sm font-medium">
                ドキュメントタイプ <span className="text-red-500">*</span>
              </label>
              <Select
                value={watch("typeId")}
                onValueChange={(value) => setValue("typeId", value)}
              >
                <SelectTrigger
                  className={errors.typeId ? "border-red-500" : ""}
                >
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
              {errors.typeId && (
                <p className="text-sm text-red-500">{errors.typeId.message}</p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="statusId" className="text-sm font-medium">
              ステータス <span className="text-red-500">*</span>
            </label>
            <Select
              value={watch("statusId")}
              onValueChange={(value) => setValue("statusId", value)}
            >
              <SelectTrigger
                className={errors.statusId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                {statusesLoading ? (
                  <SelectItem value="" disabled>
                    読み込み中...
                  </SelectItem>
                ) : (
                  statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        {status.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                        )}
                        {status.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.statusId && (
              <p className="text-sm text-red-500">{errors.statusId.message}</p>
            )}
          </div>

          {/* Case ID (if not provided) */}
          {!caseId && !document && (
            <div className="space-y-2">
              <label htmlFor="caseId" className="text-sm font-medium">
                ケース <span className="text-red-500">*</span>
              </label>
              <Input
                id="caseId"
                {...register("caseId")}
                placeholder="ケースIDを入力"
                className={errors.caseId ? "border-red-500" : ""}
              />
              {errors.caseId && (
                <p className="text-sm text-red-500">{errors.caseId.message}</p>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">タグ</label>
            <div className="flex gap-2">
              <Input
                placeholder="タグを入力"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={watchedTags.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || watchedTags.length >= 10}
              >
                追加
              </Button>
            </div>
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-sm text-red-500">{errors.tags.message}</p>
            )}
          </div>

          {/* Custom Metadata */}
          <div className="space-y-2">
            <label className="text-sm font-medium">カスタムメタデータ</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="キー"
                value={metadataKey}
                onChange={(e) => setMetadataKey(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Input
                placeholder="値"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddMetadata}
              disabled={!metadataKey.trim() || !metadataValue.trim()}
              size="sm"
            >
              メタデータ追加
            </Button>
            {Object.keys(customMetadata).length > 0 && (
              <div className="space-y-2">
                {Object.entries(customMetadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">
                      <strong>{key}:</strong> {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMetadata(key)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "更新" : "作成"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
