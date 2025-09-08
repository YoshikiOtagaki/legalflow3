// LegalFlow3 - Case Search Component
// Advanced search functionality for cases

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchCases } from "@/hooks/use-cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type Case, type CaseSearchFilter } from "@/lib/api-client";

interface CaseSearchProps {
  onCaseSelect?: (selectedCase: Case) => void;
  onResultsChange?: (results: Case[]) => void;
  className?: string;
}

export default function CaseSearch({
  onCaseSelect,
  onResultsChange,
  className = "",
}: CaseSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<CaseSearchFilter>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Search cases
  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearchCases(filters, {
    limit: 50,
  });

  // Update results when search results change
  useEffect(() => {
    if (searchResults?.cases && onResultsChange) {
      onResultsChange(searchResults.cases);
    }
  }, [searchResults, onResultsChange]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      // Update filters with search query
      const newFilters: CaseSearchFilter = {
        ...filters,
        name: value.trim() || undefined,
      };

      setFilters(newFilters);
    },
    [filters],
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (key: keyof CaseSearchFilter, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === "all" || value === "" ? undefined : value,
      }));
    },
    [],
  );

  // Handle date range change
  const handleDateRangeChange = (
    from: Date | undefined,
    to: Date | undefined,
  ) => {
    setDateRange({ from, to });

    setFilters((prev) => ({
      ...prev,
      dateRange:
        from && to
          ? {
              startDate: format(from, "yyyy-MM-dd"),
              endDate: format(to, "yyyy-MM-dd"),
            }
          : undefined,
    }));
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      const updatedTags = [...selectedTags, newTag.trim()];
      setSelectedTags(updatedTags);
      setNewTag("");

      setFilters((prev) => ({
        ...prev,
        tags: updatedTags,
      }));
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(updatedTags);

    setFilters((prev) => ({
      ...prev,
      tags: updatedTags.length > 0 ? updatedTags : undefined,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({});
    setDateRange({});
    setSelectedTags([]);
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

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof CaseSearchFilter];
    return value !== undefined && value !== null && value !== "";
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            ケース検索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="ケース名またはケース番号で検索..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                フィルター
                {showAdvancedFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">
                  適用中のフィルター:
                </span>
                {filters.name && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    名前: {filters.name}
                    <button
                      onClick={() => handleFilterChange("name", "")}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.status && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    ステータス: {filters.status}
                    <button
                      onClick={() => handleFilterChange("status", "")}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.priority && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    優先度: {filters.priority}
                    <button
                      onClick={() => handleFilterChange("priority", "")}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    タグ: {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  すべてクリア
                </Button>
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">詳細フィルター</h4>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="Active">アクティブ</SelectItem>
                      <SelectItem value="Closed">クローズ</SelectItem>
                      <SelectItem value="Suspended">停止中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <Label>優先度</Label>
                  <Select
                    value={filters.priority || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="優先度を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="Low">低</SelectItem>
                      <SelectItem value="Medium">中</SelectItem>
                      <SelectItem value="High">高</SelectItem>
                      <SelectItem value="Urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>カテゴリ</Label>
                  <Input
                    placeholder="カテゴリIDを入力"
                    value={filters.categoryId || ""}
                    onChange={(e) =>
                      handleFilterChange("categoryId", e.target.value)
                    }
                  />
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label>作成日範囲</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`
                          : "日付範囲を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) =>
                          handleDateRangeChange(range?.from, range?.to)
                        }
                        numberOfMonths={2}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <Label>タグ</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="タグを入力"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            検索結果
            {searchResults && (
              <span className="text-muted-foreground ml-2">
                ({searchResults.totalCount}件)
              </span>
            )}
          </h3>
        </div>

        {/* Loading State */}
        {isLoading && (
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
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || "検索中にエラーが発生しました"}
            </AlertDescription>
          </Alert>
        )}

        {/* No Results */}
        {!isLoading && !error && searchResults?.cases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p>検索結果が見つかりませんでした</p>
              <p className="text-sm">検索条件を変更して再度お試しください</p>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              フィルターをクリア
            </Button>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading &&
          !error &&
          searchResults?.cases &&
          searchResults.cases.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.cases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onCaseSelect?.(caseItem)}
                >
                  <CardHeader className="pb-3">
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
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Status and Priority */}
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                        {caseItem.status || "未設定"}
                      </Badge>
                      {caseItem.priority && (
                        <Badge
                          variant={getPriorityBadgeVariant(caseItem.priority)}
                        >
                          {caseItem.priority}
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {caseItem.tags && caseItem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {caseItem.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
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
                        <p>
                          最終アクセス: {formatDate(caseItem.lastAccessedAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
