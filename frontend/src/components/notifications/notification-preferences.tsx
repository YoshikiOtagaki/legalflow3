"use client";

import { useState, ElementType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Smartphone, Calendar } from "lucide-react";

interface NotificationPreferences {
  email: {
    enabled: boolean;
    caseUpdates: boolean;
    deadlineReminders: boolean;
    documentUploads: boolean;
    timesheetReminders: boolean;
    systemAlerts: boolean;
  };
  sms: {
    enabled: boolean;
    caseUpdates: boolean;
    deadlineReminders: boolean;
    urgentAlerts: boolean;
  };
  push: {
    enabled: boolean;
    caseUpdates: boolean;
    deadlineReminders: boolean;
    documentUploads: boolean;
    timesheetReminders: boolean;
  };
  line: {
    enabled: boolean;
    caseUpdates: boolean;
    deadlineReminders: boolean;
    documentUploads: boolean;
    timesheetReminders: boolean;
  };
  inApp: {
    enabled: boolean;
    caseUpdates: boolean;
    deadlineReminders: boolean;
    documentUploads: boolean;
    timesheetReminders: boolean;
    systemAlerts: boolean;
  };
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      caseUpdates: true,
      deadlineReminders: true,
      documentUploads: false,
      timesheetReminders: true,
      systemAlerts: true,
    },
    sms: {
      enabled: false,
      caseUpdates: false,
      deadlineReminders: true,
      urgentAlerts: true,
    },
    push: {
      enabled: true,
      caseUpdates: true,
      deadlineReminders: true,
      documentUploads: false,
      timesheetReminders: true,
    },
    line: {
      enabled: false,
      caseUpdates: false,
      deadlineReminders: false,
      documentUploads: false,
      timesheetReminders: false,
    },
    inApp: {
      enabled: true,
      caseUpdates: true,
      deadlineReminders: true,
      documentUploads: true,
      timesheetReminders: true,
      systemAlerts: true,
    },
    frequency: {
      immediate: true,
      daily: false,
      weekly: false,
      monthly: false,
    },
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: API呼び出し
      console.log("Saving preferences:", preferences);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // シミュレーション
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (path: string, value: boolean | string) => {
    setPreferences((prev) => {
      const [key1, key2] = path.split(".") as [
        keyof NotificationPreferences,
        string | undefined,
      ];
      if (key2) {
        return {
          ...prev,
          [key1]: {
            ...prev[key1],
            [key2]: value,
          },
        };
      }
      return {
        ...prev,
        [key1]: value,
      };
    });
  };

  const NotificationChannel = ({
    title,
    description,
    icon: Icon,
    channel,
    enabled,
  }: {
    title: string;
    description: string;
    icon: ElementType;
    channel: keyof NotificationPreferences;
    enabled: boolean;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) =>
              updatePreference(`${channel}.enabled`, checked)
            }
          />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(preferences[channel]).map(([key, value]) => {
              if (key === "enabled") return null;
              return (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`${channel}-${key}`} className="text-sm">
                    {key === "caseUpdates" && "ケース更新"}
                    {key === "deadlineReminders" && "期限リマインダー"}
                    {key === "documentUploads" && "ドキュメントアップロード"}
                    {key === "timesheetReminders" && "タイムシートリマインダー"}
                    {key === "systemAlerts" && "システムアラート"}
                    {key === "urgentAlerts" && "緊急アラート"}
                  </Label>
                  <Switch
                    id={`${channel}-${key}`}
                    checked={value as boolean}
                    onCheckedChange={(checked) =>
                      updatePreference(`${channel}.${key}`, checked)
                    }
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">通知設定</h2>
          <p className="text-gray-600">通知の種類と頻度を設定できます</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "保存中..." : "設定を保存"}
        </Button>
      </div>

      {/* 通知チャンネル */}
      <div className="space-y-4">
        <NotificationChannel
          title="メール通知"
          description="重要な更新をメールで受け取ります"
          icon={Mail}
          channel="email"
          enabled={preferences.email.enabled}
        />

        <NotificationChannel
          title="SMS通知"
          description="緊急の通知をSMSで受け取ります"
          icon={Smartphone}
          channel="sms"
          enabled={preferences.sms.enabled}
        />

        <NotificationChannel
          title="プッシュ通知"
          description="ブラウザのプッシュ通知を受け取ります"
          icon={Bell}
          channel="push"
          enabled={preferences.push.enabled}
        />

        <NotificationChannel
          title="LINE通知"
          description="LINEメッセージで通知を受け取ります"
          icon={MessageSquare}
          channel="line"
          enabled={preferences.line.enabled}
        />

        <NotificationChannel
          title="アプリ内通知"
          description="アプリ内で通知を表示します"
          icon={Bell}
          channel="inApp"
          enabled={preferences.inApp.enabled}
        />
      </div>

      <Separator />

      {/* 通知頻度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>通知頻度</span>
          </CardTitle>
          <CardDescription>
            通知を受け取る頻度を設定してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(preferences.frequency).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`frequency-${key}`} className="text-sm">
                  {key === "immediate" && "即座"}
                  {key === "daily" && "毎日"}
                  {key === "weekly" && "毎週"}
                  {key === "monthly" && "毎月"}
                </Label>
                <Switch
                  id={`frequency-${key}`}
                  checked={value as boolean}
                  onCheckedChange={(checked) =>
                    updatePreference(`frequency.${key}`, checked)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 静音時間 */}
      <Card>
        <CardHeader>
          <CardTitle>静音時間</CardTitle>
          <CardDescription>
            指定した時間帯は通知を受け取りません
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours-enabled" className="text-sm">
              静音時間を有効にする
            </Label>
            <Switch
              id="quiet-hours-enabled"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) =>
                updatePreference("quietHours.enabled", checked)
              }
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-sm">
                  開始時間
                </Label>
                <input
                  id="start-time"
                  type="time"
                  value={preferences.quietHours.startTime}
                  onChange={(e) =>
                    updatePreference("quietHours.startTime", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-sm">
                  終了時間
                </Label>
                <input
                  id="end-time"
                  type="time"
                  value={preferences.quietHours.endTime}
                  onChange={(e) =>
                    updatePreference("quietHours.endTime", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
