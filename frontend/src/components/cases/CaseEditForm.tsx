// LegalFlow3 - Case Edit Form Component
// Form for editing existing cases

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateCase, useCase } from "@/hooks/use-cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIcon,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type UpdateCaseInput, type Case } from "@/lib/api-client";

// Form validation schema
const updateCaseSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "ケース名は必須です")
    .max(100, "ケース名は100文字以内で入力してください"),
  caseNumber: z.string().optional(),
  status: z.enum(["Active", "Closed", "Suspended"]).default("Active"),
  trialLevel: z.string().optional(),
  hourlyRate: z.number().min(0, "時間単価は0以上で入力してください").optional(),
  categoryId: z.string().min(1, "カテゴリは必須です"),
  currentPhaseId: z.string().optional(),
  courtDivisionId: z.string().optional(),
  firstConsultationDate: z.string().optional(),
  engagementDate: z.string().optional(),
  caseClosedDate: z.string().optional(),
  litigationStartDate: z.string().optional(),
  oralArgumentEndDate: z.string().optional(),
  judgmentDate: z.string().optional(),
  judgmentReceivedDate: z.string().optional(),
  hasEngagementLetter: z.boolean().default(false),
  engagementLetterPath: z.string().optional(),
  remarks: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
});

type UpdateCaseFormData = z.infer<typeof updateCaseSchema>;

interface CaseEditFormProps {
  caseId: string;
  onSuccess?: (updatedCase: Case) => void;
  onCancel?: () => void;
  className?: string;
}

