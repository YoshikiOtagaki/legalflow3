'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Case, CaseListResponse, CaseFilters } from '@/types/case';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useCases(filters: CaseFilters = {}) {
  const { accessToken } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchCases = async (newFilters: CaseFilters = {}) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/cases?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('ケースの取得に失敗しました');
      }

      const data: CaseListResponse = await response.json();
      setCases(data.cases);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCases();
  };

  useEffect(() => {
    fetchCases();
  }, [accessToken]);

  return {
    cases,
    loading,
    error,
    pagination,
    refetch,
    fetchCases,
  };
}

export function useCase(id: string) {
  const { accessToken } = useAuthStore();
  const [case_, setCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = async () => {
    if (!accessToken || !id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cases/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('ケースの取得に失敗しました');
      }

      const data = await response.json();
      setCase(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCase();
    }
  }, [accessToken, id]);

  return {
    case: case_,
    loading,
    error,
    refetch: fetchCase,
  };
}
