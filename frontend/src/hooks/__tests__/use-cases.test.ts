// LegalFlow3 - use-cases Hook Tests
// Unit tests for use-cases custom hook

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  useCases,
  useCreateCase,
  useUpdateCase,
  useDeleteCase,
} from "../use-cases";
import { api } from "@/lib/api-client";

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  api: {
    listCases: vi.fn(),
    getCase: vi.fn(),
    searchCases: vi.fn(),
    createCase: vi.fn(),
    updateCase: vi.fn(),
    deleteCase: vi.fn(),
    subscribeToCaseCreated: vi.fn(),
    subscribeToCaseUpdated: vi.fn(),
    subscribeToCaseDeleted: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("use-cases hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCases", () => {
    it("should fetch cases successfully", async () => {
      const mockCases = [
        {
          id: "CASE#test-1",
          name: "Test Case 1",
          status: "Active",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "CASE#test-2",
          name: "Test Case 2",
          status: "Closed",
          createdAt: "2024-01-02T00:00:00.000Z",
        },
      ];

      mockApi.listCases.mockResolvedValue({
        cases: mockCases,
        nextToken: null,
        totalCount: 2,
      });

      const { result } = renderHook(() => useCases(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        cases: mockCases,
        nextToken: null,
        totalCount: 2,
      });
      expect(mockApi.listCases).toHaveBeenCalledWith({});
    });

    it("should fetch cases with parameters", async () => {
      const params = {
        limit: 10,
        status: "Active",
        categoryId: "test-category-123",
      };

      mockApi.listCases.mockResolvedValue({
        cases: [],
        nextToken: null,
        totalCount: 0,
      });

      const { result } = renderHook(() => useCases(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApi.listCases).toHaveBeenCalledWith(params);
    });

    it("should handle error", async () => {
      const error = new Error("Failed to fetch cases");
      mockApi.listCases.mockRejectedValue(error);

      const { result } = renderHook(() => useCases(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useCreateCase", () => {
    it("should create case successfully", async () => {
      const mockCase = {
        id: "CASE#test-123",
        name: "Test Case",
        categoryId: "test-category-123",
        status: "Active",
      };

      mockApi.createCase.mockResolvedValue(mockCase);

      const { result } = renderHook(() => useCreateCase(), {
        wrapper: createWrapper(),
      });

      const createData = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(createData);
      });

      expect(mockApi.createCase).toHaveBeenCalledWith(createData);
    });

    it("should handle create error", async () => {
      const error = new Error("Failed to create case");
      mockApi.createCase.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateCase(), {
        wrapper: createWrapper(),
      });

      const createData = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      await waitFor(async () => {
        try {
          await result.current.mutateAsync(createData);
        } catch (e) {
          expect(e).toEqual(error);
        }
      });
    });
  });

  describe("useUpdateCase", () => {
    it("should update case successfully", async () => {
      const mockCase = {
        id: "CASE#test-123",
        name: "Updated Case",
        categoryId: "test-category-123",
        status: "Active",
      };

      mockApi.updateCase.mockResolvedValue(mockCase);

      const { result } = renderHook(() => useUpdateCase(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        id: "CASE#test-123",
        name: "Updated Case",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(updateData);
      });

      expect(mockApi.updateCase).toHaveBeenCalledWith(updateData);
    });

    it("should handle update error", async () => {
      const error = new Error("Failed to update case");
      mockApi.updateCase.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateCase(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        id: "CASE#test-123",
        name: "Updated Case",
      };

      await waitFor(async () => {
        try {
          await result.current.mutateAsync(updateData);
        } catch (e) {
          expect(e).toEqual(error);
        }
      });
    });
  });

  describe("useDeleteCase", () => {
    it("should delete case successfully", async () => {
      const mockDeletedCase = {
        id: "CASE#test-123",
        name: "Test Case",
        caseNumber: "CASE-2024-001",
        status: "Active",
      };

      mockApi.deleteCase.mockResolvedValue(mockDeletedCase);

      const { result } = renderHook(() => useDeleteCase(), {
        wrapper: createWrapper(),
      });

      await waitFor(async () => {
        await result.current.mutateAsync("CASE#test-123");
      });

      expect(mockApi.deleteCase).toHaveBeenCalledWith("CASE#test-123");
    });

    it("should handle delete error", async () => {
      const error = new Error("Failed to delete case");
      mockApi.deleteCase.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteCase(), {
        wrapper: createWrapper(),
      });

      await waitFor(async () => {
        try {
          await result.current.mutateAsync("CASE#test-123");
        } catch (e) {
          expect(e).toEqual(error);
        }
      });
    });
  });

  describe("useCaseSubscriptions", () => {
    it("should provide subscription methods", () => {
      const { result } = renderHook(
        () => {
          const { useCaseSubscriptions } = require("../use-cases");
          return useCaseSubscriptions();
        },
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current.subscribeToCaseCreated).toBeDefined();
      expect(result.current.subscribeToCaseUpdated).toBeDefined();
      expect(result.current.subscribeToCaseDeleted).toBeDefined();
    });
  });

  describe("useInfiniteCases", () => {
    it("should provide infinite scroll functionality", () => {
      const { result } = renderHook(
        () => {
          const { useInfiniteCases } = require("../use-cases");
          return useInfiniteCases();
        },
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current.cases).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.hasNextPage).toBeDefined();
      expect(result.current.loadMore).toBeDefined();
      expect(result.current.reset).toBeDefined();
    });
  });

  describe("useCaseStats", () => {
    it("should provide case statistics", () => {
      const { result } = renderHook(
        () => {
          const { useCaseStats } = require("../use-cases");
          return useCaseStats();
        },
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe("object");
    });
  });

  describe("useCaseFilters", () => {
    it("should provide filter functionality", () => {
      const { result } = renderHook(
        () => {
          const { useCaseFilters } = require("../use-cases");
          return useCaseFilters();
        },
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current.filters).toBeDefined();
      expect(result.current.updateFilter).toBeDefined();
      expect(result.current.resetFilters).toBeDefined();
    });
  });
});
