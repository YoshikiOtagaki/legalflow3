// Notification Statistics Component
import React, { useState, useEffect } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Archive,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useNotificationStats } from "../../hooks/use-notifications";
import { NotificationStats as NotificationStatsType } from "../../types/notification";

interface NotificationStatsProps {
  userId: string;
  className?: string;
}

export function NotificationStats({
  userId,
  className = "",
}: NotificationStatsProps) {
  const { stats, loading, error, fetchStats } = useNotificationStats(userId);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">(
    "7d",
  );

  // Refresh stats when period changes
  useEffect(() => {
    fetchStats();
  }, [selectedPeriod, fetchStats]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading statistics</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  // Calculate percentages
  const readPercentage =
    stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;
  const unreadPercentage =
    stats.total > 0 ? Math.round((stats.unread / stats.total) * 100) : 0;
  const archivedPercentage =
    stats.total > 0 ? Math.round((stats.archived / stats.total) * 100) : 0;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Notification Statistics
          </h2>
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(e.target.value as "7d" | "30d" | "90d")
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Notifications */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          {/* Unread Notifications */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeOff className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Unread</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {stats.unread}
                </p>
              </div>
            </div>
          </div>

          {/* Read Notifications */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Read</p>
                <p className="text-2xl font-semibold text-green-900">
                  {stats.read}
                </p>
              </div>
            </div>
          </div>

          {/* Archived Notifications */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Archive className="w-8 h-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.archived}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Read Rate
              </span>
              <span className="text-sm text-gray-500">{readPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${readPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Unread Rate
              </span>
              <span className="text-sm text-gray-500">{unreadPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${unreadPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Archive Rate
              </span>
              <span className="text-sm text-gray-500">
                {archivedPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${archivedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">By Type</h3>
          <div className="space-y-3">
            {stats.byType.map((type) => (
              <div
                key={type.typeId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-700">{type.typeName}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {type.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown by Priority */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            By Priority
          </h3>
          <div className="space-y-3">
            {stats.byPriority.map((priority) => (
              <div
                key={priority.priorityId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      priority.priorityId === "urgent"
                        ? "bg-red-500"
                        : priority.priorityId === "high"
                          ? "bg-orange-500"
                          : priority.priorityId === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm text-gray-700">
                    {priority.priorityName}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {priority.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown by Channel */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">By Channel</h3>
          <div className="space-y-3">
            {stats.byChannel.map((channel) => (
              <div
                key={channel.channel}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-sm text-gray-700 capitalize">
                    {channel.channel}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {channel.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
