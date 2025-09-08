// LegalFlow3 - Case List Component Tests
// Unit tests for CaseList component

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CaseList from "../CaseList";
import { useCases } from "@/hooks/use-cases";

// Mock the hooks
vi.mock("@/hooks/use-cases");
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock date-fns
vi.mock("date-fns", () => ({
  format: (date: Date, format: string) => "2024/01/01",
  ja: {},
}));

const mockUseCases = vi.mocked(useCases);

// Test data
const mockCases = [
  {
    id: "CASE#test-1",
    name: "Test Case 1",
    caseNumber: "CASE-2024-001",
    status: "Active",
    priority: "High",
    tags: ["urgent", "litigation"],
    createdAt: "2024-01-01T00:00:00.000Z",
    lastAccessedAt: "2024-01-01T00:00:00.000Z",
    userRole: "Lead",
    stats: {
      totalTasks: 5,
      completedTasks: 3,
      totalTimeSpent: 120,
      totalParties: 2,
      totalMemos: 1,
    },
  },
  {
    id: "CASE#test-2",
    name: "Test Case 2",
    caseNumber: "CASE-2024-002",
    status: "Closed",
    priority: "Medium",
    tags: ["completed"],
    createdAt: "2024-01-02T00:00:00.000Z",
    lastAccessedAt: "2024-01-02T00:00:00.000Z",
    userRole: "Collaborator",
    stats: {
      totalTasks: 3,
      completedTasks: 3,
      totalTimeSpent: 80,
      totalParties: 1,
      totalMemos: 0,
    },
  },
];

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

describe("CaseList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render case list with cases", async () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      expect(screen.getByText("ケース一覧")).toBeInTheDocument();
      expect(screen.getByText("2件のケース")).toBeInTheDocument();
      expect(screen.getByText("Test Case 1")).toBeInTheDocument();
      expect(screen.getByText("Test Case 2")).toBeInTheDocument();
    });

    it("should render loading state", () => {
      mockUseCases.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      expect(screen.getByText("ケース一覧")).toBeInTheDocument();
      // Skeleton components should be present
      expect(
        document.querySelectorAll('[data-testid="skeleton"]'),
      ).toHaveLength(6);
    });

    it("should render empty state when no cases", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: [],
          nextToken: null,
          totalCount: 0,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      expect(screen.getByText("0件のケース")).toBeInTheDocument();
      expect(
        screen.getByText("ケースが見つかりませんでした"),
      ).toBeInTheDocument();
    });

    it("should render error state", () => {
      mockUseCases.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch cases"),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      expect(screen.getByText("Failed to fetch cases")).toBeInTheDocument();
    });
  });

  describe("Search functionality", () => {
    it("should handle search input", async () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      const searchInput =
        screen.getByPlaceholderText("ケース名またはケース番号で検索...");
      fireEvent.change(searchInput, { target: { value: "Test Case 1" } });

      expect(searchInput).toHaveValue("Test Case 1");
    });

    it("should filter cases by status", async () => {
      const refetch = vi.fn();
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch,
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      const statusSelect = screen.getByDisplayValue("すべて");
      fireEvent.click(statusSelect);

      const activeOption = screen.getByText("アクティブ");
      fireEvent.click(activeOption);

      expect(refetch).toHaveBeenCalled();
    });
  });

  describe("Case interaction", () => {
    it("should call onCaseSelect when case is clicked", async () => {
      const onCaseSelect = vi.fn();
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList onCaseSelect={onCaseSelect} />
        </TestWrapper>,
      );

      const caseCard = screen
        .getByText("Test Case 1")
        .closest('[class*="cursor-pointer"]');
      fireEvent.click(caseCard!);

      expect(onCaseSelect).toHaveBeenCalledWith(mockCases[0]);
    });

    it("should display case information correctly", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Check first case
      expect(screen.getByText("Test Case 1")).toBeInTheDocument();
      expect(screen.getByText("CASE-2024-001")).toBeInTheDocument();
      expect(screen.getByText("アクティブ")).toBeInTheDocument();
      expect(screen.getByText("高")).toBeInTheDocument();
      expect(screen.getByText("urgent")).toBeInTheDocument();
      expect(screen.getByText("litigation")).toBeInTheDocument();

      // Check second case
      expect(screen.getByText("Test Case 2")).toBeInTheDocument();
      expect(screen.getByText("CASE-2024-002")).toBeInTheDocument();
      expect(screen.getByText("クローズ")).toBeInTheDocument();
      expect(screen.getByText("中")).toBeInTheDocument();
      expect(screen.getByText("completed")).toBeInTheDocument();
    });

    it("should display case statistics", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Check stats for first case
      expect(screen.getByText("3/5")).toBeInTheDocument(); // completed/total tasks
      expect(screen.getByText("2h")).toBeInTheDocument(); // total time spent
      expect(screen.getByText("2")).toBeInTheDocument(); // total parties
    });
  });

  describe("Pagination", () => {
    it("should show load more button when nextToken exists", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: "next-token-123",
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      expect(screen.getByText("さらに読み込む")).toBeInTheDocument();
    });

    it("should not show load more button when no nextToken", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      expect(screen.queryByText("さらに読み込む")).not.toBeInTheDocument();
    });
  });

  describe("Create case functionality", () => {
    it("should call onCreateCase when create button is clicked", () => {
      const onCreateCase = vi.fn();
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList onCreateCase={onCreateCase} />
        </TestWrapper>,
      );

      const createButton = screen.getByText("新しいケース");
      fireEvent.click(createButton);

      expect(onCreateCase).toHaveBeenCalled();
    });

    it("should not show create button when showCreateButton is false", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList showCreateButton={false} />
        </TestWrapper>,
      );

      expect(screen.queryByText("新しいケース")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      const searchInput =
        screen.getByPlaceholderText("ケース名またはケース番号で検索...");
      expect(searchInput).toBeInTheDocument();

      const statusSelect = screen.getByDisplayValue("すべて");
      expect(statusSelect).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      mockUseCases.mockReturnValue({
        data: {
          cases: mockCases,
          nextToken: null,
          totalCount: 2,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      const searchInput =
        screen.getByPlaceholderText("ケース名またはケース番号で検索...");
      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });
  });
});
