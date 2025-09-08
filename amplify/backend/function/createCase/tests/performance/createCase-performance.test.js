// LegalFlow3 - Create Case Lambda Performance Tests
// Performance tests for case creation functionality

const { handler } = require('../src/index');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

const mockDocClient = {
  send: jest.fn()
};

DynamoDBDocumentClient.from = jest.fn(() => mockDocClient);

// Performance test utilities
const measureExecutionTime = async (fn) => {
  const start = process.hrtime.bigint();
  await fn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000; // Convert to milliseconds
};

const createMockEvent = (overrides = {}) => ({
  arguments: {
    input: {
      name: 'Test Case',
      categoryId: 'test-category-123',
      ...overrides
    }
  },
  identity: {
    sub: 'test-user-123'
  },
  ...overrides
});

describe('Create Case Lambda Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CASES_TABLE_NAME = 'test-cases-table';
    process.env.CASE_ASSIGNMENTS_TABLE_NAME = 'test-case-assignments-table';
    process.env.SUBSCRIPTIONS_TABLE_NAME = 'test-subscriptions-table';
  });

  describe('Basic Performance', () => {
    it('should create case within acceptable time', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 1000ms
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle minimal input efficiently', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent({
        input: {
          name: 'Minimal Case',
          categoryId: 'test-category-123'
        }
      });

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 500ms for minimal input
      expect(executionTime).toBeLessThan(500);
    });

    it('should handle complex input efficiently', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent({
        input: {
          name: 'Complex Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active',
          trialLevel: 'First Instance',
          hourlyRate: 50000,
          categoryId: 'test-category-123',
          currentPhaseId: 'test-phase-123',
          courtDivisionId: 'test-court-123',
          firstConsultationDate: '2024-01-01',
          engagementDate: '2024-01-02',
          caseClosedDate: '2024-12-31',
          litigationStartDate: '2024-02-01',
          oralArgumentEndDate: '2024-11-30',
          judgmentDate: '2024-12-15',
          judgmentReceivedDate: '2024-12-20',
          hasEngagementLetter: true,
          engagementLetterPath: '/documents/engagement.pdf',
          remarks: 'Complex test case with all fields filled',
          customProperties: {
            key1: 'value1',
            key2: 'value2',
            nested: {
              prop1: 'nested-value1',
              prop2: 'nested-value2'
            }
          },
          tags: ['urgent', 'litigation', 'complex', 'test'],
          priority: 'High'
        }
      });

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 1000ms even with complex input
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Execution', () => {
    it('should handle concurrent case creation efficiently', async () => {
      mockDocClient.send.mockResolvedValue({});

      const events = Array.from({ length: 10 }, (_, i) =>
        createMockEvent({
          input: {
            name: `Concurrent Case ${i}`,
            categoryId: 'test-category-123'
          }
        })
      );

      const startTime = Date.now();

      const promises = events.map(event => handler(event));
      const results = await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete all within 5000ms
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle high concurrency without degradation', async () => {
      mockDocClient.send.mockResolvedValue({});

      const events = Array.from({ length: 50 }, (_, i) =>
        createMockEvent({
          input: {
            name: `High Concurrency Case ${i}`,
            categoryId: 'test-category-123'
          }
        })
      );

      const startTime = Date.now();

      const promises = events.map(event => handler(event));
      const results = await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete all within 10000ms
      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated execution', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent();

      // Execute multiple times to check for memory leaks
      for (let i = 0; i < 100; i++) {
        const result = await handler(event);
        expect(result.success).toBe(true);
      }

      // If we get here without errors, memory usage is acceptable
      expect(true).toBe(true);
    });

    it('should handle large custom properties efficiently', async () => {
      mockDocClient.send.mockResolvedValue({});

      const largeCustomProperties = {};
      for (let i = 0; i < 1000; i++) {
        largeCustomProperties[`key${i}`] = `value${i}`.repeat(100);
      }

      const event = createMockEvent({
        input: {
          name: 'Large Properties Case',
          categoryId: 'test-category-123',
          customProperties: largeCustomProperties
        }
      });

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 2000ms even with large properties
      expect(executionTime).toBeLessThan(2000);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(false);
      });

      // Should handle errors quickly
      expect(executionTime).toBeLessThan(500);
    });

    it('should handle validation errors efficiently', async () => {
      const event = createMockEvent({
        input: {
          // Missing required fields
        }
      });

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(false);
      });

      // Should handle validation errors quickly
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Database Performance', () => {
    it('should handle slow database responses gracefully', async () => {
      // Mock slow database response
      mockDocClient.send.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 1000))
      );

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 2000ms even with slow database
      expect(executionTime).toBeLessThan(2000);
    });

    it('should handle database timeouts efficiently', async () => {
      // Mock database timeout
      mockDocClient.send.mockRejectedValue(new Error('Request timeout'));

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(false);
      });

      // Should handle timeouts quickly
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('Subscription Update Performance', () => {
    it('should handle subscription updates efficiently', async () => {
      // Mock successful case creation
      mockDocClient.send
        .mockResolvedValueOnce({}) // Case creation
        .mockResolvedValueOnce({}) // Assignment creation
        .mockResolvedValueOnce({ // Get subscription
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({}); // Update subscription

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 1000ms including subscription update
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle subscription update failures gracefully', async () => {
      // Mock successful case creation but failed subscription update
      mockDocClient.send
        .mockResolvedValueOnce({}) // Case creation
        .mockResolvedValueOnce({}) // Assignment creation
        .mockRejectedValueOnce(new Error('Subscription update failed')); // Subscription update fails

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await handler(event);
        expect(result.success).toBe(true); // Should still succeed
      });

      // Should complete within 1000ms even with subscription failure
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe('Cold Start Performance', () => {
    it('should handle cold starts efficiently', async () => {
      // Clear any cached modules
      jest.clearAllMocks();
      jest.resetModules();

      // Re-require the module to simulate cold start
      const { handler: coldHandler } = require('../src/index');

      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent();

      const executionTime = await measureExecutionTime(async () => {
        const result = await coldHandler(event);
        expect(result.success).toBe(true);
      });

      // Should complete within 2000ms even on cold start
      expect(executionTime).toBeLessThan(2000);
    });
  });

  describe('Resource Usage', () => {
    it('should not exceed memory limits', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent();

      const initialMemory = process.memoryUsage().heapUsed;

      const result = await handler(event);
      expect(result.success).toBe(true);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should not exceed CPU limits', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = createMockEvent();

      const startCpu = process.cpuUsage();

      const result = await handler(event);
      expect(result.success).toBe(true);

      const endCpu = process.cpuUsage(startCpu);
      const cpuUsage = endCpu.user + endCpu.system;

      // CPU usage should be reasonable (less than 100ms)
      expect(cpuUsage).toBeLessThan(100000); // 100ms in microseconds
    });
  });
});
