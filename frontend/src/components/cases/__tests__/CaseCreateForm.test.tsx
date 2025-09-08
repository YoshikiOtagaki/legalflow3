// LegalFlow3 - Case Create Form Component Tests
// Unit tests for CaseCreateForm component

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CaseCreateForm from "../CaseCreateForm";
import { useCreateCase } from "@/hooks/use-cases";

// Mock the hooks
vi.mock("@/hooks/use-cases");
vi.mock("date-fns", () => ({
  format: (date: Date, format: string) => "2024年01月01日",
  ja: {},
}));

const mockUseCreateCase = vi.mocked(useCreateCase);

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

describe("CaseCreateForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render form with all fields", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByText("新しいケースを作成")).toBeInTheDocument();
      expect(screen.getByLabelText("ケース名 *")).toBeInTheDocument();
      expect(screen.getByLabelText("ケース番号")).toBeInTheDocument();
      expect(screen.getByLabelText("ステータス")).toBeInTheDocument();
      expect(screen.getByLabelText("優先度")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ *")).toBeInTheDocument();
      expect(screen.getByLabelText("時間単価")).toBeInTheDocument();
    });

    it("should render date picker fields", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByText("初回相談日")).toBeInTheDocument();
      expect(screen.getByText("受任日")).toBeInTheDocument();
      expect(screen.getByText("事件終了日")).toBeInTheDocument();
      expect(screen.getByText("判決日")).toBeInTheDocument();
    });

    it("should render tags section", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByText("タグ")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("タグを入力してください"),
      ).toBeInTheDocument();
    });

    it("should render remarks section", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByLabelText("備考")).toBeInTheDocument();
    });
  });

  describe("Form validation", () => {
    it("should show validation error for required fields", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const submitButton = screen.getByText("ケースを作成");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("ケース名は必須です")).toBeInTheDocument();
        expect(screen.getByText("カテゴリは必須です")).toBeInTheDocument();
      });
    });

    it("should validate case name length", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText("ケース名 *");
      fireEvent.change(nameInput, { target: { value: "a".repeat(101) } });

      const submitButton = screen.getByText("ケースを作成");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("ケース名は100文字以内で入力してください"),
        ).toBeInTheDocument();
      });
    });

    it("should validate hourly rate is non-negative", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const hourlyRateInput = screen.getByLabelText("時間単価");
      fireEvent.change(hourlyRateInput, { target: { value: "-100" } });

      const submitButton = screen.getByText("ケースを作成");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("時間単価は0以上で入力してください"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form submission", () => {
    it("should submit form with valid data", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        id: "CASE#test-123",
        name: "Test Case",
        categoryId: "test-category-123",
      });

      mockUseCreateCase.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText("ケース名 *"), {
        target: { value: "Test Case" },
      });
      fireEvent.change(screen.getByLabelText("カテゴリ *"), {
        target: { value: "test-category-123" },
      });

      const submitButton = screen.getByText("ケースを作成");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "Test Case",
          categoryId: "test-category-123",
          status: "Active",
          priority: "Medium",
          hasEngagementLetter: false,
          tags: [],
        });
      });
    });

    it("should call onSuccess when form is submitted successfully", async () => {
      const onSuccess = vi.fn();
      const mockCase = {
        id: "CASE#test-123",
        name: "Test Case",
        categoryId: "test-category-123",
      };

      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn().mockResolvedValue(mockCase),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm onSuccess={onSuccess} />
        </TestWrapper>,
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText("ケース名 *"), {
        target: { value: "Test Case" },
      });
      fireEvent.change(screen.getByLabelText("カテゴリ *"), {
        target: { value: "test-category-123" },
      });

      const submitButton = screen.getByText("ケースを作成");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockCase);
      });
    });

    it("should show loading state during submission", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByText("作成中...")).toBeInTheDocument();
      expect(screen.getByText("ケースを作成")).toBeDisabled();
    });
  });

  describe("Error handling", () => {
    it("should display error message when submission fails", () => {
      const error = new Error("Failed to create case");
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error,
        isSuccess: false,
        isError: true,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByText("Failed to create case")).toBeInTheDocument();
    });

    it("should display success message when submission succeeds", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(
        screen.getByText("ケースが正常に作成されました"),
      ).toBeInTheDocument();
    });
  });

  describe("Tag management", () => {
    it("should add tag when add button is clicked", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const tagInput = screen.getByPlaceholderText("タグを入力してください");
      fireEvent.change(tagInput, { target: { value: "urgent" } });

      const addButton = screen.getByRole("button", { name: /add/i });
      fireEvent.click(addButton);

      expect(screen.getByText("urgent")).toBeInTheDocument();
    });

    it("should add tag when Enter key is pressed", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const tagInput = screen.getByPlaceholderText("タグを入力してください");
      fireEvent.change(tagInput, { target: { value: "urgent" } });
      fireEvent.keyPress(tagInput, { key: "Enter", code: "Enter" });

      expect(screen.getByText("urgent")).toBeInTheDocument();
    });

    it("should remove tag when remove button is clicked", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      // Add a tag
      const tagInput = screen.getByPlaceholderText("タグを入力してください");
      fireEvent.change(tagInput, { target: { value: "urgent" } });
      fireEvent.keyPress(tagInput, { key: "Enter", code: "Enter" });

      expect(screen.getByText("urgent")).toBeInTheDocument();

      // Remove the tag
      const removeButton = screen.getByRole("button", { name: /remove/i });
      fireEvent.click(removeButton);

      expect(screen.queryByText("urgent")).not.toBeInTheDocument();
    });

    it("should not add duplicate tags", async () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const tagInput = screen.getByPlaceholderText("タグを入力してください");

      // Add first tag
      fireEvent.change(tagInput, { target: { value: "urgent" } });
      fireEvent.keyPress(tagInput, { key: "Enter", code: "Enter" });

      // Try to add same tag again
      fireEvent.change(tagInput, { target: { value: "urgent" } });
      fireEvent.keyPress(tagInput, { key: "Enter", code: "Enter" });

      // Should only have one instance
      expect(screen.getAllByText("urgent")).toHaveLength(1);
    });
  });

  describe("Date picker functionality", () => {
    it("should open date picker when date button is clicked", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const dateButton = screen
        .getByText("初回相談日")
        .closest("div")
        ?.querySelector("button");
      fireEvent.click(dateButton!);

      // Calendar should be visible
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  describe("Cancel functionality", () => {
    it("should call onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm onCancel={onCancel} />
        </TestWrapper>,
      );

      const cancelButton = screen.getByText("キャンセル");
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it("should not show cancel button when onCancel is not provided", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.queryByText("キャンセル")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      expect(screen.getByLabelText("ケース名 *")).toBeInTheDocument();
      expect(screen.getByLabelText("ケース番号")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ *")).toBeInTheDocument();
      expect(screen.getByLabelText("時間単価")).toBeInTheDocument();
      expect(screen.getByLabelText("備考")).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      mockUseCreateCase.mockReturnValue({
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
        isSuccess: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <CaseCreateForm />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText("ケース名 *");
      nameInput.focus();
      expect(nameInput).toHaveFocus();
    });
  });
});
