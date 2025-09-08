// Document Management Hooks
// Provides comprehensive document management functionality

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Document,
  DocumentListResponse,
  DocumentFilters,
  DocumentGenerationRequest,
  DocumentGenerationResponse,
  DocumentTemplate,
  DocumentType,
  DocumentStatus,
} from "@/types/document";

// Use Amplify Gen2 API instead of direct API calls
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Document management hook
export function useDocuments(filters: DocumentFilters = {}) {
  const { isAuthenticated } = useAuthStore();
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
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(`${API_BASE_URL}/documents?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("ドキュメントの取得に失敗しました");
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
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDocuments();
  };

  useEffect(() => {
    fetchDocuments();
  }, [isAuthenticated]);

  return {
    documents,
    loading,
    error,
    pagination,
    refetch,
    fetchDocuments,
  };
}

// Single document hook
export function useDocument(id: string) {
  const { isAuthenticated } = useAuthStore();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    if (!isAuthenticated || !id) return;

    setLoading(true);
    setError(null);

    try {
      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("ドキュメントの取得に失敗しました");
      }

      const data = await response.json();
      setDocument(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [isAuthenticated, id]);

  return {
    document,
    loading,
    error,
    refetch: fetchDocument,
  };
}

// Document creation hook
export function useCreateDocument() {
  const { isAuthenticated } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDocument = async (input: {
    title: string;
    description?: string;
    typeId: string;
    statusId: string;
    caseId: string;
    templateId?: string;
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<Document> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsCreating(true);
    setError(null);

    try {
      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "ドキュメントの作成に失敗しました",
        );
      }

      const data = await response.json();
      return data.document;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createDocument,
    isCreating,
    error,
  };
}

// Document update hook
export function useUpdateDocument() {
  const { isAuthenticated } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDocument = async (input: {
    id: string;
    title?: string;
    description?: string;
    statusId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<Document> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsUpdating(true);
    setError(null);

    try {
      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(`${API_BASE_URL}/documents/${input.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "ドキュメントの更新に失敗しました",
        );
      }

      const data = await response.json();
      return data.document;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateDocument,
    isUpdating,
    error,
  };
}

// Document deletion hook
export function useDeleteDocument() {
  const { isAuthenticated } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = async (id: string): Promise<boolean> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsDeleting(true);
    setError(null);

    try {
      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
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
          errorData.message || "ドキュメントの削除に失敗しました",
        );
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteDocument,
    isDeleting,
    error,
  };
}

// Document generation hook
export function useDocumentGeneration() {
  const { isAuthenticated } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDocument = async (
    request: DocumentGenerationRequest,
  ): Promise<DocumentGenerationResponse> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsGenerating(true);
    setError(null);

    try {
      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(`${API_BASE_URL}/documents/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "ドキュメントの生成に失敗しました",
        );
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "エラーが発生しました";
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

// Document upload hook
export function useDocumentUpload() {
  const { isAuthenticated } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (
    file: File,
    caseId: string,
    typeId: string,
  ): Promise<Document> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsUploading(true);
    setError(null);

    try {
      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);
      formData.append("typeId", typeId);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "ドキュメントのアップロードに失敗しました",
        );
      }

      const data = await response.json();
      return data.document;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    error,
  };
}

// Document templates hook
export function useDocumentTemplates() {
  const { isAuthenticated } = useAuthStore();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (category?: string, typeId?: string) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append("category", category);
      if (typeId) queryParams.append("typeId", typeId);

      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(
        `${API_BASE_URL}/document-templates?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("テンプレートの取得に失敗しました");
      }

      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [isAuthenticated]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  };
}

// Document types hook
export function useDocumentTypes() {
  const { isAuthenticated } = useAuthStore();
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async (category?: string) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append("category", category);

      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(
        `${API_BASE_URL}/document-types?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("ドキュメントタイプの取得に失敗しました");
      }

      const data = await response.json();
      setTypes(data.types);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [isAuthenticated]);

  return {
    types,
    loading,
    error,
    refetch: fetchTypes,
  };
}

// Document statuses hook
export function useDocumentStatuses() {
  const { isAuthenticated } = useAuthStore();
  const [statuses, setStatuses] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async (category?: string) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append("category", category);

      // 認証セッションからトークンを取得
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      const response = await fetch(
        `${API_BASE_URL}/document-statuses?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("ドキュメントステータスの取得に失敗しました");
      }

      const data = await response.json();
      setStatuses(data.statuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [isAuthenticated]);

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatuses,
  };
}
