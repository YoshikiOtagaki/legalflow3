import React, { useState, useEffect } from "react";
import { useTimesheet, TimesheetEntry } from "../../hooks/use-timesheet";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Alert, AlertDescription } from "../ui/Alert";
import {
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  User,
  Building,
} from "lucide-react";

interface TimesheetListProps {
  userId?: string;
  caseId?: string;
  taskId?: string;
  onView?: (entry: TimesheetEntry) => void;
  onEdit?: (entry: TimesheetEntry) => void;
  onDelete?: (entry: TimesheetEntry) => void;
  onCreate?: () => void;
  className?: string;
}

export const TimesheetList: React.FC<TimesheetListProps> = ({
  userId,
  caseId,
  taskId,
  onView,
  onEdit,
  onDelete,
  onCreate,
  className = "",
}) => {
  const { entries, loading, error, fetchEntries, deleteEntry } = useTimesheet();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    billable: "",
  });
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadEntries();
  }, [userId, caseId, taskId]);

  const loadEntries = async (loadMore = false) => {
    try {
      const result = await fetchEntries({
        userId,
        caseId,
        taskId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 20,
        nextToken: loadMore ? nextToken : undefined,
      });

      setNextToken(result.nextToken);
      setHasMore(!!result.nextToken);
    } catch (err) {
      console.error("Error loading timesheet entries:", err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearch = () => {
    loadEntries();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      category: "",
      billable: "",
    });
    loadEntries();
  };

  const handleLoadMore = () => {
    if (hasMore) {
      loadEntries(true);
    }
  };

  const handleDelete = async (entry: TimesheetEntry) => {
    if (window.confirm("このタイムシートエントリを削除しますか？")) {
      try {
        await deleteEntry(entry.id);
      } catch (err) {
        console.error("Failed to delete entry:", err);
      }
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}時間${mins}分`;
    } else {
      return `${mins}分`;
    }
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  const getCategoryLabel = (category?: string): string => {
    switch (category) {
      case "RESEARCH":
        return "調査";
      case "DRAFTING":
        return "書類作成";
      case "MEETING":
        return "会議";
      case "COURT":
        return "法廷";
      case "ADMINISTRATIVE":
        return "事務作業";
      case "OTHER":
        return "その他";
      default:
        return "未分類";
    }
  };

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case "RESEARCH":
        return "bg-blue-100 text-blue-800";
      case "DRAFTING":
        return "bg-green-100 text-green-800";
      case "MEETING":
        return "bg-purple-100 text-purple-800";
      case "COURT":
        return "bg-red-100 text-red-800";
      case "ADMINISTRATIVE":
        return "bg-gray-100 text-gray-800";
      case "OTHER":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タイムシート</h1>
          <p className="text-gray-600">作業時間の記録と管理</p>
        </div>
        <Button onClick={onCreate} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* フィルタ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            検索・フィルタ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">開始日</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">終了日</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="RESEARCH">調査</SelectItem>
                  <SelectItem value="DRAFTING">書類作成</SelectItem>
                  <SelectItem value="MEETING">会議</SelectItem>
                  <SelectItem value="COURT">法廷</SelectItem>
                  <SelectItem value="ADMINISTRATIVE">事務作業</SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">請求可能</label>
              <Select
                value={filters.billable}
                onValueChange={(value) => handleFilterChange("billable", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="true">請求可能</SelectItem>
                  <SelectItem value="false">請求不可</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  検索中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  検索
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              クリア
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* タイムシートエントリ一覧 */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-lg">
                      {entry.description || "作業内容なし"}
                    </h3>
                    {entry.category && (
                      <Badge className={getCategoryColor(entry.category)}>
                        {getCategoryLabel(entry.category)}
                      </Badge>
                    )}
                    {entry.billable && (
                      <Badge variant="default">請求可能</Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>{formatDuration(entry.duration)}</span>
                    </div>

                    {entry.case && (
                      <div className="flex items-center">
                        <Building className="mr-1 h-4 w-4" />
                        <span>{entry.case.name}</span>
                      </div>
                    )}

                    {entry.user && (
                      <div className="flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        <span>{entry.user.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span>
                        {formatDateTime(entry.startTime)} 〜{" "}
                        {formatDateTime(entry.endTime)}
                      </span>
                    </div>
                  </div>

                  {entry.hourlyRate && (
                    <div className="text-sm text-gray-500">
                      時給: ¥{entry.hourlyRate.toLocaleString()}
                      {entry.totalAmount && (
                        <span className="ml-2">
                          総額: ¥{entry.totalAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView?.(entry)}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit?.(entry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(entry)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ローディング表示 */}
      {loading && entries.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      )}

      {/* データなし表示 */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            タイムシートエントリが見つかりませんでした
          </p>
        </div>
      )}

      {/* さらに読み込みボタン */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                読み込み中...
              </>
            ) : (
              "さらに読み込み"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
