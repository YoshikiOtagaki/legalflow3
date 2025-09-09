// Dashboard Page
"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Bell,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useDashboardStats } from "../../hooks/use-dashboard";
import { useAuth } from "../../hooks/use-auth";
import {
  TimesheetStatsCard,
  CaseStatsCard,
  DocumentStatsCard,
  NotificationStatsCard,
  SystemStatsCard,
} from "../../components/dashboard/StatsCard";
import {
  TimesheetChart,
  CaseStatusChart,
  DocumentTypeChart,
  NotificationTrendChart,
} from "../../components/dashboard/Chart";
import {
  ReportGenerator,
  QuickReportButtons,
} from "../../components/dashboard/ReportGenerator";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { stats, loading, error, refetch } = useDashboardStats(user?.id || "");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in
          </h1>
          <p className="text-gray-600">
            You need to be logged in to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error loading dashboard
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No data available
          </h1>
          <p className="text-gray-600">
            There&apos;s no data to display on the dashboard yet.
          </p>
        </div>
      </div>
    );
  }

  // Sample data for charts (in a real app, this would come from the API)
  const timesheetChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Hours Worked",
        data: [8, 7.5, 8.5, 9, 7, 4, 2],
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3b82f6",
      },
    ],
  };

  const caseStatusChartData = {
    labels: ["Active", "Completed", "On Hold", "Cancelled"],
    datasets: [
      {
        data: [
          stats?.cases?.activeCases || 0,
          stats?.cases?.completedCases || 0,
          2,
          1,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
      },
    ],
  };

  const documentTypeChartData = {
    labels: ["Contracts", "Legal Briefs", "Correspondence", "Other"],
    datasets: [
      {
        data: [15, 8, 12, 5],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
      },
    ],
  };

  const notificationTrendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Notifications Sent",
        data: [25, 30, 22, 35],
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) =>
                  setSelectedPeriod(
                    e.target.value as "daily" | "weekly" | "monthly",
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Timesheet Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Timesheet
                </h2>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <TimesheetStatsCard
                totalHours={stats?.timesheet?.totalHours || 0}
                dailyHours={stats?.timesheet?.dailyHours || 0}
                weeklyHours={stats?.timesheet?.weeklyHours || 0}
                monthlyHours={stats?.timesheet?.monthlyHours || 0}
              />
            </div>

            {/* Case Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Cases</h2>
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <CaseStatsCard
                totalCases={stats?.cases?.totalCases || 0}
                activeCases={stats?.cases?.activeCases || 0}
                completedCases={stats?.cases?.completedCases || 0}
                newCases={stats?.cases?.newCases || 0}
              />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Timesheet Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Weekly Hours Trend
              </h3>
              <div className="h-64">
                <TimesheetChart data={timesheetChartData} />
              </div>
            </div>

            {/* Case Status Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Case Status Distribution
              </h3>
              <div className="h-64">
                <CaseStatusChart data={caseStatusChartData} />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Documents
                </h2>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <DocumentStatsCard
                totalDocuments={stats?.documents?.totalDocuments || 0}
                storageUsed={stats?.documents?.storageUsed || 0}
              />
            </div>

            {/* Notification Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <NotificationStatsCard
                totalNotifications={
                  stats?.notifications?.totalNotifications || 0
                }
                unreadNotifications={
                  stats?.notifications?.unreadNotifications || 0
                }
              />
            </div>

            {/* System Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">System</h2>
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <SystemStatsCard
                apiResponseTime={stats?.system?.apiResponseTime || 0}
                errorRate={stats?.system?.errorRate || 0}
                activeUsers={stats?.system?.activeUsers || 0}
                totalUsers={stats?.system?.totalUsers || 0}
              />
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Document Type Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Document Types
              </h3>
              <div className="h-64">
                <DocumentTypeChart data={documentTypeChartData} />
              </div>
            </div>

            {/* Notification Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notification Trends
              </h3>
              <div className="h-64">
                <NotificationTrendChart data={notificationTrendData} />
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Reports
              </h3>
              <QuickReportButtons userId={user.id} />
            </div>

            {/* Report Generator */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Custom Report
              </h3>
              <ReportGenerator userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
