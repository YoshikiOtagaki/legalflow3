"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import {
  TimesheetEntry,
  TimesheetListResponse,
  TimesheetFilters,
  TimesheetSummary,
  Timer,
} from "@/types/timesheet";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function useTimesheet(filters: TimesheetFilters = {}) {
  const { accessToken, user } = useAuthStore();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchEntries = async (newFilters: TimesheetFilters = {}) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/timesheet-entries?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("タイムシートエントリの取得に失敗しました");
      }

      const data: TimesheetListResponse = await response.json();
      setEntries(data.entries);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (
    entryData: Omit<
      TimesheetEntry,
      "id" | "createdAt" | "updatedAt" | "userId"
    >,
  ) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timesheet-entries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "タイムシートエントリの作成に失敗しました",
        );
      }

      const newEntry = await response.json();
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  const updateEntry = async (
    id: string,
    entryData: Partial<
      Omit<TimesheetEntry, "id" | "createdAt" | "updatedAt" | "userId">
    >,
  ) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timesheet-entries/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "タイムシートエントリの更新に失敗しました",
        );
      }

      const updatedEntry = await response.json();
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? updatedEntry : entry)),
      );
      return updatedEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timesheet-entries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "タイムシートエントリの削除に失敗しました",
        );
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [accessToken]);

  return {
    entries,
    loading,
    error,
    pagination,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}

export function useTimer() {
  const { accessToken } = useAuthStore();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [currentTimer, setCurrentTimer] = useState<Timer | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimers = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/timers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("タイマーの取得に失敗しました");
      }

      const data = await response.json();
      setTimers(data.timers || []);

      // 実行中のタイマーを探す
      const runningTimer = data.timers?.find((timer: Timer) => timer.isRunning);
      if (runningTimer) {
        setCurrentTimer(runningTimer);
        setIsRunning(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async (
    caseId: string | null,
    description: string,
    tags: string[] = [],
  ) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timers/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          caseId,
          description,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "タイマーの開始に失敗しました");
      }

      const newTimer = await response.json();
      setCurrentTimer(newTimer);
      setIsRunning(true);
      setTimers((prev) => [newTimer, ...prev]);
      return newTimer;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  const stopTimer = async (timerId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timers/${timerId}/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "タイマーの停止に失敗しました");
      }

      const updatedTimer = await response.json();
      setCurrentTimer(null);
      setIsRunning(false);
      setTimers((prev) =>
        prev.map((timer) => (timer.id === timerId ? updatedTimer : timer)),
      );
      return updatedTimer;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  const pauseTimer = async (timerId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timers/${timerId}/pause`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "タイマーの一時停止に失敗しました",
        );
      }

      const updatedTimer = await response.json();
      setCurrentTimer(updatedTimer);
      setIsRunning(false);
      setTimers((prev) =>
        prev.map((timer) => (timer.id === timerId ? updatedTimer : timer)),
      );
      return updatedTimer;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  const resumeTimer = async (timerId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/timers/${timerId}/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "タイマーの再開に失敗しました");
      }

      const updatedTimer = await response.json();
      setCurrentTimer(updatedTimer);
      setIsRunning(true);
      setTimers((prev) =>
        prev.map((timer) => (timer.id === timerId ? updatedTimer : timer)),
      );
      return updatedTimer;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      throw err;
    }
  };

  useEffect(() => {
    fetchTimers();
  }, [accessToken]);

  return {
    timers,
    currentTimer,
    isRunning,
    loading,
    error,
    fetchTimers,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
  };
}
