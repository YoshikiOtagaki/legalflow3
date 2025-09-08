// LegalFlow3 - Case Create Form Component
// Form for creating new cases

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCase } from "@/hooks/use-cases";
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
import {
  Calendar as CalendarIcon,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type CreateCaseInput } from "@/lib/api-client";

// Form validation schema
const createCaseSchema = z.object({
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

type CreateCaseFormData = z.infer<typeof createCaseSchema>;

interface CaseCreateFormProps {
  onSuccess?: (createdCase: any) => void;
  onCancel?: () => void;
  className?: string;
}

export default function CaseCreateForm({
  onSuccess,
  onCancel,
  className = "",
}: CaseCreateFormProps) {
  const createCaseMutation = useCreateCase();
  const [newTag, setNewTag] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateCaseFormData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      status: "Active",
      priority: "Medium",
      hasEngagementLetter: false,
      tags: [],
    },
  });

  const watchedValues = watch();

  // Handle form submission
  const onSubmit = async (data: CreateCaseFormData) => {
    try {
      const result = await createCaseMutation.mutateAsync(data);
      if (onSuccess) {
        onSuccess(result);
      }
      reset();
    } catch (error) {
      console.error("Failed to create case:", error);
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
      setValue(field as keyof CreateCaseFormData, format(date, "yyyy-MM-dd"));
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

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>新しいケースを作成</CardTitle>
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
            {createCaseMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createCaseMutation.error.message ||
                    "ケースの作成に失敗しました"}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {createCaseMutation.isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ケースが正常に作成されました
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "ケースを作成"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