export default function CaseEditForm({
  caseId,
  onSuccess,
  onCancel,
  className = "",
}: CaseEditFormProps) {
  const { data: caseData, isLoading, error } = useCase(caseId);
  const updateCaseMutation = useUpdateCase();
  const [newTag, setNewTag] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<UpdateCaseFormData>({
    resolver: zodResolver(updateCaseSchema),
    defaultValues: {
      id: caseId,
      status: "Active",
      priority: "Medium",
      hasEngagementLetter: false,
      tags: [],
    },
  });

  const watchedValues = watch();

  // Update form when case data loads
  useEffect(() => {
    if (caseData?.case) {
      const caseItem = caseData.case;
      reset({
        id: caseItem.id,
        name: caseItem.name,
        caseNumber: caseItem.caseNumber || "",
        status: (caseItem.status as any) || "Active",
        trialLevel: caseItem.trialLevel || "",
        hourlyRate: caseItem.hourlyRate || 0,
        categoryId: caseItem.categoryId,
        currentPhaseId: caseItem.currentPhaseId || "",
        courtDivisionId: caseItem.courtDivisionId || "",
        firstConsultationDate: caseItem.firstConsultationDate || "",
        engagementDate: caseItem.engagementDate || "",
        caseClosedDate: caseItem.caseClosedDate || "",
        litigationStartDate: caseItem.litigationStartDate || "",
        oralArgumentEndDate: caseItem.oralArgumentEndDate || "",
        judgmentDate: caseItem.judgmentDate || "",
        judgmentReceivedDate: caseItem.judgmentReceivedDate || "",
        hasEngagementLetter: caseItem.hasEngagementLetter || false,
        engagementLetterPath: caseItem.engagementLetterPath || "",
        remarks: caseItem.remarks || "",
        tags: caseItem.tags || [],
        priority: (caseItem.priority as any) || "Medium",
      });
    }
  }, [caseData, reset]);

  // Handle form submission
  const onSubmit = async (data: UpdateCaseFormData) => {
    try {
      const result = await updateCaseMutation.mutateAsync(data);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Failed to update case:", error);
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (newTag.trim() && !watchedValues.tags.includes(newTag.trim())) {
      setValue("tags", [...watchedValues.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      watchedValues.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  // Handle date selection
  const handleDateSelect = (field: string, date: Date | undefined) => {
    if (date) {
      setValue(field as keyof UpdateCaseFormData, format(date, "yyyy-MM-dd"));
    }
    setDatePickerOpen(null);
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy年MM月dd日", { locale: ja });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !caseData?.case) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "ケースの詳細を取得できませんでした"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>ケースを編集</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本情報</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">ケース名 *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="ケース名を入力してください"
                    className={cn(errors.name && "border-red-500")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caseNumber">ケース番号</Label>
                  <Input
                    id="caseNumber"
                    {...register("caseNumber")}
                    placeholder="ケース番号を入力してください"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">ステータス</Label>
                  <Select
                    value={watchedValues.status}
                    onValueChange={(value) => setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">アクティブ</SelectItem>
                      <SelectItem value="Closed">クローズ</SelectItem>
                      <SelectItem value="Suspended">停止中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">優先度</Label>
                  <Select
                    value={watchedValues.priority}
                    onValueChange={(value) =>
                      setValue("priority", value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="優先度を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">低</SelectItem>
                      <SelectItem value="Medium">中</SelectItem>
                      <SelectItem value="High">高</SelectItem>
                      <SelectItem value="Urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">カテゴリ *</Label>
                  <Input
                    id="categoryId"
                    {...register("categoryId")}
                    placeholder="カテゴリIDを入力してください"
                    className={cn(errors.categoryId && "border-red-500")}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-red-500">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">時間単価</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    {...register("hourlyRate", { valueAsNumber: true })}
                    placeholder="時間単価を入力してください"
                    className={cn(errors.hourlyRate && "border-red-500")}
                  />
                  {errors.hourlyRate && (
                    <p className="text-sm text-red-500">
                      {errors.hourlyRate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">日付情報</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>初回相談日</Label>
                  <Popover
                    open={datePickerOpen === "firstConsultationDate"}
                    onOpenChange={(open) =>
                      setDatePickerOpen(open ? "firstConsultationDate" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.firstConsultationDate
                          ? formatDateForDisplay(
                              watchedValues.firstConsultationDate,
                            )
                          : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          watchedValues.firstConsultationDate
                            ? new Date(watchedValues.firstConsultationDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          handleDateSelect("firstConsultationDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>受任日</Label>
                  <Popover
                    open={datePickerOpen === "engagementDate"}
                    onOpenChange={(open) =>
                      setDatePickerOpen(open ? "engagementDate" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.engagementDate
                          ? formatDateForDisplay(watchedValues.engagementDate)
                          : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          watchedValues.engagementDate
                            ? new Date(watchedValues.engagementDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          handleDateSelect("engagementDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>事件終了日</Label>
                  <Popover
                    open={datePickerOpen === "caseClosedDate"}
                    onOpenChange={(open) =>
                      setDatePickerOpen(open ? "caseClosedDate" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.caseClosedDate
                          ? formatDateForDisplay(watchedValues.caseClosedDate)
                          : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          watchedValues.caseClosedDate
                            ? new Date(watchedValues.caseClosedDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          handleDateSelect("caseClosedDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>判決日</Label>
                  <Popover
                    open={datePickerOpen === "judgmentDate"}
                    onOpenChange={(open) =>
                      setDatePickerOpen(open ? "judgmentDate" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.judgmentDate
                          ? formatDateForDisplay(watchedValues.judgmentDate)
                          : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          watchedValues.judgmentDate
                            ? new Date(watchedValues.judgmentDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          handleDateSelect("judgmentDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">タグ</h3>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="タグを入力してください"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {watchedValues.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">備考</Label>
              <Textarea
                id="remarks"
                {...register("remarks")}
                placeholder="備考を入力してください"
                rows={4}
              />
            </div>

            {/* Error Alert */}
            {updateCaseMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {updateCaseMutation.error.message ||
                    "ケースの更新に失敗しました"}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {updateCaseMutation.isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ケースが正常に更新されました
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  キャンセル
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "更新中..." : "更新を保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
