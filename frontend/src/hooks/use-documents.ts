// Document Management Hooks
// Provides comprehensive document management functionality using Amplify GraphQL

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { generateClient } from "aws-amplify/api";
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

// GraphQL client
const client = generateClient();

// GraphQL operations
const LIST_DOCUMENTS = `
  query ListDocuments($filter: DocumentFilterInput, $limit: Int, $nextToken: String) {
    listDocuments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        caseId
        title
        url
        type
        size
        uploadedAt
        uploadedBy
        tags
        description
        isPublic
        version
        lastModified
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

const GET_DOCUMENT = `
  query GetDocument($id: ID!) {
    getDocument(id: $id) {
      id
      caseId
      title
      url
      type
      size
      uploadedAt
      uploadedBy
      tags
      description
      isPublic
      version
      lastModified
      createdAt
      updatedAt
    }
  }
`;

const CREATE_DOCUMENT = `
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
      caseId
      title
      url
      type
      size
      uploadedAt
      uploadedBy
      tags
      description
      isPublic
      version
      lastModified
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_DOCUMENT = `
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      caseId
      title
      url
      type
      size
      uploadedAt
      uploadedBy
      tags
      description
      isPublic
      version
      lastModified
      createdAt
      updatedAt
    }
  }
`;

const DELETE_DOCUMENT = `
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id) {
      id
      title
    }
  }
`;

// Document management hook
export function useDocuments(filters: DocumentFilters = {}) {
  const { isAuthenticated } = useAuth();
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
      const filter = { ...filters, ...newFilters };

      const result = await client.graphql({
        query: LIST_DOCUMENTS,
        variables: {
          filter,
          limit: pagination.limit,
        },
      });

      const items = result.data.listDocuments.items || [];
      setDocuments(items);
      setPagination((prev) => ({
        ...prev,
        total: items.length,
        totalPages: Math.ceil(items.length / prev.limit),
      }));
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
  const { isAuthenticated } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    if (!isAuthenticated || !id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: GET_DOCUMENT,
        variables: { id },
      });

      setDocument(result.data.getDocument);
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
  const { isAuthenticated } = useAuth();
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
      const result = await client.graphql({
        query: CREATE_DOCUMENT,
        variables: { input },
      });

      return result.data.createDocument;
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
  const { isAuthenticated } = useAuth();
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
      const result = await client.graphql({
        query: UPDATE_DOCUMENT,
        variables: { input },
      });

      return result.data.updateDocument;
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
  const { isAuthenticated } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = async (id: string): Promise<boolean> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsDeleting(true);
    setError(null);

    try {
      await client.graphql({
        query: DELETE_DOCUMENT,
        variables: { id },
      });

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
  const { isAuthenticated } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDocument = async (
    request: DocumentGenerationRequest,
  ): Promise<DocumentGenerationResponse> => {
    if (!isAuthenticated) throw new Error("認証が必要です");

    setIsGenerating(true);
    setError(null);

    try {
      // Document generation is typically handled by a Lambda function
      // For now, we'll create a placeholder implementation
      // In a real implementation, this would call a custom Lambda resolver
      throw new Error("Document generation not yet implemented with GraphQL");
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
  const { isAuthenticated } = useAuth();
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
      // File upload is typically handled by S3 and then a Lambda function
      // For now, we'll create a placeholder implementation
      // In a real implementation, this would upload to S3 and create a document record
      throw new Error("Document upload not yet implemented with GraphQL");
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
  const { isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (category?: string, typeId?: string) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Document templates would be fetched from GraphQL
      // For now, we'll create a placeholder implementation
      setTemplates([]);
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
  const { isAuthenticated } = useAuth();
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async (category?: string) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Document types would be fetched from GraphQL
      // For now, we'll create a placeholder implementation
      setTypes([]);
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
  const { isAuthenticated } = useAuth();
  const [statuses, setStatuses] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async (category?: string) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Document statuses would be fetched from GraphQL
      // For now, we'll create a placeholder implementation
      setStatuses([]);
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
