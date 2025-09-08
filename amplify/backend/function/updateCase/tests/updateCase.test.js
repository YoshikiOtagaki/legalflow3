// LegalFlow3 - Update Case Lambda Function Tests
// Unit tests for case update functionality

const { handler } = require('../src/index');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb');

const mockDocClient = {
  send: jest.fn()
};

DynamoDBDocumentClient.from = jest.fn(() => mockDocClient);

describe('Update Case Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CASES_TABLE_NAME = 'test-cases-table';
    process.env.CASE_ASSIGNMENTS_TABLE_NAME = 'test-case-assignments-table';
  });

  describe('Successful case updates', () => {
    it('should update case with valid input', async () => {
      // Mock permission check
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      // Mock successful update
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          name: 'Updated Case Name',
          status: 'Active',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      // Mock last accessed time update
      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case Name',
            status: 'Active'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case.name).toBe('Updated Case Name');
      expect(result.case.status).toBe('Active');
    });

    it('should update only provided fields', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          name: 'Original Name',
          status: 'Updated Status',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            status: 'Closed'
            // Only updating status
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case.status).toBe('Updated Status');
    });

    it('should handle all updatable fields', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          name: 'Updated Case',
          caseNumber: 'CASE-2024-002',
          status: 'Suspended',
          trialLevel: 'Appeal',
          hourlyRate: 60000,
          categoryId: 'new-category-123',
          currentPhaseId: 'new-phase-123',
          courtDivisionId: 'new-court-123',
          firstConsultationDate: '2024-01-01',
          engagementDate: '2024-01-02',
          caseClosedDate: '2024-12-31',
          litigationStartDate: '2024-02-01',
          oralArgumentEndDate: '2024-11-30',
          judgmentDate: '2024-12-15',
          judgmentReceivedDate: '2024-12-20',
          hasEngagementLetter: true,
          engagementLetterPath: '/new/path.pdf',
          remarks: 'Updated remarks',
          customProperties: { newKey: 'newValue' },
          tags: ['updated', 'urgent'],
          priority: 'Urgent',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case',
            caseNumber: 'CASE-2024-002',
            status: 'Suspended',
            trialLevel: 'Appeal',
            hourlyRate: 60000,
            categoryId: 'new-category-123',
            currentPhaseId: 'new-phase-123',
            courtDivisionId: 'new-court-123',
            firstConsultationDate: '2024-01-01',
            engagementDate: '2024-01-02',
            caseClosedDate: '2024-12-31',
            litigationStartDate: '2024-02-01',
            oralArgumentEndDate: '2024-11-30',
            judgmentDate: '2024-12-15',
            judgmentReceivedDate: '2024-12-20',
            hasEngagementLetter: true,
            engagementLetterPath: '/new/path.pdf',
            remarks: 'Updated remarks',
            customProperties: { newKey: 'newValue' },
            tags: ['updated', 'urgent'],
            priority: 'Urgent'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.case.name).toBe('Updated Case');
      expect(result.case.status).toBe('Suspended');
      expect(result.case.priority).toBe('Urgent');
    });
  });

  describe('Permission validation', () => {
    it('should allow update for Lead role', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: false } // Even without explicit permission, Lead should be allowed
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          name: 'Updated Case',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
    });

    it('should allow update for user with canEdit permission', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Collaborator',
          permissions: { canEdit: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          name: 'Updated Case',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(true);
    });

    it('should deny update for user without permission', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Collaborator',
          permissions: { canEdit: false }
        }
      });

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User does not have permission to update this case');
    });

    it('should deny update for inactive user', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: false,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User does not have permission to update this case');
    });

    it('should deny update for non-assigned user', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        // No item returned - user not assigned to case
      });

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User does not have permission to update this case');
    });
  });

  describe('Error handling', () => {
    it('should return error when user ID is missing', async () => {
      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        }
        // No identity provided
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User ID is required');
    });

    it('should return error when case ID is missing', async () => {
      const event = {
        arguments: {
          input: {
            name: 'Updated Case'
            // id is missing
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Case ID is required');
    });

    it('should return error when no fields to update', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123'
            // No fields to update
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('No fields to update');
    });

    it('should handle DynamoDB errors gracefully', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      mockDocClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
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

  describe('Update expression building', () => {
    it('should build correct update expression for single field', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          name: 'Updated Case',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            name: 'Updated Case'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      await handler(event);

      // Verify the update command was called with correct expression
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-cases-table',
            Key: { id: 'CASE#test-123' },
            UpdateExpression: expect.stringContaining('name = :name'),
            ExpressionAttributeValues: expect.objectContaining({
              ':name': 'Updated Case',
              ':updatedAt': expect.any(String)
            })
          })
        })
      );
    });

    it('should handle reserved words in update expression', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          caseId: 'CASE#test-123',
          userId: 'test-user-123',
          isActive: true,
          role: 'Lead',
          permissions: { canEdit: true }
        }
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: {
          id: 'CASE#test-123',
          status: 'Updated Status',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      });

      mockDocClient.send.mockResolvedValueOnce({});

      const event = {
        arguments: {
          input: {
            id: 'CASE#test-123',
            status: 'Updated Status'
          }
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      await handler(event);

      // Verify the update command was called with expression attribute names for reserved words
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UpdateExpression: expect.stringContaining('#status = :status'),
            ExpressionAttributeNames: expect.objectContaining({
              '#status': 'status'
            }),
            ExpressionAttributeValues: expect.objectContaining({
              ':status': 'Updated Status'
            })
          })
        })
      );
    });
  });
});
