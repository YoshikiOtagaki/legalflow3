// LegalFlow3 - API Client
// Centralized API client for all backend operations

import {
  apiClient,
  type Case,
  type CreateCaseInput,
  type UpdateCaseInput,
  type ListCasesParams,
  type SearchCasesParams,
  type CaseSearchFilter,
} from "./amplify-config";

// API Client class with error handling and retry logic
export class LegalFlowAPIClient {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  // Generic request method with retry logic
  private async requestWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName} attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt),
          );
        }
      }
    }

    throw new Error(
      `${operationName} failed after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  // Case operations
  async createCase(input: CreateCaseInput): Promise<Case> {
    return this.requestWithRetry(async () => {
      const response = await apiClient.createCase(input);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to create case");
      }

      return response.case!;
    }, "createCase");
  }

  async updateCase(input: UpdateCaseInput): Promise<Case> {
    return this.requestWithRetry(async () => {
      const response = await apiClient.updateCase(input);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to update case");
      }

      return response.case!;
    }, "updateCase");
  }

  async deleteCase(id: string): Promise<{
    id: string;
    name: string;
    caseNumber?: string;
    status?: string;
  }> {
    return this.requestWithRetry(async () => {
      const response = await apiClient.deleteCase(id);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete case");
      }

      return response.case!;
    }, "deleteCase");
  }

  async getCase(id: string): Promise<Case> {
    return this.requestWithRetry(async () => {
      const response = await apiClient.getCase(id);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get case");
      }

      return response.case!;
    }, "getCase");
  }

  async listCases(params: ListCasesParams = {}): Promise<{
    cases: Case[];
    nextToken?: string;
    totalCount: number;
  }> {
    return this.requestWithRetry(async () => {
      const response = await apiClient.listCases(params);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to list cases");
      }

      return {
        cases: response.cases || [],
        nextToken: response.nextToken,
        totalCount: response.totalCount || 0,
      };
    }, "listCases");
  }

  async searchCases(
    filter: CaseSearchFilter,
    params: SearchCasesParams = {},
  ): Promise<{
    cases: Case[];
    nextToken?: string;
    totalCount: number;
  }> {
    return this.requestWithRetry(async () => {
      const response = await apiClient.searchCases(filter, params);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to search cases");
      }

      return {
        cases: response.cases || [],
        nextToken: response.nextToken,
        totalCount: response.totalCount || 0,
      };
    }, "searchCases");
  }

  // Subscription methods
  subscribeToCaseCreated(callback: (selectedCase: Case) => void) {
    return apiClient.subscribeToCaseCreated(callback);
  }

  subscribeToCaseUpdated(callback: (selectedCase: Case) => void) {
    return apiClient.subscribeToCaseUpdated(callback);
  }

  subscribeToCaseDeleted(
    callback: (deletedCase: {
      id: string;
      name: string;
      caseNumber?: string;
      status?: string;
    }) => void,
  ) {
    return apiClient.subscribeToCaseDeleted(callback);
  }
}

// Export singleton instance
export const api = new LegalFlowAPIClient();
export const apiClient = api; // Alias for backward compatibility

// Export types
export type {
  Case,
  CreateCaseInput,
  UpdateCaseInput,
  ListCasesParams,
  SearchCasesParams,
  CaseSearchFilter,
};
