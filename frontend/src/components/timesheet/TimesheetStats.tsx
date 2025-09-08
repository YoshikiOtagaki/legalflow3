import React, { useState, useEffect } from "react";
import { useTimesheetStats, TimesheetStats } from "../../hooks/use-timesheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Alert, AlertDescription } from "../ui/Alert";
import {
  Loader2,
  Clock,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";

interface TimesheetStatsProps {
  userId?: string;
  caseId?: string;
  startDate?: string;
  endDate?: string;
  className?: string;
}

export const TimesheetStats: React.FC<TimesheetStatsProps> = ({
  userId,
  caseId,
  startDate,
  endDate,
  className = "",
}) => {
  const { stats, loading, error, fetchStats } = useTimesheetStats();
  const [period, setPeriod] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM"
  >("CUSTOM");
  const [customStartDate, setCustomStartDate] = useState(startDate || "");
  const [customEndDate, setCustomEndDate] = useState(endDate || "");

  // 初期データ読み込み
  useEffect(() => {
    loadStats();
  }, [userId, caseId, period]);

  const loadStats = async () => {
    try {
      const filter: any = {
        userId,
        caseId,
        period,
      };

      if (period === "CUSTOM") {
        if (customStartDate) filter.startDate = customStartDate;
        if (customEndDate) filter.endDate = customEndDate;
      }

      await fetchStats(filter);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as any);
  };

  const handleCustomDateChange = () => {
    if (period === "CUSTOM") {
      loadStats();
    }
  };

  const formatHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}時間${minutes}分`;
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  if (loading && !stats) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">統計を読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タイムシート統計</h1>
          <p className="text-gray-600">作業時間の分析とレポート</p>
        </div>
      </div>

      {/* 期間選択 */}
      <Card>
        <CardHeader>
          <CardTitle>期間選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">期間</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">今日</SelectItem>
                  <SelectItem value="WEEKLY">今週</SelectItem>
                  <SelectItem value="MONTHLY">今月</SelectItem>
                  <SelectItem value="YEARLY">今年</SelectItem>
                  <SelectItem value="CUSTOM">カスタム</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "CUSTOM" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">開始日</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">終了日</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleCustomDateChange}>更新</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 統計データ */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 総時間 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総作業時間</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(stats.totalHours)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions}セッション
              </p>
            </CardContent>
          </Card>

          {/* 日別時間 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日の時間</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(stats.dailyHours)}
              </div>
              <p className="text-xs text-muted-foreground">日別平均</p>
            </CardContent>
          </Card>

          {/* 週別時間 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今週の時間</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(stats.weeklyHours)}
              </div>
              <p className="text-xs text-muted-foreground">週別平均</p>
            </CardContent>
          </Card>

          {/* 月別時間 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の時間</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(stats.monthlyHours)}
              </div>
              <p className="text-xs text-muted-foreground">月別平均</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 詳細統計 */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ケース別時間 */}
          {stats.caseHours && Object.keys(stats.caseHours).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  ケース別時間
                </CardTitle>
                <CardDescription>各ケースの作業時間分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.caseHours)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([caseId, hours]) => (
                      <div
                        key={caseId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">{caseId}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${formatPercentage(hours, stats.totalHours)}`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-sm text-gray-600">
                          {formatHours(hours)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* タスク別時間 */}
          {stats.taskHours && Object.keys(stats.taskHours).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  タスク別時間
                </CardTitle>
                <CardDescription>各タスクの作業時間分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.taskHours)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([taskId, hours]) => (
                      <div
                        key={taskId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">{taskId}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${formatPercentage(hours, stats.totalHours)}`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-sm text-gray-600">
                          {formatHours(hours)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 平均セッション時間 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>セッション統計</CardTitle>
            <CardDescription>作業セッションの詳細情報</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatHours(stats.averageSessionLength)}
                </div>
                <div className="text-sm text-gray-600">平均セッション時間</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <div className="text-sm text-gray-600">総セッション数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.totalSessions > 0
                    ? Math.round(
                        (stats.totalHours / stats.totalSessions) * 100,
                      ) / 100
                    : 0}
                  時間
                </div>
                <div className="text-sm text-gray-600">
                  セッションあたり平均
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* データなし表示 */}
      {!loading && !stats && (
        <div className="text-center py-8">
          <p className="text-gray-500">統計データが見つかりませんでした</p>
        </div>
      )}
    </div>
  );
};
