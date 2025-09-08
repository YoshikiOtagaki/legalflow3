// LegalFlow3 - Test Setup
// Global test configuration and setup

import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock Next.js router
vi.mock("next/router", () => ({
  useRouter: () => ({
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    push: vi.fn(),
    pop: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
  }),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock AWS Amplify
vi.mock("aws-amplify", () => ({
  Amplify: {
    configure: vi.fn(),
  },
  generateClient: () => ({
    graphql: vi.fn(),
  }),
  getCurrentUser: vi.fn(),
}));

// Mock date-fns
vi.mock("date-fns", () => ({
  format: (date: Date, format: string) => "2024/01/01",
  ja: {},
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Search: () => React.createElement("div", { "data-testid": "search-icon" }),
  Filter: () => React.createElement("div", { "data-testid": "filter-icon" }),
  Plus: () => React.createElement("div", { "data-testid": "plus-icon" }),
  Calendar: () =>
    React.createElement("div", { "data-testid": "calendar-icon" }),
  Clock: () => React.createElement("div", { "data-testid": "clock-icon" }),
  Users: () => React.createElement("div", { "data-testid": "users-icon" }),
  CheckCircle: () =>
    React.createElement("div", { "data-testid": "check-circle-icon" }),
  AlertCircle: () =>
    React.createElement("div", { "data-testid": "alert-circle-icon" }),
  ChevronLeft: () =>
    React.createElement("div", { "data-testid": "chevron-left-icon" }),
  ChevronRight: () =>
    React.createElement("div", { "data-testid": "chevron-right-icon" }),
  MoreHorizontal: () =>
    React.createElement("div", { "data-testid": "more-horizontal-icon" }),
  Edit: () => React.createElement("div", { "data-testid": "edit-icon" }),
  Trash2: () => React.createElement("div", { "data-testid": "trash2-icon" }),
  X: () => React.createElement("div", { "data-testid": "x-icon" }),
  Save: () => React.createElement("div", { "data-testid": "save-icon" }),
  ChevronDown: () =>
    React.createElement("div", { "data-testid": "chevron-down-icon" }),
  ChevronUp: () =>
    React.createElement("div", { "data-testid": "chevron-up-icon" }),
  User: () => React.createElement("div", { "data-testid": "user-icon" }),
  Building: () =>
    React.createElement("div", { "data-testid": "building-icon" }),
  Phone: () => React.createElement("div", { "data-testid": "phone-icon" }),
  Mail: () => React.createElement("div", { "data-testid": "mail-icon" }),
  MapPin: () => React.createElement("div", { "data-testid": "map-pin-icon" }),
  ExternalLink: () =>
    React.createElement("div", { "data-testid": "external-link-icon" }),
  FileText: () =>
    React.createElement("div", { "data-testid": "file-text-icon" }),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT =
  "https://test.appsync-api.us-east-1.amazonaws.com/graphql";
process.env.NEXT_PUBLIC_AWS_REGION = "us-east-1";
process.env.NEXT_PUBLIC_USER_POOL_ID = "test-user-pool-id";
process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID = "test-user-pool-client-id";
process.env.NEXT_PUBLIC_S3_BUCKET = "test-bucket";

// Global test utilities
global.createMockCase = (overrides = {}) => ({
  id: "CASE#test-123",
  name: "Test Case",
  caseNumber: "CASE-2024-001",
  status: "Active",
  trialLevel: "First Instance",
  hourlyRate: 50000,
  categoryId: "test-category-123",
  currentPhaseId: "test-phase-123",
  courtDivisionId: "test-court-123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  firstConsultationDate: "2024-01-01",
  engagementDate: "2024-01-02",
  caseClosedDate: null,
  litigationStartDate: "2024-02-01",
  oralArgumentEndDate: "2024-11-30",
  judgmentDate: "2024-12-15",
  judgmentReceivedDate: "2024-12-20",
  hasEngagementLetter: false,
  engagementLetterPath: null,
  remarks: "Test remarks",
  customProperties: null,
  tags: ["test", "urgent"],
  priority: "Medium",
  userRole: "Lead",
  assignedAt: "2024-01-01T00:00:00.000Z",
  lastAccessedAt: "2024-01-01T00:00:00.000Z",
  permissions: {
    canEdit: true,
    canDelete: true,
    canAssign: true,
    canViewFinancials: true,
  },
  stats: {
    totalTasks: 5,
    completedTasks: 3,
    totalTimeSpent: 120,
    totalParties: 2,
    totalMemos: 1,
  },
  ...overrides,
});

global.createMockUser = (overrides = {}) => ({
  id: "test-user-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "Lawyer",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

global.createMockCaseAssignment = (overrides = {}) => ({
  id: "ASSIGNMENT#test-123",
  caseId: "CASE#test-123",
  userId: "test-user-123",
  role: "Lead",
  permissions: {
    canEdit: true,
    canDelete: true,
    canAssign: true,
    canViewFinancials: true,
  },
  assignedAt: "2024-01-01T00:00:00.000Z",
  lastAccessedAt: "2024-01-01T00:00:00.000Z",
  isActive: true,
  ...overrides,
});

// Test helpers
global.expectSuccessResponse = (response: any) => {
  expect(response).toHaveProperty("success", true);
  expect(response).toHaveProperty("case");
  expect(response.case).toHaveProperty("id");
  expect(response.case).toHaveProperty("name");
};

global.expectErrorResponse = (
  response: any,
  expectedMessage: string | null = null,
) => {
  expect(response).toHaveProperty("success", false);
  expect(response).toHaveProperty("error");
  expect(response.error).toHaveProperty("message");
  if (expectedMessage) {
    expect(response.error.message).toBe(expectedMessage);
  }
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
