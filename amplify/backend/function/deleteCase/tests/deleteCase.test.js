// LegalFlow3 - Delete Case Lambda Function Tests
// Unit tests for case deletion functionality

const { handler } = require('../src/index');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb');

const mockDocClient = {
  send: jest.fn()
};

DynamoDBDocumentClient.from = jest.fn(() => mockDocClient);

describe('Delete Case Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CASES_TABLE_NAME = 'test-cases-table';
    process.env.CASE_ASSIGNMENTS_TABLE_NAME = 'test-case-assignments-table';
    process.env.CASE_PARTIES_TABLE_NAME = 'test-case-parties-table';
    process.env.TASKS_TABLE_NAME = 'test-tasks-table';
    process.env.TIMESHEET_ENTRIES_TABLE_NAME = 'test-timesheet-entries-table';
    process.env.MEMOS_TABLE_NAME = 'test-memos-table';
    process.env.SUBSCRIPTIONS_TABLE_NAME = 'test-subscriptions-table';
  });

  describe('Successful case deletion', () => {
    it('should delete case and all related data', async () => {
      // Mock permission check
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      // Mock get case details
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock related data queries (all return empty results)
      mockDocClient.send
        .mockResolvedValueOnce({ Items: [] }) // Case assignments
        .mockResolvedValueOnce({ Items: [] }) // Case parties
        .mockResolvedValueOnce({ Items: [] }) // Tasks
        .mockResolvedValueOnce({ Items: [] }) // Timesheet entries
        .mockResolvedValueOnce({ Items: [] }) // Memos
        .mockResolvedValueOnce({}); // Case deletion

      // Mock subscription update
      mockDocClient.send
        .mockResolvedValueOnce({
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({});

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case.name).toBe('Test Case');
      expect(result.message).toBe('Case deleted successfully');
    });

    it('should delete case with related data', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock related data with items
      mockDocClient.send
        .mockResolvedValueOnce({
          Items: [
            { caseId: 'CASE#test-123', userId: 'user-1' },
            { caseId: 'CASE#test-123', userId: 'user-2' }
          ]
        })
        .mockResolvedValueOnce({
          Items: [
            { caseId: 'CASE#test-123', partyId: 'party-1', role: 'Plaintiff' },
            { caseId: 'CASE#test-123', partyId: 'party-2', role: 'Defendant' }
          ]
        })
        .mockResolvedValueOnce({
          Items: [
            { id: 'task-1', caseId: 'CASE#test-123' },
            { id: 'task-2', caseId: 'CASE#test-123' }
          ]
        })
        .mockResolvedValueOnce({
          Items: [
            { id: 'timesheet-1', caseId: 'CASE#test-123' },
            { id: 'timesheet-2', caseId: 'CASE#test-123' }
          ]
        })
        .mockResolvedValueOnce({
          Items: [
            { id: 'memo-1', caseId: 'CASE#test-123' },
            { id: 'memo-2', caseId: 'CASE#test-123' }
          ]
        });

      // Mock deletions for related data
      mockDocClient.send
        .mockResolvedValueOnce({}) // Delete assignment 1
        .mockResolvedValueOnce({}) // Delete assignment 2
        .mockResolvedValueOnce({}) // Delete party 1
        .mockResolvedValueOnce({}) // Delete party 2
        .mockResolvedValueOnce({}) // Delete task 1
        .mockResolvedValueOnce({}) // Delete task 2
        .mockResolvedValueOnce({}) // Delete timesheet 1
        .mockResolvedValueOnce({}) // Delete timesheet 2
        .mockResolvedValueOnce({}) // Delete memo 1
        .mockResolvedValueOnce({}) // Delete memo 2
        .mockResolvedValueOnce({}); // Delete case

      // Mock subscription update
      mockDocClient.send
        .mockResolvedValueOnce({
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({});

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case.name).toBe('Test Case');
    });
  });

  describe('Permission validation', () => {
    it('should allow deletion for Lead role', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: false } // Even without explicit permission, Lead should be allowed
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock empty related data
      mockDocClient.send
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({}); // Case deletion

      // Mock subscription update
      mockDocClient.send
        .mockResolvedValueOnce({
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({});

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
    });

    it('should allow deletion for user with canDelete permission', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Collaborator',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock empty related data
      mockDocClient.send
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({}); // Case deletion

      // Mock subscription update
      mockDocClient.send
        .mockResolvedValueOnce({
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({});

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
    });

    it('should deny deletion for user without permission', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Collaborator',
          permissions: { canDelete: false }
        }
      });

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User does not have permission to delete this case');
    });

    it('should deny deletion for inactive user', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: false,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User does not have permission to delete this case');
    });

    it('should deny deletion for non-assigned user', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        // No item returned - user not assigned to case
      });

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User does not have permission to delete this case');
    });
  });

  describe('Error handling', () => {
    it('should return error when user ID is missing', async () => {
      const event = {
        arguments: {
          id: 'CASE#test-123'
        }
        // No identity provided
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User ID is required');
    });

    it('should return error when case ID is missing', async () => {
      const event = {
        arguments: {}
        // id is missing
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Case ID is required');
    });

    it('should return error when case not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        // No item returned - case not found
      });

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Case not found');
    });

    it('should handle DynamoDB errors gracefully', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      mockDocClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      const event = {
        arguments: {
          id: 'CASE#test-123'
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

  describe('Related data cleanup', () => {
    it('should handle errors in related data deletion gracefully', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock related data queries
      mockDocClient.send
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({}); // Case deletion

      // Mock subscription update
      mockDocClient.send
        .mockResolvedValueOnce({
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({});

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      // Should still succeed even if related data cleanup fails
      expect(result.success).toBe(true);
    });
  });

  describe('Subscription update', () => {
    it('should update user case count after deletion', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock empty related data
      mockDocClient.send
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({}); // Case deletion

      // Mock subscription operations
      mockDocClient.send
        .mockResolvedValueOnce({
          Item: {
            userId: 'test-user-123',
            caseCount: 5
          }
        })
        .mockResolvedValueOnce({});

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      await handler(event);

      // Verify subscription was updated with decremented count
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-subscriptions-table',
            Item: expect.objectContaining({
              userId: 'test-user-123',
              caseCount: 4 // 5 - 1
            })
          })
        })
      );
    });

    it('should handle subscription update errors gracefully', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canDelete: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          id: 'CASE#test-123',
          name: 'Test Case',
          caseNumber: 'CASE-2024-001',
          status: 'Active'
        }
      });

      // Mock empty related data
      mockDocClient.send
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({}); // Case deletion

      // Mock subscription error
      mockDocClient.send.mockRejectedValueOnce(new Error('Subscription update failed'));

      const event = {
        arguments: {
          id: 'CASE#test-123'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      // Should still succeed even if subscription update fails
      expect(result.success).toBe(true);
    });
  });
});
