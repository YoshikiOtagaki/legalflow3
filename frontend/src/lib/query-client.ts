'use client';

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // 認証エラーの場合はリトライしない
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // その他のエラーは最大3回リトライ
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// クエリキーの定数
export const QUERY_KEYS = {
  // 認証
  AUTH: {
    CURRENT_USER: ['auth', 'currentUser'] as const,
  },

  // ケース
  CASES: {
    ALL: ['cases'] as const,
    LIST: (params?: any) => ['cases', 'list', params] as const,
    DETAIL: (id: string) => ['cases', 'detail', id] as const,
  },

  // 当事者
  PARTIES: {
    ALL: ['parties'] as const,
    LIST: (params?: any) => ['parties', 'list', params] as const,
    DETAIL: (id: string) => ['parties', 'detail', id] as const,
  },

  // ドキュメント
  DOCUMENTS: {
    ALL: ['documents'] as const,
    LIST: (params?: any) => ['documents', 'list', params] as const,
    DETAIL: (id: string) => ['documents', 'detail', id] as const,
  },

  // タイムシート
  TIMESHEETS: {
    ALL: ['timesheets'] as const,
    LIST: (params?: any) => ['timesheets', 'list', params] as const,
    DETAIL: (id: string) => ['timesheets', 'detail', id] as const,
  },

  // 通知
  NOTIFICATIONS: {
    ALL: ['notifications'] as const,
    LIST: (params?: any) => ['notifications', 'list', params] as const,
    UNREAD_COUNT: ['notifications', 'unreadCount'] as const,
  },

  // ダッシュボード
  DASHBOARD: {
    DATA: ['dashboard', 'data'] as const,
    STATS: ['dashboard', 'stats'] as const,
  },
} as const;
