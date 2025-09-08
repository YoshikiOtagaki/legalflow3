// Stats Card Component
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  className?: string;
}

export function StatsCard({
  title,
  value,
  unit,
  change,
  changeType = "neutral",
  icon,
  color = "blue",
  className = "",
}: StatsCardProps) {
  const getColorClasses = () => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-900",
      green: "bg-green-50 border-green-200 text-green-900",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
      red: "bg-red-50 border-red-200 text-red-900",
      purple: "bg-purple-50 border-purple-200 text-purple-900",
      gray: "bg-gray-50 border-gray-200 text-gray-900",
    };
    return colorMap[color];
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "decrease":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      } else if (val % 1 !== 0) {
        return val.toFixed(2);
      }
      return val.toString();
    }
    return val;
  };

  return (
    <div className={`rounded-lg border p-6 ${getColorClasses()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">
              {formatValue(value)}
              {unit && <span className="text-sm font-medium ml-1">{unit}</span>}
            </p>
          </div>
          {change !== undefined && (
            <div className="mt-2 flex items-center">
              {getChangeIcon()}
              <span className={`ml-1 text-sm font-medium ${getChangeColor()}`}>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>
        {icon && <div className="flex-shrink-0 ml-4">{icon}</div>}
      </div>
    </div>
  );
}

// Timesheet Stats Card
export function TimesheetStatsCard({
  totalHours,
  dailyHours,
  weeklyHours,
  monthlyHours,
  className = "",
}: {
  totalHours: number;
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      <StatsCard
        title="Total Hours"
        value={totalHours}
        unit="hrs"
        color="blue"
        icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
      />
      <StatsCard
        title="Today"
        value={dailyHours}
        unit="hrs"
        color="green"
        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
      />
      <StatsCard
        title="This Week"
        value={weeklyHours}
        unit="hrs"
        color="yellow"
        icon={<TrendingUp className="w-6 h-6 text-yellow-600" />}
      />
      <StatsCard
        title="This Month"
        value={monthlyHours}
        unit="hrs"
        color="purple"
        icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
      />
    </div>
  );
}

// Case Stats Card
export function CaseStatsCard({
  totalCases,
  activeCases,
  completedCases,
  newCases,
  className = "",
}: {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  newCases: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      <StatsCard
        title="Total Cases"
        value={totalCases}
        unit="cases"
        color="blue"
        icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
      />
      <StatsCard
        title="Active Cases"
        value={activeCases}
        unit="cases"
        color="green"
        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
      />
      <StatsCard
        title="Completed"
        value={completedCases}
        unit="cases"
        color="yellow"
        icon={<TrendingUp className="w-6 h-6 text-yellow-600" />}
      />
      <StatsCard
        title="New Cases"
        value={newCases}
        unit="cases"
        color="red"
        icon={<TrendingUp className="w-6 h-6 text-red-600" />}
      />
    </div>
  );
}

// Document Stats Card
export function DocumentStatsCard({
  totalDocuments,
  storageUsed,
  className = "",
}: {
  totalDocuments: number;
  storageUsed: number;
  className?: string;
}) {
  const formatStorage = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <StatsCard
        title="Total Documents"
        value={totalDocuments}
        unit="docs"
        color="blue"
        icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
      />
      <StatsCard
        title="Storage Used"
        value={formatStorage(storageUsed)}
        color="green"
        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
      />
    </div>
  );
}

// Notification Stats Card
export function NotificationStatsCard({
  totalNotifications,
  unreadNotifications,
  className = "",
}: {
  totalNotifications: number;
  unreadNotifications: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <StatsCard
        title="Total Notifications"
        value={totalNotifications}
        unit="notifications"
        color="blue"
        icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
      />
      <StatsCard
        title="Unread"
        value={unreadNotifications}
        unit="notifications"
        color="red"
        icon={<TrendingUp className="w-6 h-6 text-red-600" />}
      />
    </div>
  );
}

// System Stats Card
export function SystemStatsCard({
  apiResponseTime,
  errorRate,
  activeUsers,
  totalUsers,
  className = "",
}: {
  apiResponseTime: number;
  errorRate: number;
  activeUsers: number;
  totalUsers: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      <StatsCard
        title="API Response Time"
        value={apiResponseTime}
        unit="ms"
        color="blue"
        icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
      />
      <StatsCard
        title="Error Rate"
        value={errorRate}
        unit="%"
        color="red"
        icon={<TrendingUp className="w-6 h-6 text-red-600" />}
      />
      <StatsCard
        title="Active Users"
        value={activeUsers}
        unit="users"
        color="green"
        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
      />
      <StatsCard
        title="Total Users"
        value={totalUsers}
        unit="users"
        color="gray"
        icon={<TrendingUp className="w-6 h-6 text-gray-600" />}
      />
    </div>
  );
}
