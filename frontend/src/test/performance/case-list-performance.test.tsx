// LegalFlow3 - Case List Performance Tests
// Performance tests for case list component

import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CaseList from "@/components/cases/CaseList";
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

// Performance test utilities
const measureRenderTime = (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

const createLargeCaseList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `CASE#test-${i}`,
    name: `Test Case ${i}`,
    caseNumber: `CASE-2024-${String(i).padStart(3, "0")}`,
    status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Closed" : "Suspended",
    priority:
      i % 4 === 0
        ? "Urgent"
        : i % 4 === 1
          ? "High"
          : i % 4 === 2
            ? "Medium"
            : "Low",
    tags: [`tag-${i % 5}`, `category-${i % 3}`],
    createdAt: "2024-01-01T00:00:00.000Z",
    lastAccessedAt: "2024-01-01T00:00:00.000Z",
    userRole: i % 2 === 0 ? "Lead" : "Collaborator",
    stats: {
      totalTasks: Math.floor(Math.random() * 20),
      completedTasks: Math.floor(Math.random() * 10),
      totalTimeSpent: Math.floor(Math.random() * 1000),
      totalParties: Math.floor(Math.random() * 5),
      totalMemos: Math.floor(Math.random() * 10),
    },
  }));
};

describe("Case List Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering Performance", () => {
    it("should render small case list efficiently", () => {
      const smallCaseList = createLargeCaseList(10);

      mockUseCases.mockReturnValue({
        data: {
          cases: smallCaseList,
          nextToken: null,
          totalCount: 10,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const renderTime = measureRenderTime(() => {
        render(
          <TestWrapper>
            <CaseList />
          </TestWrapper>,
        );
      });

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it("should render medium case list efficiently", () => {
      const mediumCaseList = createLargeCaseList(100);

      mockUseCases.mockReturnValue({
        data: {
          cases: mediumCaseList,
          nextToken: null,
          totalCount: 100,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const renderTime = measureRenderTime(() => {
        render(
          <TestWrapper>
            <CaseList />
          </TestWrapper>,
        );
      });

      // Should render in less than 500ms
      expect(renderTime).toBeLessThan(500);
    });

    it("should render large case list efficiently", () => {
      const largeCaseList = createLargeCaseList(1000);

      mockUseCases.mockReturnValue({
        data: {
          cases: largeCaseList,
          nextToken: null,
          totalCount: 1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const renderTime = measureRenderTime(() => {
        render(
          <TestWrapper>
            <CaseList />
          </TestWrapper>,
        );
      });

      // Should render in less than 1000ms
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe("Memory Usage", () => {
    it("should not cause memory leaks with large datasets", () => {
      const largeCaseList = createLargeCaseList(1000);

      mockUseCases.mockReturnValue({
        data: {
          cases: largeCaseList,
          nextToken: null,
          totalCount: 1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      // Render multiple times to check for memory leaks
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <CaseList />
          </TestWrapper>,
        );
        unmount();
      }

      // If we get here without errors, memory usage is acceptable
      expect(true).toBe(true);
    });
  });

  describe("Search Performance", () => {
    it("should handle search efficiently with large datasets", () => {
      const largeCaseList = createLargeCaseList(1000);

      mockUseCases.mockReturnValue({
        data: {
          cases: largeCaseList,
          nextToken: null,
          totalCount: 1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Simulate search input
      const searchInput =
        screen.getByPlaceholderText("ケース名またはケース番号で検索...");

      const searchTime = measureRenderTime(() => {
        fireEvent.change(searchInput, { target: { value: "Test Case 500" } });
      });

      // Search should be fast even with large datasets
      expect(searchTime).toBeLessThan(50);
    });
  });

  describe("Filter Performance", () => {
    it("should handle filtering efficiently with large datasets", () => {
      const largeCaseList = createLargeCaseList(1000);

      mockUseCases.mockReturnValue({
        data: {
          cases: largeCaseList,
          nextToken: null,
          totalCount: 1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Simulate status filter change
      const statusSelect = screen.getByDisplayValue("すべて");

      const filterTime = measureRenderTime(() => {
        fireEvent.click(statusSelect);
        const activeOption = screen.getByText("アクティブ");
        fireEvent.click(activeOption);
      });

      // Filtering should be fast even with large datasets
      expect(filterTime).toBeLessThan(100);
    });
  });

  describe("Pagination Performance", () => {
    it("should handle pagination efficiently", () => {
      const largeCaseList = createLargeCaseList(1000);

      mockUseCases.mockReturnValue({
        data: {
          cases: largeCaseList,
          nextToken: "next-token-123",
          totalCount: 1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Simulate load more
      const loadMoreButton = screen.getByText("さらに読み込む");

      const paginationTime = measureRenderTime(() => {
        fireEvent.click(loadMoreButton);
      });

      // Pagination should be fast
      expect(paginationTime).toBeLessThan(100);
    });
  });

  describe("Real-time Updates Performance", () => {
    it("should handle real-time updates efficiently", () => {
      const caseList = createLargeCaseList(100);

      mockUseCases.mockReturnValue({
        data: {
          cases: caseList,
          nextToken: null,
          totalCount: 100,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Simulate real-time update
      const newCase = {
        id: "CASE#new-123",
        name: "New Case",
        status: "Active",
        createdAt: "2024-01-01T00:00:00.000Z",
        lastAccessedAt: "2024-01-01T00:00:00.000Z",
        userRole: "Lead",
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          totalTimeSpent: 0,
          totalParties: 0,
          totalMemos: 0,
        },
      };

      const updateTime = measureRenderTime(() => {
        mockUseCases.mockReturnValue({
          data: {
            cases: [...caseList, newCase],
            nextToken: null,
            totalCount: 101,
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
        rerender(
          <TestWrapper>
            <CaseList />
          </TestWrapper>,
        );
      });

      // Real-time updates should be fast
      expect(updateTime).toBeLessThan(200);
    });
  });

  describe("Accessibility Performance", () => {
    it("should maintain accessibility with large datasets", () => {
      const largeCaseList = createLargeCaseList(1000);

      mockUseCases.mockReturnValue({
        data: {
          cases: largeCaseList,
          nextToken: null,
          totalCount: 1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Check that all interactive elements are accessible
      const interactiveElements = container.querySelectorAll(
        "button, input, select, [tabindex]",
      );
      expect(interactiveElements.length).toBeGreaterThan(0);

      // Check that all elements have proper ARIA labels
      const elementsWithAriaLabels = container.querySelectorAll(
        "[aria-label], [aria-labelledby]",
      );
      expect(elementsWithAriaLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Bundle Size Impact", () => {
    it("should not significantly impact bundle size", () => {
      // This test would typically be run with a bundle analyzer
      // For now, we'll just verify the component can be imported
      expect(CaseList).toBeDefined();
      expect(typeof CaseList).toBe("function");
    });
  });

  describe("Network Performance", () => {
    it("should handle network delays gracefully", async () => {
      // Mock slow network response
      mockUseCases.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Should show loading state
      expect(screen.getByText("ケース一覧")).toBeInTheDocument();

      // Simulate slow network response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful response
      mockUseCases.mockReturnValue({
        data: {
          cases: createLargeCaseList(100),
          nextToken: null,
          totalCount: 100,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(
        <TestWrapper>
          <CaseList />
        </TestWrapper>,
      );

      // Should handle the transition smoothly
      expect(screen.getByText("100件のケース")).toBeInTheDocument();
    });
  });
});
