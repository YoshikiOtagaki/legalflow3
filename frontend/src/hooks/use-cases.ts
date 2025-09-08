// LegalFlow3 - Cases Hook
// Custom hook for case management operations

"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type Case,
  type CreateCaseInput,
  type UpdateCaseInput,
  type ListCasesParams,
  type SearchCasesParams,
  type CaseSearchFilter,
} from "@/lib/api-client";

// Query keys
export const caseKeys = {
  all: ["cases"] as const,
  lists: () => [...caseKeys.all, "list"] as const,
  list: (params: ListCasesParams) => [...caseKeys.lists(), params] as const,
  details: () => [...caseKeys.all, "detail"] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
  searches: () => [...caseKeys.all, "search"] as const,
  search: (filter: CaseSearchFilter, params: SearchCasesParams) =>
    [...caseKeys.searches(), filter, params] as const,
};

// Hook for listing cases
export function useCases(params: ListCasesParams = {}) {
  return useQuery({
    queryKey: caseKeys.list(params),
    queryFn: () => api.listCases(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting a single case
export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => api.getCase(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for searching cases
export function useSearchCases(
  filter: CaseSearchFilter,
  params: SearchCasesParams = {},
) {
  return useQuery({
    queryKey: caseKeys.search(filter, params),
    queryFn: () => api.searchCases(filter, params),
    enabled: Object.keys(filter).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for creating a case
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCaseInput) => api.createCase(input),
    onSuccess: (newCase) => {
      // Invalidate and refetch case lists
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.searches() });

      // Add the new case to the cache
      queryClient.setQueryData(caseKeys.detail(newCase.id), {
        success: true,
        case: newCase,
      });
    },
    onError: (error) => {
      console.error("Failed to create case:", error);
    },
  });
}

// Hook for updating a case
export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCaseInput) => api.updateCase(input),
    onSuccess: (updatedCase) => {
      // Update the case in the cache
      queryClient.setQueryData(caseKeys.detail(updatedCase.id), {
        success: true,
        case: updatedCase,
      });

      // Invalidate case lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.searches() });
    },
    onError: (error) => {
      console.error("Failed to update case:", error);
    },
  });
}

// Hook for deleting a case
export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteCase(id),
    onSuccess: (deletedCase) => {
      // Remove the case from the cache
      queryClient.removeQueries({ queryKey: caseKeys.detail(deletedCase.id) });

      // Invalidate case lists to refetch without the deleted case
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.searches() });
    },
    onError: (error) => {
      console.error("Failed to delete case:", error);
    },
  });
}

// Hook for case subscriptions
export function useCaseSubscriptions() {
  const queryClient = useQueryClient();

  const subscribeToCaseCreated = useCallback(() => {
    return api.subscribeToCaseCreated((newCase) => {
      // Add the new case to all relevant caches
      queryClient.setQueryData(caseKeys.detail(newCase.id), {
        success: true,
        case: newCase,
      });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.searches() });
    });
  }, [queryClient]);

  const subscribeToCaseUpdated = useCallback(() => {
    return api.subscribeToCaseUpdated((updatedCase) => {
      // Update the case in the cache
      queryClient.setQueryData(caseKeys.detail(updatedCase.id), {
        success: true,
        case: updatedCase,
      });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.searches() });
    });
  }, [queryClient]);

  const subscribeToCaseDeleted = useCallback(() => {
    return api.subscribeToCaseDeleted((deletedCase) => {
      // Remove the case from the cache
      queryClient.removeQueries({ queryKey: caseKeys.detail(deletedCase.id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.searches() });
    });
  }, [queryClient]);

  return {
    subscribeToCaseCreated,
    subscribeToCaseUpdated,
    subscribeToCaseDeleted,
  };
}

// Hook for case list with infinite scroll
export function useInfiniteCases(params: ListCasesParams = {}) {
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading, error, refetch } = useCases(params);

  // Update state when data changes
  useState(() => {
    if (data) {
      setAllCases(data.cases);
      setNextToken(data.nextToken);
      setHasNextPage(!!data.nextToken);
    }
  });

  const loadMore = useCallback(async () => {
    if (!nextToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await api.listCases({ ...params, nextToken });
      setAllCases((prev) => [...prev, ...response.cases]);
      setNextToken(response.nextToken);
      setHasNextPage(!!response.nextToken);
    } catch (error) {
      console.error("Failed to load more cases:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextToken, isLoadingMore, params]);

  const reset = useCallback(() => {
    setAllCases([]);
    setNextToken(undefined);
    setHasNextPage(true);
    refetch();
  }, [refetch]);

  return {
    cases: allCases,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    loadMore,
    reset,
    refetch,
  };
}

// Hook for case statistics
export function useCaseStats() {
  const { data: casesData } = useCases({ limit: 1000 }); // Get all cases for stats

  const stats = useState(() => {
    if (!casesData?.cases) {
      return {
        total: 0,
        active: 0,
        closed: 0,
        suspended: 0,
        byPriority: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        totalTimeSpent: 0,
        averageTimePerCase: 0,
      };
    }

    const cases = casesData.cases;
    const total = cases.length;
    const active = cases.filter((c) => c.status === "Active").length;
    const closed = cases.filter((c) => c.status === "Closed").length;
    const suspended = cases.filter((c) => c.status === "Suspended").length;

    const byPriority = {
      urgent: cases.filter((c) => c.priority === "Urgent").length,
      high: cases.filter((c) => c.priority === "High").length,
      medium: cases.filter((c) => c.priority === "Medium").length,
      low: cases.filter((c) => c.priority === "Low").length,
    };

    const totalTimeSpent = cases.reduce(
      (sum, c) => sum + (c.stats?.totalTimeSpent || 0),
      0,
    );
    const averageTimePerCase = total > 0 ? totalTimeSpent / total : 0;

    return {
      total,
      active,
      closed,
      suspended,
      byPriority,
      totalTimeSpent,
      averageTimePerCase,
    };
  });

  return stats;
}

// Hook for case filters
export function useCaseFilters() {
  const [filters, setFilters] = useState<ListCasesParams>({
    limit: 20,
  });

  const updateFilter = useCallback(
    (key: keyof ListCasesParams, value: string | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === "all" ? undefined : value,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters({ limit: 20 });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}
