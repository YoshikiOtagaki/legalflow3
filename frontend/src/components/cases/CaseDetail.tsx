// LegalFlow3 - Case Detail Component
// Displays detailed information about a single case

"use client";

import React, { useState, useEffect } from "react";
import { useCase, useUpdateCase, useDeleteCase } from "@/hooks/use-cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { type Case } from "@/lib/api-client";

interface CaseDetailProps {
  caseId: string;
  onEdit?: (selectedCase: Case) => void;
  onDelete?: (selectedCase: Case) => void;
  className?: string;
}

export default function CaseDetail({
  caseId,
  onEdit,
  onDelete,
  className = "",
}: CaseDetailProps) {
  const { data: caseData, isLoading, error } = useCase(caseId);
  const updateCaseMutation = useUpdateCase();
  const deleteCaseMutation = useDeleteCase();

  const [activeTab, setActiveTab] = useState("overview");

  const caseItem = caseData?.case;

  // Handle edit
  const handleEdit = () => {
    if (caseItem && onEdit) {
      onEdit(caseItem);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (caseItem && onDelete) {
      try {
        await deleteCaseMutation.mutateAsync(caseId);
        onDelete(caseItem);
      } catch (error) {
        console.error("Failed to delete case:", error);
      }
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Closed":
        return "secondary";
      case "Suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority?: string) => {
    switch (priority) {
      case "Urgent":
        return "destructive";
      case "High":
        return "default";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy年MM月dd日", { locale: ja });
    } catch {
      return dateString;
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy年MM月dd日 HH:mm", {
        locale: ja,
      });
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
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !caseItem) {
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{caseItem.name}</CardTitle>
              {caseItem.caseNumber && (
                <p className="text-muted-foreground">
                  ケース番号: {caseItem.caseNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(caseItem.status)}>
              {caseItem.status || "未設定"}
            </Badge>
            {caseItem.priority && (
              <Badge variant={getPriorityBadgeVariant(caseItem.priority)}>
                {caseItem.priority}
              </Badge>
            )}
            {caseItem.userRole && (
              <Badge variant="secondary">
                {caseItem.userRole === "Lead" ? "リード" : "コラボレーター"}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {caseItem.tags && caseItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caseItem.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="parties">当事者</TabsTrigger>
              <TabsTrigger value="tasks">タスク</TabsTrigger>
              <TabsTrigger value="timesheet">タイムシート</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">基本情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        作成日
                      </label>
                      <p className="text-sm">
                        {formatDate(caseItem.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        更新日
                      </label>
                      <p className="text-sm">
                        {formatDate(caseItem.updatedAt)}
                      </p>
                    </div>
                    {caseItem.engagementDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          受任日
                        </label>
                        <p className="text-sm">
                          {formatDate(caseItem.engagementDate)}
                        </p>
                      </div>
                    )}
                    {caseItem.caseClosedDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          事件終了日
                        </label>
                        <p className="text-sm">
                          {formatDate(caseItem.caseClosedDate)}
                        </p>
                      </div>
                    )}
                    {caseItem.hourlyRate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          時間単価
                        </label>
                        <p className="text-sm">
                          ¥{caseItem.hourlyRate.toLocaleString()}/時間
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                {caseItem.stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">統計情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          タスク
                        </span>
                        <span className="text-sm font-medium">
                          {caseItem.stats.completedTasks}/
                          {caseItem.stats.totalTasks}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          作業時間
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(caseItem.stats.totalTimeSpent / 60)}時間
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          当事者数
                        </span>
                        <span className="text-sm font-medium">
                          {caseItem.stats.totalParties}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          メモ数
                        </span>
                        <span className="text-sm font-medium">
                          {caseItem.stats.totalMemos}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Remarks */}
              {caseItem.remarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">備考</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {caseItem.remarks}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Custom Properties */}
              {caseItem.customProperties && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      カスタムプロパティ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(caseItem.customProperties, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Parties Tab */}
            <TabsContent value="parties" className="space-y-4">
              {caseItem.parties && caseItem.parties.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {caseItem.parties.map((party, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {party.partyDetails?.isCorporation ? (
                            <Building className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <CardTitle className="text-lg">
                            {party.partyDetails?.isCorporation
                              ? party.partyDetails.corporateProfile?.name ||
                                "法人"
                              : `${party.partyDetails?.individualProfile?.lastName || ""} ${party.partyDetails?.individualProfile?.firstName || ""}`.trim() ||
                                "個人"}
                          </CardTitle>
                        </div>
                        <Badge variant="outline">{party.role}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {party.partyDetails?.individualProfile && (
                          <>
                            {party.partyDetails.individualProfile.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {party.partyDetails.individualProfile.email}
                                </span>
                              </div>
                            )}
                            {party.partyDetails.individualProfile.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {party.partyDetails.individualProfile.phone}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {party.partyDetails?.corporateProfile && (
                          <>
                            {party.partyDetails.corporateProfile.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {party.partyDetails.corporateProfile.email}
                                </span>
                              </div>
                            )}
                            {party.partyDetails.corporateProfile.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {party.partyDetails.corporateProfile.phone}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>当事者が登録されていません</p>
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              {caseItem.tasks && caseItem.tasks.length > 0 ? (
                <div className="space-y-4">
                  {caseItem.tasks.map((task, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle
                                className={`h-4 w-4 ${
                                  task.isCompleted
                                    ? "text-green-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={`text-sm ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}
                              >
                                {task.description}
                              </span>
                            </div>
                            {task.category && (
                              <Badge variant="outline" className="text-xs">
                                {task.category}
                              </Badge>
                            )}
                            {task.priority && (
                              <Badge
                                variant={getPriorityBadgeVariant(task.priority)}
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {task.dueDate && (
                              <p>期限: {formatDate(task.dueDate)}</p>
                            )}
                            <p>作成: {formatDate(task.createdAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>タスクが登録されていません</p>
                </div>
              )}
            </TabsContent>

            {/* Timesheet Tab */}
            <TabsContent value="timesheet" className="space-y-4">
              {caseItem.timesheetEntries &&
              caseItem.timesheetEntries.length > 0 ? (
                <div className="space-y-4">
                  {caseItem.timesheetEntries.map((entry, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {entry.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {Math.round((entry.duration || 0) / 60)}時間
                                </span>
                              </div>
                              {entry.category && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.category}
                                </Badge>
                              )}
                              {entry.billable && (
                                <Badge variant="default" className="text-xs">
                                  請求可能
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{formatDateTime(entry.startTime)}</p>
                            {entry.endTime && (
                              <p>〜 {formatDateTime(entry.endTime)}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p>タイムシートエントリがありません</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
