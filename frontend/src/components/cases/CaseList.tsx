// LegalFlow3 - Case List Component
// Displays a list of cases with filtering and pagination

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Case, type ListCasesParams } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";

interface CaseListProps {
  onCaseSelect?: (selectedCase: Case) => void;
  onCreateCase?: () => void;
  showCreateButton?: boolean;
  className?: string;
}

export default function CaseList({
  onCaseSelect,
  onCreateCase,
  showCreateButton = true,
  className = "",
}: CaseListProps) {
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [filters, setFilters] = useState<ListCasesParams>({
    limit: 20,
    status: undefined,
    categoryId: undefined,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [cases, setCases] = useState<Case[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cases
  const fetchCases = useCallback(
    async (params: ListCasesParams, reset = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.listCases(params);

        if (reset) {
          setCases(response.cases);
        } else {
          setCases((prev) => [...prev, ...response.cases]);
        }

        setNextToken(response.nextToken);
        setTotalCount(response.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch cases");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchCases(filters, true);
  }, [filters, fetchCases]);

  // Handle search
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      // Reset pagination when searching
      setNextToken(undefined);
      setCases([]);

      if (term.trim()) {
        // Use search API for text search
        api
          .searchCases({ name: term }, { limit: filters.limit })
          .then((response) => {
            setCases(response.cases);
            setNextToken(response.nextToken);
            setTotalCount(response.totalCount);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Search failed");
          });
      } else {
        // Use regular list API
        fetchCases(filters, true);
      }
    },
    [filters, fetchCases],
  );

  // Handle filter change
  const handleFilterChange = (
    key: keyof ListCasesParams,
    value: string | undefined,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
    setNextToken(undefined);
    setCases([]);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (nextToken && !isLoading) {
      fetchCases({ ...filters, nextToken }, false);
    }
  };

  // Handle case click
  const handleCaseClick = (caseItem: Case) => {
    if (onCaseSelect) {
      onCaseSelect(caseItem);
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
      return format(new Date(dateString), "yyyy/MM/dd", { locale: ja });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ケース一覧</h2>
          <p className="text-muted-foreground">
            {totalCount > 0 ? `${totalCount}件のケース` : "ケースがありません"}
          </p>
        </div>
        {showCreateButton && (
          <Button onClick={onCreateCase} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新しいケース
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ケース名またはケース番号で検索..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="Active">アクティブ</SelectItem>
              <SelectItem value="Closed">クローズ</SelectItem>
              <SelectItem value="Suspended">停止中</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cases Grid */}
      {isLoading && cases.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <p>ケースが見つかりませんでした</p>
            <p className="text-sm">
              新しいケースを作成するか、検索条件を変更してください
            </p>
          </div>
          {showCreateButton && (
            <Button onClick={onCreateCase} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新しいケースを作成
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCaseClick(caseItem)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {caseItem.name}
                    </CardTitle>
                    {caseItem.caseNumber && (
                      <p className="text-sm text-muted-foreground">
                        {caseItem.caseNumber}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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
                </div>

                {/* Tags */}
                {caseItem.tags && caseItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {caseItem.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {caseItem.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{caseItem.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                {caseItem.stats && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {caseItem.stats.completedTasks}/
                        {caseItem.stats.totalTasks}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.round(caseItem.stats.totalTimeSpent / 60)}h
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{caseItem.stats.totalParties}</span>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-muted-foreground">
                  <p>作成日: {formatDate(caseItem.createdAt)}</p>
                  {caseItem.lastAccessedAt && (
                    <p>最終アクセス: {formatDate(caseItem.lastAccessedAt)}</p>
                  )}
                </div>

                {/* User Role */}
                {caseItem.userRole && (
                  <div className="text-xs">
                    <Badge variant="secondary">
                      {caseItem.userRole === "Lead"
                        ? "リード"
                        : "コラボレーター"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {nextToken && (
        <div className="flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                読み込み中...
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                さらに読み込む
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
