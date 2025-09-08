// LegalFlow3 - API Client Integration Tests
// Integration tests for API client functionality

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  api,
  type CreateCaseInput,
  type UpdateCaseInput,
} from "@/lib/api-client";

// Mock AWS Amplify
const mockGraphql = vi.fn();
vi.mock("aws-amplify", () => ({
  Amplify: {
    configure: vi.fn(),
  },
  generateClient: () => ({
    graphql: mockGraphql,
  }),
  getCurrentUser: vi.fn(),
}));

describe("API Client Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCase", () => {
    it("should create case successfully", async () => {
      const mockResponse = {
        data: {
          createCase: {
            success: true,
            case: {
              id: "CASE#test-123",
              name: "Test Case",
              categoryId: "test-category-123",
              status: "Active",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const input: CreateCaseInput = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      const result = await api.createCase(input);

      expect(result).toEqual(mockResponse.data.createCase.case);
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("mutation CreateCase"),
        variables: { input },
      });
    });

    it("should handle create case error", async () => {
      const mockResponse = {
        data: {
          createCase: {
            success: false,
            error: {
              message: "Failed to create case",
              code: "CreateCaseError",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const input: CreateCaseInput = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      await expect(api.createCase(input)).rejects.toThrow(
        "Failed to create case",
      );
    });

    it("should handle GraphQL errors", async () => {
      const error = new Error("GraphQL error");
      mockGraphql.mockRejectedValue(error);

      const input: CreateCaseInput = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      await expect(api.createCase(input)).rejects.toThrow("GraphQL error");
    });
  });

  describe("updateCase", () => {
    it("should update case successfully", async () => {
      const mockResponse = {
        data: {
          updateCase: {
            success: true,
            case: {
              id: "CASE#test-123",
              name: "Updated Case",
              categoryId: "test-category-123",
              status: "Active",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const input: UpdateCaseInput = {
        id: "CASE#test-123",
        name: "Updated Case",
      };

      const result = await api.updateCase(input);

      expect(result).toEqual(mockResponse.data.updateCase.case);
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("mutation UpdateCase"),
        variables: { input },
      });
    });

    it("should handle update case error", async () => {
      const mockResponse = {
        data: {
          updateCase: {
            success: false,
            error: {
              message: "Failed to update case",
              code: "UpdateCaseError",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const input: UpdateCaseInput = {
        id: "CASE#test-123",
        name: "Updated Case",
      };

      await expect(api.updateCase(input)).rejects.toThrow(
        "Failed to update case",
      );
    });
  });

  describe("deleteCase", () => {
    it("should delete case successfully", async () => {
      const mockResponse = {
        data: {
          deleteCase: {
            success: true,
            case: {
              id: "CASE#test-123",
              name: "Test Case",
              caseNumber: "CASE-2024-001",
              status: "Active",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const result = await api.deleteCase("CASE#test-123");

      expect(result).toEqual(mockResponse.data.deleteCase.case);
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("mutation DeleteCase"),
        variables: { id: "CASE#test-123" },
      });
    });

    it("should handle delete case error", async () => {
      const mockResponse = {
        data: {
          deleteCase: {
            success: false,
            error: {
              message: "Failed to delete case",
              code: "DeleteCaseError",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      await expect(api.deleteCase("CASE#test-123")).rejects.toThrow(
        "Failed to delete case",
      );
    });
  });

  describe("getCase", () => {
    it("should get case successfully", async () => {
      const mockResponse = {
        data: {
          getCase: {
            success: true,
            case: {
              id: "CASE#test-123",
              name: "Test Case",
              categoryId: "test-category-123",
              status: "Active",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
              assignments: [],
              parties: [],
              tasks: [],
              timesheetEntries: [],
              memos: [],
              stats: {
                totalTasks: 0,
                completedTasks: 0,
                totalTimeSpent: 0,
                totalParties: 0,
                totalMemos: 0,
              },
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const result = await api.getCase("CASE#test-123");

      expect(result).toEqual(mockResponse.data.getCase.case);
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("query GetCase"),
        variables: { id: "CASE#test-123" },
      });
    });

    it("should handle get case error", async () => {
      const mockResponse = {
        data: {
          getCase: {
            success: false,
            error: {
              message: "Case not found",
              code: "GetCaseError",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      await expect(api.getCase("CASE#test-123")).rejects.toThrow(
        "Case not found",
      );
    });
  });

  describe("listCases", () => {
    it("should list cases successfully", async () => {
      const mockResponse = {
        data: {
          listCases: {
            success: true,
            cases: [
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
            ],
            nextToken: null,
            totalCount: 2,
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const result = await api.listCases();

      expect(result).toEqual({
        cases: mockResponse.data.listCases.cases,
        nextToken: null,
        totalCount: 2,
      });
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("query ListCases"),
        variables: {},
      });
    });

    it("should list cases with parameters", async () => {
      const mockResponse = {
        data: {
          listCases: {
            success: true,
            cases: [],
            nextToken: null,
            totalCount: 0,
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const params = {
        limit: 10,
        status: "Active",
        categoryId: "test-category-123",
      };

      await api.listCases(params);

      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("query ListCases"),
        variables: params,
      });
    });

    it("should handle list cases error", async () => {
      const mockResponse = {
        data: {
          listCases: {
            success: false,
            error: {
              message: "Failed to list cases",
              code: "ListCasesError",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      await expect(api.listCases()).rejects.toThrow("Failed to list cases");
    });
  });

  describe("searchCases", () => {
    it("should search cases successfully", async () => {
      const mockResponse = {
        data: {
          searchCases: {
            success: true,
            cases: [
              {
                id: "CASE#test-1",
                name: "Test Case 1",
                status: "Active",
                createdAt: "2024-01-01T00:00:00.000Z",
              },
            ],
            nextToken: null,
            totalCount: 1,
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const filter = {
        name: "Test Case",
        status: "Active",
      };

      const result = await api.searchCases(filter);

      expect(result).toEqual({
        cases: mockResponse.data.searchCases.cases,
        nextToken: null,
        totalCount: 1,
      });
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("query SearchCases"),
        variables: { filter, limit: 20, nextToken: undefined },
      });
    });

    it("should handle search cases error", async () => {
      const mockResponse = {
        data: {
          searchCases: {
            success: false,
            error: {
              message: "Search failed",
              code: "SearchCasesError",
            },
          },
        },
      };

      mockGraphql.mockResolvedValue(mockResponse);

      const filter = {
        name: "Test Case",
      };

      await expect(api.searchCases(filter)).rejects.toThrow("Search failed");
    });
  });

  describe("Subscriptions", () => {
    it("should subscribe to case created", () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockGraphql.mockReturnValue({
        subscribe: vi.fn().mockReturnValue({
          unsubscribe,
        }),
      });

      const result = api.subscribeToCaseCreated(callback);

      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("subscription OnCaseCreated"),
        variables: {},
      });
      expect(result).toBeDefined();
    });

    it("should subscribe to case updated", () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockGraphql.mockReturnValue({
        subscribe: vi.fn().mockReturnValue({
          unsubscribe,
        }),
      });

      const result = api.subscribeToCaseUpdated(callback);

      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("subscription OnCaseUpdated"),
        variables: {},
      });
      expect(result).toBeDefined();
    });

    it("should subscribe to case deleted", () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockGraphql.mockReturnValue({
        subscribe: vi.fn().mockReturnValue({
          unsubscribe,
        }),
      });

      const result = api.subscribeToCaseDeleted(callback);

      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining("subscription OnCaseDeleted"),
        variables: {},
      });
      expect(result).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should handle network errors", async () => {
      const error = new Error("Network error");
      mockGraphql.mockRejectedValue(error);

      const input: CreateCaseInput = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      await expect(api.createCase(input)).rejects.toThrow("Network error");
    });

    it("should handle timeout errors", async () => {
      const error = new Error("Request timeout");
      mockGraphql.mockRejectedValue(error);

      const input: CreateCaseInput = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      await expect(api.createCase(input)).rejects.toThrow("Request timeout");
    });
  });

  describe("Retry logic", () => {
    it("should retry on failure", async () => {
      const mockResponse = {
        data: {
          createCase: {
            success: true,
            case: {
              id: "CASE#test-123",
              name: "Test Case",
              categoryId: "test-category-123",
            },
          },
        },
      };

      // First call fails, second succeeds
      mockGraphql
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce(mockResponse);

      const input: CreateCaseInput = {
        name: "Test Case",
        categoryId: "test-category-123",
      };

      const result = await api.createCase(input);

      expect(result).toEqual(mockResponse.data.createCase.case);
      expect(mockGraphql).toHaveBeenCalledTimes(2);
    });
  });
});
