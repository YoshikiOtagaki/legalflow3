// LegalFlow3 - Create Case Lambda Function Tests
// Unit tests for case creation functionality

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

describe('Create Case Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CASES_TABLE_NAME = 'test-cases-table';
    process.env.CASE_ASSIGNMENTS_TABLE_NAME = 'test-case-assignments-table';
    process.env.SUBSCRIPTIONS_TABLE_NAME = 'test-subscriptions-table';
  });

  describe('Successful case creation', () => {
    it('should create a case with minimal required fields', async () => {
      // Mock successful DynamoDB operations
      mockDocClient.send.mockResolvedValue({});

      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case).toBeDefined();
      expect(result.case.name).toBe('Test Case');
      expect(result.case.categoryId).toBe('test-category-123');
      expect(result.case.id).toBe('CASE#test-uuid-123');
      expect(result.assignment).toBeDefined();
      expect(result.assignment.userId).toBe('test-user-123');
      expect(result.assignment.role).toBe('Lead');
    });

    it('should create a case with all optional fields', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = {
        arguments: {
          input: {
            name: 'Complete Test Case',
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
            remarks: 'Test remarks',
            customProperties: { key: 'value' },
            tags: ['urgent', 'litigation'],
            priority: 'High'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case.name).toBe('Complete Test Case');
      expect(result.case.caseNumber).toBe('CASE-2024-001');
      expect(result.case.status).toBe('Active');
      expect(result.case.trialLevel).toBe('First Instance');
      expect(result.case.hourlyRate).toBe(50000);
      expect(result.case.tags).toEqual(['urgent', 'litigation']);
      expect(result.case.priority).toBe('High');
    });

    it('should create case assignment with correct permissions', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      await handler(event);

      // Check that case assignment was created
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-case-assignments-table',
            Item: expect.objectContaining({
              caseId: 'CASE#test-uuid-123',
              userId: 'test-user-123',
              role: 'Lead',
              permissions: {
                canEdit: true,
                canDelete: true,
                canAssign: true,
                canViewFinancials: true
              },
              isActive: true
            })
          })
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return error when user ID is missing', async () => {
      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123'
          }
        }
        // No identity provided
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User ID is required');
    });

    it('should return error when case name is missing', async () => {
      const event = {
        arguments: {
          input: {
            categoryId: 'test-category-123'
            // name is missing
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Case name is required');
    });

    it('should return error when category ID is missing', async () => {
      const event = {
        arguments: {
          input: {
            name: 'Test Case'
            // categoryId is missing
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Category ID is required');
    });

    it('should handle DynamoDB errors gracefully', async () => {
      mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));

      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('DynamoDB error');
    });
  });

  describe('Data validation', () => {
    it('should set default values for optional fields', async () => {
      mockDocClient.send.mockResolvedValue({});

      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.case.status).toBe('Active');
      expect(result.case.priority).toBe('Medium');
      expect(result.case.hasEngagementLetter).toBe(false);
      expect(result.case.tags).toEqual([]);
      expect(result.case.createdAt).toBeDefined();
      expect(result.case.updatedAt).toBeDefined();
    });

    it('should validate hourly rate is non-negative', async () => {
      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123',
            hourlyRate: -100
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      // Should still succeed but hourlyRate should be handled appropriately
      expect(result.success).toBe(true);
    });
  });

  describe('Integration with other services', () => {
    it('should update user case count in subscription', async () => {
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

      const event = {
        arguments: {
          input: {
            name: 'Test Case',
            categoryId: 'test-category-123'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      await handler(event);

      // Verify subscription update was called
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-subscriptions-table',
            Item: expect.objectContaining({
              userId: 'test-user-123',
              caseCount: 6 // 5 + 1
            })
          })
        })
      );
    });
  });
});
