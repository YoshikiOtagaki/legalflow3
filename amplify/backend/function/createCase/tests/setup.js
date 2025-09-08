// LegalFlow3 - Test Setup
// Global test configuration and setup

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set test environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Global test utilities
global.createMockEvent = (overrides = {}) => ({
  arguments: {},
  identity: {
    sub: 'test-user-123'
  },
  ...overrides
});

global.createMockContext = (overrides = {}) => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
  ...overrides
});

// Mock DynamoDB responses
global.createMockDynamoDBResponse = (item = null) => ({
  Item: item,
  Items: item ? [item] : [],
  Count: item ? 1 : 0,
  ScannedCount: item ? 1 : 0,
  LastEvaluatedKey: null
});

// Mock error responses
global.createMockDynamoDBError = (message = 'DynamoDB error') => ({
  name: 'DynamoDBError',
  message,
  $metadata: {
    httpStatusCode: 400,
    requestId: 'test-request-id'
  }
});

// Test data factories
global.createMockCase = (overrides = {}) => ({
  id: 'CASE#test-123',
  name: 'Test Case',
  caseNumber: 'CASE-2024-001',
  status: 'Active',
  trialLevel: 'First Instance',
  hourlyRate: 50000,
  categoryId: 'test-category-123',
  currentPhaseId: 'test-phase-123',
  courtDivisionId: 'test-court-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  firstConsultationDate: '2024-01-01',
  engagementDate: '2024-01-02',
  caseClosedDate: null,
  litigationStartDate: '2024-02-01',
  oralArgumentEndDate: '2024-11-30',
  judgmentDate: '2024-12-15',
  judgmentReceivedDate: '2024-12-20',
  hasEngagementLetter: false,
  engagementLetterPath: null,
  remarks: 'Test remarks',
  customProperties: null,
  tags: ['test', 'urgent'],
  priority: 'Medium',
  ...overrides
});

global.createMockCaseAssignment = (overrides = {}) => ({
  id: 'ASSIGNMENT#test-123',
  caseId: 'CASE#test-123',
  userId: 'test-user-123',
  role: 'Lead',
  permissions: {
    canEdit: true,
    canDelete: true,
    canAssign: true,
    canViewFinancials: true
  },
  assignedAt: '2024-01-01T00:00:00.000Z',
  lastAccessedAt: '2024-01-01T00:00:00.000Z',
  isActive: true,
  ...overrides
});

global.createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'Lawyer',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
});

global.createMockSubscription = (overrides = {}) => ({
  userId: 'test-user-123',
  planId: 'test-plan-123',
  status: 'Active',
  caseCount: 5,
  maxCases: 100,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
});

// Test helpers
global.expectSuccessResponse = (response) => {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('case');
  expect(response.case).toHaveProperty('id');
  expect(response.case).toHaveProperty('name');
};

global.expectErrorResponse = (response, expectedMessage = null) => {
  expect(response).toHaveProperty('success', false);
  expect(response).toHaveProperty('error');
  expect(response.error).toHaveProperty('message');
  if (expectedMessage) {
    expect(response.error.message).toBe(expectedMessage);
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
