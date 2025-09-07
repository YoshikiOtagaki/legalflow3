"use client";

import { useState } from "react";
import { useCases } from "@/hooks/use-cases";
import { CaseFilters } from "@/types/case";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface CaseListProps {
  onCaseSelect?: (caseId: string) => void;
  onCreateCase?: () => void;
}

export function CaseList({ onCaseSelect, onCreateCase }: CaseListProps) {
  const [filters, setFilters] = useState<CaseFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { cases, loading, error, pagination, fetchCases } = useCases(filters);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const newFilters = { ...filters, search: value, page: 1 };
    setFilters(newFilters);
    fetchCases(newFilters);
  };

  const handleFilterChange = (key: keyof CaseFilters, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchCases(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchCases(newFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "進行中":
        return "bg-blue-100 text-blue-800";
      case "完了":
        return "bg-green-100 text-green-800";
      case "保留":
        return "bg-yellow-100 text-yellow-800";
      case "キャンセル":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "高":
        return "bg-red-100 text-red-800";
      case "中":
        return "bg-yellow-100 text-yellow-800";
      case "低":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <Button onClick={() => fetchCases()}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ケース一覧</h2>
        <Button onClick={onCreateCase} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新しいケース
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ケース名、番号で検索..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ステータス</label>
              <Select
                value={filters.statusId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("statusId", value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="1">進行中</SelectItem>
                  <SelectItem value="2">完了</SelectItem>
                  <SelectItem value="3">保留</SelectItem>
                  <SelectItem value="4">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">優先度</label>
              <Select
                value={filters.priorityId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("priorityId", value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="1">高</SelectItem>
                  <SelectItem value="2">中</SelectItem>
                  <SelectItem value="3">低</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">並び順</label>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-");
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortOrder", sortOrder as "asc" | "desc");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="並び順" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">
                    作成日（新しい順）
                  </SelectItem>
                  <SelectItem value="createdAt-asc">
                    作成日（古い順）
                  </SelectItem>
                  <SelectItem value="title-asc">タイトル（A-Z）</SelectItem>
                  <SelectItem value="title-desc">タイトル（Z-A）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ケース一覧 */}
      <div className="grid gap-4">
        {cases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">ケースが見つかりませんでした</p>
              <Button onClick={onCreateCase}>新しいケースを作成</Button>
            </CardContent>
          </Card>
        ) : (
          cases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{case_.title}</CardTitle>
                    <CardDescription>
                      ケース番号: {case_.caseNumber}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(case_.status?.name || "")}>
                      {case_.status?.name || "未設定"}
                    </Badge>
                    <Badge
                      className={getPriorityColor(case_.priority?.name || "")}
                    >
                      {case_.priority?.name || "未設定"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">カテゴリ</p>
                    <p className="font-medium">
                      {case_.category?.name || "未設定"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">担当弁護士</p>
                    <p className="font-medium">
                      {case_.assignedLawyer?.name || "未割り当て"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">クライアント</p>
                    <p className="font-medium">
                      {case_.client?.name || "未設定"}
                    </p>
                  </div>
                </div>

                {case_.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {case_.description}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    作成日:{" "}
                    {new Date(case_.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCaseSelect?.(case_.id)}
                    >
                      <Eye className="h-4 w-4" />
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
