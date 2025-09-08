// LegalFlow3 - Case Workflow Integration Tests
// Integration tests for complete case management workflow

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CaseList from "@/components/cases/CaseList";
import CaseCreateForm from "@/components/cases/CaseCreateForm";
import CaseDetail from "@/components/cases/CaseDetail";
import CaseEditForm from "@/components/cases/CaseEditForm";
import { api } from "@/lib/api-client";

// Mock the API client
vi.mock("@/lib/api-client", () => ({
  api: {
    listCases: vi.fn(),
    getCase: vi.fn(),
    createCase: vi.fn(),
    updateCase: vi.fn(),
    deleteCase: vi.fn(),
    searchCases: vi.fn(),
    subscribeToCaseCreated: vi.fn(),
    subscribeToCaseUpdated: vi.fn(),
    subscribeToCaseDeleted: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Case Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Case Management Workflow", () => {
    it("should handle complete case lifecycle", async () => {
      // Mock initial empty state
      mockApi.listCases.mockResolvedValue({
        cases: [],
        nextToken: null,
        totalCount: 0,
      });

      // Render case list
      const { rerender } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Should show empty state
      expect(screen.getByText("0件のケース")).toBeInTheDocument();
      expect(
        screen.getByText("ケースが見つかりませんでした"),
      ).toBeInTheDocument();

      // Mock case creation
      const mockCreatedCase = {
        id: "CASE#test-123",
        name: "Test Case",
        categoryId: "test-category-123",
        status: "Active",
        priority: "Medium",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      mockApi.createCase.mockResolvedValue(mockCreatedCase);

      // Show create form
      rerender(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      // Fill form
      fireEvent.change(screen.getByLabelText("ケース名 *"), {
        target: { value: "Test Case" },
      });
      fireEvent.change(screen.getByLabelText("カテゴリ *"), {
        target: { value: "test-category-123" },
      });

      // Submit form
      fireEvent.click(screen.getByText("ケースを作成"));

      await waitFor(() => {
        expect(mockApi.createCase).toHaveBeenCalledWith({
          name: "Test Case",
          categoryId: "test-category-123",
          status: "Active",
          priority: "Medium",
          hasEngagementLetter: false,
          tags: [],
        });
      });

      // Mock updated case list
      mockApi.listCases.mockResolvedValue({
        cases: [mockCreatedCase],
        nextToken: null,
        totalCount: 1,
      });

      // Show updated case list
      rerender(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("1件のケース")).toBeInTheDocument();
        expect(screen.getByText("Test Case")).toBeInTheDocument();
      });

      // Mock case details
      const mockCaseDetails = {
        ...mockCreatedCase,
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
      };

      mockApi.getCase.mockResolvedValue(mockCaseDetails);

      // Show case detail
      rerender(
        <TestWrapper>
          <CaseDetail caseId="CASE#test-123" />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Case")).toBeInTheDocument();
      });

      // Mock case update
      const mockUpdatedCase = {
        ...mockCreatedCase,
        name: "Updated Test Case",
        updatedAt: "2024-01-02T00:00:00.000Z",
      };

      mockApi.updateCase.mockResolvedValue(mockUpdatedCase);

      // Show edit form
      rerender(
        <TestWrapper>
          <CaseEditForm caseId="CASE#test-123" />
        </TestWrapper>,
      );

      // Update case name
      fireEvent.change(screen.getByLabelText("ケース名 *"), {
        target: { value: "Updated Test Case" },
      });

      // Submit update
      fireEvent.click(screen.getByText("更新を保存"));

      await waitFor(() => {
        expect(mockApi.updateCase).toHaveBeenCalledWith({
          id: "CASE#test-123",
          name: "Updated Test Case",
        });
      });

      // Mock case deletion
      mockApi.deleteCase.mockResolvedValue({
        id: "CASE#test-123",
        name: "Updated Test Case",
        caseNumber: undefined,
        status: "Active",
      });

      // Mock empty case list after deletion
      mockApi.listCases.mockResolvedValue({
        cases: [],
        nextToken: null,
        totalCount: 0,
      });

      // Show updated case list
      rerender(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Case should be removed from list
      await waitFor(() => {
        expect(screen.getByText("0件のケース")).toBeInTheDocument();
      });
    });
  });

  describe("Case Search Workflow", () => {
    it("should handle case search workflow", async () => {
      // Mock initial case list
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

      // Mock search results
      const mockSearchResults = [
        {
          id: "CASE#test-1",
          name: "Test Case 1",
          status: "Active",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      mockApi.searchCases.mockResolvedValue({
        cases: mockSearchResults,
        nextToken: null,
        totalCount: 1,
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Should show all cases initially
      await waitFor(() => {
        expect(screen.getByText("2件のケース")).toBeInTheDocument();
        expect(screen.getByText("Test Case 1")).toBeInTheDocument();
        expect(screen.getByText("Test Case 2")).toBeInTheDocument();
      });

      // Search for specific case
      const searchInput =
        screen.getByPlaceholderText("ケース名またはケース番号で検索...");
      fireEvent.change(searchInput, { target: { value: "Test Case 1" } });

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText("1件のケース")).toBeInTheDocument();
        expect(screen.getByText("Test Case 1")).toBeInTheDocument();
        expect(screen.queryByText("Test Case 2")).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: "" } });

      // Should show all cases again
      await waitFor(() => {
        expect(screen.getByText("2件のケース")).toBeInTheDocument();
        expect(screen.getByText("Test Case 1")).toBeInTheDocument();
        expect(screen.getByText("Test Case 2")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling Workflow", () => {
    it("should handle errors gracefully throughout workflow", async () => {
      // Mock API errors
      mockApi.listCases.mockRejectedValue(new Error("Failed to fetch cases"));
      mockApi.createCase.mockRejectedValue(new Error("Failed to create case"));
      mockApi.updateCase.mockRejectedValue(new Error("Failed to update case"));
      mockApi.deleteCase.mockRejectedValue(new Error("Failed to delete case"));

      // Test list error
      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Failed to fetch cases")).toBeInTheDocument();
      });

      // Test create error
      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      // Fill and submit form
      fireEvent.change(screen.getByLabelText("ケース名 *"), {
        target: { value: "Test Case" },
      });
      fireEvent.change(screen.getByLabelText("カテゴリ *"), {
        target: { value: "test-category-123" },
      });
      fireEvent.click(screen.getByText("ケースを作成"));

      await waitFor(() => {
        expect(screen.getByText("Failed to create case")).toBeInTheDocument();
      });

      // Test update error
      mockApi.getCase.mockResolvedValue({
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
      });

      render(
        <TestWrapper>
          <CaseEditForm caseId="CASE#test-123" />
        </TestWrapper>,
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Case")).toBeInTheDocument();
      });

      // Update and submit
      fireEvent.change(screen.getByLabelText("ケース名 *"), {
        target: { value: "Updated Case" },
      });
      fireEvent.click(screen.getByText("更新を保存"));

      await waitFor(() => {
        expect(screen.getByText("Failed to update case")).toBeInTheDocument();
      });
    });
  });

  describe("Real-time Updates Workflow", () => {
    it("should handle real-time updates", async () => {
      // Mock initial case list
      mockApi.listCases.mockResolvedValue({
        cases: [],
        nextToken: null,
        totalCount: 0,
      });

      // Mock subscription
      const mockSubscription = {
        unsubscribe: vi.fn(),
      };

      mockApi.subscribeToCaseCreated.mockReturnValue(mockSubscription);
      mockApi.subscribeToCaseUpdated.mockReturnValue(mockSubscription);
      mockApi.subscribeToCaseDeleted.mockReturnValue(mockSubscription);

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Should set up subscriptions
      expect(mockApi.subscribeToCaseCreated).toHaveBeenCalled();
      expect(mockApi.subscribeToCaseUpdated).toHaveBeenCalled();
      expect(mockApi.subscribeToCaseDeleted).toHaveBeenCalled();
    });
  });

  describe("Performance Workflow", () => {
    it("should handle large datasets efficiently", async () => {
      // Mock large dataset
      const largeCaseList = Array.from({ length: 100 }, (_, i) => ({
        id: `CASE#test-${i}`,
        name: `Test Case ${i}`,
        status: "Active",
        createdAt: "2024-01-01T00:00:00.000Z",
      }));

      mockApi.listCases.mockResolvedValue({
        cases: largeCaseList,
        nextToken: "next-token-123",
        totalCount: 100,
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Should handle large dataset
      await waitFor(() => {
        expect(screen.getByText("100件のケース")).toBeInTheDocument();
      });

      // Should show load more button
      expect(screen.getByText("さらに読み込む")).toBeInTheDocument();
    });
  });
});
