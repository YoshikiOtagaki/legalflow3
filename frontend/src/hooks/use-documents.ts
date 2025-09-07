'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  Document,
  DocumentListResponse,
  DocumentFilters,
  DocumentGenerationRequest,
  DocumentGenerationResponse,
} from '@/types/document';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useDocuments(filters: DocumentFilters = {}) {
  const { accessToken } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchDocuments = async (newFilters: DocumentFilters = {}) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`${API_BASE_URL}/documents?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('ドキュメントの取得に失敗しました');
      }

      const data: DocumentListResponse = await response.json();
      setDocuments(data.documents);
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
    fetchDocuments();
  };

  useEffect(() => {
    fetchDocuments();
  }, [accessToken]);

  return {
    documents,
    loading,
    error,
    pagination,
    refetch,
    fetchDocuments,
  };
}

export function useDocument(id: string) {
  const { accessToken } = useAuthStore();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    if (!accessToken || !id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('ドキュメントの取得に失敗しました');
      }

      const data = await response.json();
      setDocument(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [accessToken, id]);

  return {
    document,
    loading,
    error,
    refetch: fetchDocument,
  };
}

export function useDocumentGeneration() {
  const { accessToken } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDocument = async (
    request: DocumentGenerationRequest
  ): Promise<DocumentGenerationResponse> => {
    if (!accessToken) throw new Error('認証が必要です');

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'ドキュメントの生成に失敗しました'
        );
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'エラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateDocument,
    isGenerating,
    error,
  };
}
