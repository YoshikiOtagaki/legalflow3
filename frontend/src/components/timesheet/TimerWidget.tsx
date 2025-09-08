import React, { useState, useEffect } from "react";
import { useTimer, Timer } from "../../hooks/use-timesheet";
import { Button } from "../ui/Button";
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
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  User,
  Building,
} from "lucide-react";

interface TimerWidgetProps {
  userId: string;
  caseId?: string;
  taskId?: string;
  onTimerUpdate?: (timer: Timer | null) => void;
  className?: string;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  userId,
  caseId,
  taskId,
  onTimerUpdate,
  className = "",
}) => {
  const {
    timer,
    loading,
    error,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    getActiveTimer,
  } = useTimer();
  const [description, setDescription] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // アクティブタイマーを取得
  useEffect(() => {
    getActiveTimer(userId);
  }, [userId, getActiveTimer]);

  // タイマーの状態を監視
  useEffect(() => {
    if (timer) {
      setIsRunning(timer.status === "RUNNING");
      onTimerUpdate?.(timer);
    } else {
      setIsRunning(false);
      onTimerUpdate?.(null);
    }
  }, [timer, onTimerUpdate]);

  // 経過時間の計算と更新
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer && timer.status === "RUNNING") {
      interval = setInterval(() => {
        const now = new Date();
        const startTime = new Date(timer.startTime);
        const currentSessionTime = now.getTime() - startTime.getTime();
        const totalTime = timer.totalTime + currentSessionTime;
        setElapsedTime(Math.floor(totalTime / 1000));
      }, 1000);
    } else if (timer && timer.status === "PAUSED") {
      setElapsedTime(Math.floor(timer.totalTime / 1000));
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer]);

  // 時間フォーマット
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
  };

  // タイマー開始
  const handleStart = async () => {
    if (!description.trim()) {
      alert("作業内容を入力してください");
      return;
    }

    try {
      await startTimer({
        caseId,
        taskId,
        description: description.trim(),
      });
      setDescription("");
    } catch (err) {
      console.error("Failed to start timer:", err);
    }
  };

  // タイマー停止
  const handleStop = async () => {
    if (!timer) return;

    try {
      await stopTimer(timer.id, true);
    } catch (err) {
      console.error("Failed to stop timer:", err);
    }
  };

  // タイマー一時停止
  const handlePause = async () => {
    if (!timer) return;

    try {
      await pauseTimer(timer.id);
    } catch (err) {
      console.error("Failed to pause timer:", err);
    }
  };

  // タイマー再開
  const handleResume = async () => {
    if (!timer) return;

    try {
      await resumeTimer(timer.id);
    } catch (err) {
      console.error("Failed to resume timer:", err);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          タイマー
        </CardTitle>
        <CardDescription>作業時間を記録します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 現在のタイマー情報 */}
        {timer && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={timer.status === "RUNNING" ? "default" : "secondary"}
                >
                  {timer.status === "RUNNING"
                    ? "実行中"
                    : timer.status === "PAUSED"
                      ? "一時停止"
                      : "停止"}
                </Badge>
                {timer.caseId && (
                  <Badge variant="outline" className="flex items-center">
                    <Building className="mr-1 h-3 w-3" />
                    ケース
                  </Badge>
                )}
                {timer.taskId && (
                  <Badge variant="outline" className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    タスク
                  </Badge>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  {timer.user?.name || "Unknown User"}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {timer.description}
              </div>
            </div>
          </div>
        )}

        {/* タイマーコントロール */}
        <div className="space-y-3">
          {!timer ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">作業内容</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="作業内容を入力してください"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={loading || !description.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    開始中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    タイマー開始
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              {timer.status === "RUNNING" ? (
                <>
                  <Button
                    onClick={handlePause}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    一時停止
                  </Button>
                  <Button
                    onClick={handleStop}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    停止
                  </Button>
                </>
              ) : timer.status === "PAUSED" ? (
                <>
                  <Button
                    onClick={handleResume}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    再開
                  </Button>
                  <Button
                    onClick={handleStop}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    停止
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* タイマー詳細情報 */}
        {timer && (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>開始時刻:</span>
              <span>{new Date(timer.startTime).toLocaleString("ja-JP")}</span>
            </div>
            {timer.pausedAt && (
              <div className="flex justify-between">
                <span>一時停止時刻:</span>
                <span>{new Date(timer.pausedAt).toLocaleString("ja-JP")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>総一時停止時間:</span>
              <span>
                {formatTime(Math.floor(timer.totalPausedTime / 1000))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>最終更新:</span>
              <span>{new Date(timer.lastUpdated).toLocaleString("ja-JP")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
