'use client';

import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/use-timesheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, FileText, Tag } from 'lucide-react';

interface TimerWidgetProps {
  caseId?: string;
  onTimerStop?: (timerId: string) => void;
}

export function TimerWidget({ caseId, onTimerStop }: TimerWidgetProps) {
  const {
    currentTimer,
    isRunning,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
  } = useTimer();

  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // 経過時間の計算
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && currentTimer) {
      interval = setInterval(() => {
        const startTime = new Date(currentTimer.startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000 / 60); // 分単位
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentTimer]);

  const handleStart = async () => {
    if (!description.trim()) {
      alert('作業内容を入力してください');
      return;
    }

    try {
      await startTimer(caseId || null, description, tags);
      setDescription('');
      setTags([]);
    } catch (error) {
      console.error('タイマー開始エラー:', error);
      alert('タイマーの開始に失敗しました');
    }
  };

  const handleStop = async () => {
    if (!currentTimer) return;

    try {
      await stopTimer(currentTimer.id);
      onTimerStop?.(currentTimer.id);
    } catch (error) {
      console.error('タイマー停止エラー:', error);
      alert('タイマーの停止に失敗しました');
    }
  };

  const handlePause = async () => {
    if (!currentTimer) return;

    try {
      if (isRunning) {
        await pauseTimer(currentTimer.id);
      } else {
        await resumeTimer(currentTimer.id);
      }
    } catch (error) {
      console.error('タイマー操作エラー:', error);
      alert('タイマーの操作に失敗しました');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          タイマー
        </CardTitle>
        <CardDescription>作業時間を記録します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTimer ? (
          // 実行中のタイマー
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {currentTimer.description}
              </p>
              {currentTimer.caseId && (
                <p className="text-xs text-gray-500">
                  ケース: {currentTimer.caseId}
                </p>
              )}
            </div>

            {currentTimer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentTimer.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handlePause}
                variant="outline"
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    一時停止
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    再開
                  </>
                )}
              </Button>
              <Button
                onClick={handleStop}
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                停止
              </Button>
            </div>
          </div>
        ) : (
          // 新しいタイマー
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">作業内容 *</Label>
              <Input
                id="description"
                placeholder="作業内容を入力してください"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">タグ</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="タグを入力"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleStart}
              disabled={!description.trim()}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              タイマー開始
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
