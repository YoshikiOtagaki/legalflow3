// LegalFlow3 - AWS Amplify Configuration
// GraphQL API and Data Client setup

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";

// Amplify configuration
const amplifyConfig = {
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
      region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
      defaultAuthMode: "userPool",
      apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
    },
  },
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
    },
  },
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
    },
  },
};

// Initialize Amplify
Amplify.configure(amplifyConfig);

// Create GraphQL client
export const client = generateClient();

// Auth helper functions
export const auth = {
  getCurrentUser: async () => {
    try {
      return await getCurrentUser();
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  getUserId: async () => {
    try {
      const user = await getCurrentUser();
      return user?.userId;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  },
};

// GraphQL operations
export const graphqlOperations = {
  // Case operations
  createCase: `
    mutation CreateCase($input: CreateCaseInput!) {
      createCase(input: $input) {
        success
        case {
          id
          name
          caseNumber
          status
          trialLevel
          hourlyRate
          categoryId
          currentPhaseId
          courtDivisionId
          createdAt
          updatedAt
          firstConsultationDate
          engagementDate
          caseClosedDate
          litigationStartDate
          oralArgumentEndDate
          judgmentDate
          judgmentReceivedDate
          hasEngagementLetter
          engagementLetterPath
          remarks
          customProperties
          tags
          priority
        }
        error {
          message
          code
        }
      }
    }
  `,

  updateCase: `
    mutation UpdateCase($input: UpdateCaseInput!) {
      updateCase(input: $input) {
        success
        case {
          id
          name
          caseNumber
          status
          trialLevel
          hourlyRate
          categoryId
          currentPhaseId
          courtDivisionId
          createdAt
          updatedAt
          firstConsultationDate
          engagementDate
          caseClosedDate
          litigationStartDate
          oralArgumentEndDate
          judgmentDate
          judgmentReceivedDate
          hasEngagementLetter
          engagementLetterPath
          remarks
          customProperties
          tags
          priority
        }
        error {
          message
          code
        }
      }
    }
  `,

  deleteCase: `
    mutation DeleteCase($id: ID!) {
      deleteCase(id: $id) {
        success
        case {
          id
          name
          caseNumber
          status
        }
        error {
          message
          code
        }
      }
    }
  `,

  getCase: `
    query GetCase($id: ID!) {
      getCase(id: $id) {
        success
        case {
          id
          name
          caseNumber
          status
          trialLevel
          hourlyRate
          categoryId
          currentPhaseId
          courtDivisionId
          createdAt
          updatedAt
          firstConsultationDate
          engagementDate
          caseClosedDate
          litigationStartDate
          oralArgumentEndDate
          judgmentDate
          judgmentReceivedDate
          hasEngagementLetter
          engagementLetterPath
          remarks
          customProperties
          tags
          priority
          assignments {
            id
            userId
            role
            assignedAt
            lastAccessedAt
            permissions
          }
          parties {
            id
            partyId
            role
            partyDetails {
              id
              isCorporation
              isFormerClient
              individualProfile {
                lastName
                firstName
                email
                phone
              }
              corporateProfile {
                name
                email
                phone
              }
            }
          }
          tasks {
            id
            description
            dueDate
            isCompleted
            priority
            category
            assignedToId
            createdAt
            updatedAt
          }
          timesheetEntries {
            id
            startTime
            endTime
            duration
            description
            category
            billable
            hourlyRate
            createdAt
          }
          memos {
            id
            content
            authorId
            createdAt
          }
          stats {
            totalTasks
            completedTasks
            totalTimeSpent
            totalParties
            totalMemos
          }
        }
        error {
          message
          code
        }
      }
    }
  `,

  listCases: `
    query ListCases($limit: Int, $nextToken: String, $status: String, $categoryId: ID) {
      listCases(limit: $limit, nextToken: $nextToken, status: $status, categoryId: $categoryId) {
        success
        cases {
          id
          name
          caseNumber
          status
          trialLevel
          hourlyRate
          categoryId
          currentPhaseId
          courtDivisionId
          createdAt
          updatedAt
          firstConsultationDate
          engagementDate
          caseClosedDate
          litigationStartDate
          oralArgumentEndDate
          judgmentDate
          judgmentReceivedDate
          hasEngagementLetter
          engagementLetterPath
          remarks
          customProperties
          tags
          priority
          userRole
          assignedAt
          lastAccessedAt
          permissions
        }
        nextToken
        totalCount
        error {
          message
          code
        }
      }
    }
  `,

  searchCases: `
    query SearchCases($filter: CaseSearchFilter!, $limit: Int, $nextToken: String) {
      searchCases(filter: $filter, limit: $limit, nextToken: $nextToken) {
        success
        cases {
          id
          name
          caseNumber
          status
          trialLevel
          hourlyRate
          categoryId
          currentPhaseId
          courtDivisionId
          createdAt
          updatedAt
          firstConsultationDate
          engagementDate
          caseClosedDate
          litigationStartDate
          oralArgumentEndDate
          judgmentDate
          judgmentReceivedDate
          hasEngagementLetter
          engagementLetterPath
          remarks
          customProperties
          tags
          priority
          userRole
          assignedAt
          lastAccessedAt
          permissions
        }
        nextToken
        totalCount
        error {
          message
          code
        }
      }
    }
  `,

  // Subscription operations
  onCaseCreated: `
    subscription OnCaseCreated {
      onCaseCreated {
        id
        name
        caseNumber
        status
        createdAt
        userRole
        assignedAt
      }
    }
  `,

  onCaseUpdated: `
    subscription OnCaseUpdated {
      onCaseUpdated {
        id
        name
        caseNumber
        status
        updatedAt
        userRole
        lastAccessedAt
      }
    }
  `,

  onCaseDeleted: `
    subscription OnCaseDeleted {
      onCaseDeleted {
        id
        name
        caseNumber
        status
      }
    }
  `,
};

// API client wrapper
export class APIClient {
  private client = client;

  // Case operations
  async createCase(input: CreateCaseInput) {
    try {
      const result = await this.client.graphql({
        query: graphqlOperations.createCase,
        variables: { input },
      });

      return result.data.createCase;
    } catch (error) {
      console.error("Error creating case:", error);
      throw error;
    }
  }

  async updateCase(input: UpdateCaseInput) {
    try {
      const result = await this.client.graphql({
        query: graphqlOperations.updateCase,
        variables: { input },
      });

      return result.data.updateCase;
    } catch (error) {
      console.error("Error updating case:", error);
      throw error;
    }
  }

  async deleteCase(id: string) {
    try {
      const result = await this.client.graphql({
        query: graphqlOperations.deleteCase,
        variables: { id },
      });

      return result.data.deleteCase;
    } catch (error) {
      console.error("Error deleting case:", error);
      throw error;
    }
  }

  async getCase(id: string) {
    try {
      const result = await this.client.graphql({
        query: graphqlOperations.getCase,
        variables: { id },
      });

      return result.data.getCase;
    } catch (error) {
      console.error("Error getting case:", error);
      throw error;
    }
  }

  async listCases(params: ListCasesParams) {
    try {
      const result = await this.client.graphql({
        query: graphqlOperations.listCases,
        variables: params,
      });

      return result.data.listCases;
    } catch (error) {
      console.error("Error listing cases:", error);
      throw error;
    }
  }

  async searchCases(filter: CaseSearchFilter, params: SearchCasesParams) {
    try {
      const result = await this.client.graphql({
        query: graphqlOperations.searchCases,
        variables: { filter, ...params },
      });

      return result.data.searchCases;
    } catch (error) {
      console.error("Error searching cases:", error);
      throw error;
    }
  }

  // Subscription methods
  subscribeToCaseCreated(callback: (data: any) => void) {
    return this.client
      .graphql({
        query: graphqlOperations.onCaseCreated,
        variables: {},
      })
      .subscribe({
        next: (data) => callback(data.data.onCaseCreated),
        error: (error) => console.error("Subscription error:", error),
      });
  }

  subscribeToCaseUpdated(callback: (data: any) => void) {
    return this.client
      .graphql({
        query: graphqlOperations.onCaseUpdated,
        variables: {},
      })
      .subscribe({
        next: (data) => callback(data.data.onCaseUpdated),
        error: (error) => console.error("Subscription error:", error),
      });
  }

  subscribeToCaseDeleted(callback: (data: any) => void) {
    return this.client
      .graphql({
        query: graphqlOperations.onCaseDeleted,
        variables: {},
      })
      .subscribe({
        next: (data) => callback(data.data.onCaseDeleted),
        error: (error) => console.error("Subscription error:", error),
      });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Type definitions
export interface CreateCaseInput {
  name: string;
  caseNumber?: string;
  status?: string;
  trialLevel?: string;
  hourlyRate?: number;
  categoryId: string;
  currentPhaseId?: string;
  courtDivisionId?: string;
  firstConsultationDate?: string;
  engagementDate?: string;
  caseClosedDate?: string;
  litigationStartDate?: string;
  oralArgumentEndDate?: string;
  judgmentDate?: string;
  judgmentReceivedDate?: string;
  hasEngagementLetter?: boolean;
  engagementLetterPath?: string;
  remarks?: string;
  customProperties?: any;
  tags?: string[];
  priority?: string;
}

export interface UpdateCaseInput {
  id: string;
  name?: string;
  caseNumber?: string;
  status?: string;
  trialLevel?: string;
  hourlyRate?: number;
  categoryId?: string;
  currentPhaseId?: string;
  courtDivisionId?: string;
  firstConsultationDate?: string;
  engagementDate?: string;
  caseClosedDate?: string;
  litigationStartDate?: string;
  oralArgumentEndDate?: string;
  judgmentDate?: string;
  judgmentReceivedDate?: string;
  hasEngagementLetter?: boolean;
  engagementLetterPath?: string;
  remarks?: string;
  customProperties?: any;
  tags?: string[];
  priority?: string;
}

export interface ListCasesParams {
  limit?: number;
  nextToken?: string;
  status?: string;
  categoryId?: string;
}

export interface SearchCasesParams {
  limit?: number;
  nextToken?: string;
}

export interface CaseSearchFilter {
  name?: string;
  caseNumber?: string;
  status?: string;
  categoryId?: string;
  priority?: string;
  tags?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface Case {
  id: string;
  name: string;
  caseNumber?: string;
  status?: string;
  trialLevel?: string;
  hourlyRate?: number;
  categoryId: string;
  currentPhaseId?: string;
  courtDivisionId?: string;
  createdAt: string;
  updatedAt: string;
  firstConsultationDate?: string;
  engagementDate?: string;
  caseClosedDate?: string;
  litigationStartDate?: string;
  oralArgumentEndDate?: string;
  judgmentDate?: string;
  judgmentReceivedDate?: string;
  hasEngagementLetter: boolean;
  engagementLetterPath?: string;
  remarks?: string;
  customProperties?: any;
  tags: string[];
  priority?: string;
  userRole?: string;
  assignedAt?: string;
  lastAccessedAt?: string;
  permissions?: any;
  assignments?: any[];
  parties?: any[];
  tasks?: any[];
  timesheetEntries?: any[];
  memos?: any[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    totalTimeSpent: number;
    totalParties: number;
    totalMemos: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface ListResponse<T> {
  success: boolean;
  data?: T[];
  nextToken?: string;
  totalCount?: number;
  error?: {
    message: string;
    code: string;
  };
}

// Export apiClient alias for backward compatibility
export const apiClient = api;
