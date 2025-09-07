"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { DashboardData } from "@/types/dashboard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function useDashboard() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // モックデータを生成
  const generateMockData = (): DashboardData => {
    return {
      stats: {
        totalCases: 12,
        activeCases: 8,
        completedCases: 4,
        totalClients: 15,
        totalDocuments: 45,
        totalHours: 120.5,
        billableHours: 95.2,
        totalRevenue: 2500000,
        monthlyRevenue: 450000,
        averageCaseDuration: 45,
        casesThisMonth: 3,
        casesLastMonth: 2,
        revenueGrowth: 12.5,
        caseGrowth: 8.3,
      },
      caseStatusDistribution: [
        { status: "進行中", count: 8, percentage: 66.7, color: "#3B82F6" },
        { status: "完了", count: 4, percentage: 33.3, color: "#10B981" },
      ],
      caseCategoryDistribution: [
        { category: "民事", count: 6, percentage: 50, color: "#8B5CF6" },
        { category: "刑事", count: 4, percentage: 33.3, color: "#F59E0B" },
        { category: "商事", count: 2, percentage: 16.7, color: "#EF4444" },
      ],
      revenueByMonth: [
        { month: "1月", revenue: 200000, cases: 2 },
        { month: "2月", revenue: 350000, cases: 3 },
        { month: "3月", revenue: 450000, cases: 4 },
        { month: "4月", revenue: 380000, cases: 3 },
        { month: "5月", revenue: 420000, cases: 3 },
        { month: "6月", revenue: 450000, cases: 3 },
      ],
      timeTrackingStats: {
        totalHours: 120.5,
        billableHours: 95.2,
        nonBillableHours: 25.3,
        averageDailyHours: 6.0,
        topCases: [
          {
            caseId: "1",
            caseTitle: "A社との契約紛争",
            hours: 25.5,
            percentage: 21.2,
          },
          {
            caseId: "2",
            caseTitle: "B氏の離婚調停",
            hours: 18.3,
            percentage: 15.2,
          },
          {
            caseId: "3",
            caseTitle: "C社の労働問題",
            hours: 15.8,
            percentage: 13.1,
          },
        ],
      },
      recentActivities: [
        {
          id: "1",
          type: "case_created",
          title: "新しいケースを作成",
          description: "A社との契約紛争ケースを開始しました",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          userId: "user1",
          userName: "田中太郎",
          caseId: "1",
          caseTitle: "A社との契約紛争",
        },
        {
          id: "2",
          type: "document_created",
          title: "書類を作成",
          description: "答弁書を作成しました",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          userId: "user1",
          userName: "田中太郎",
          caseId: "1",
          caseTitle: "A社との契約紛争",
        },
      ],
      upcomingDeadlines: [
        {
          id: "1",
          title: "答弁書提出期限",
          description: "A社との契約紛争の答弁書を提出する必要があります",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          caseId: "1",
          caseTitle: "A社との契約紛争",
          priority: "high",
          isOverdue: false,
        },
        {
          id: "2",
          title: "調停期日",
          description: "B氏の離婚調停の期日です",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          caseId: "2",
          caseTitle: "B氏の離婚調停",
          priority: "medium",
          isOverdue: false,
        },
      ],
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 現在はモックデータを使用
      // 実際のAPIが実装されたら、以下のコメントアウトを解除
      /*
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('ダッシュボードデータの取得に失敗しました')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      */

      // モックデータを使用
      const mockData = generateMockData();
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    stats: data?.stats || {
      totalCases: 0,
      activeCases: 0,
      completedCases: 0,
      totalClients: 0,
      totalDocuments: 0,
      totalHours: 0,
      billableHours: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageCaseDuration: 0,
      casesThisMonth: 0,
      casesLastMonth: 0,
      revenueGrowth: 0,
      caseGrowth: 0,
    },
    caseStatusDistribution: data?.caseStatusDistribution || [],
    caseCategoryDistribution: data?.caseCategoryDistribution || [],
    revenueByMonth: data?.revenueByMonth || [],
    timeTrackingStats: data?.timeTrackingStats || {
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      averageDailyHours: 0,
      topCases: [],
    },
    recentActivities: data?.recentActivities || [],
    upcomingDeadlines: data?.upcomingDeadlines || [],
    isLoading: loading,
    error,
    refreshData,
  };
}
