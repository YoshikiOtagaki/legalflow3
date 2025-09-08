// Tests for Create Document Lambda Function

const { handler } = require('../src/index');

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

describe('Create Document Lambda Function', () => {
  let mockDocClient;

  beforeEach(() => {
    mockDocClient = {
      send: jest.fn()
    };
    DynamoDBDocumentClient.from = jest.fn().mockReturnValue(mockDocClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject request with missing title', async () => {
      const event = {
        arguments: {
          input: {
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Title is required');
    });

    it('should reject request with missing typeId', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Type ID is required');
    });

    it('should reject request with missing statusId', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Status ID is required');
    });

    it('should reject request with missing caseId', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Case ID is required');
    });

    it('should reject request with title too long', async () => {
      const event = {
        arguments: {
          input: {
            title: 'a'.repeat(256),
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Title must be 255 characters or less');
    });

    it('should reject request with description too long', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            description: 'a'.repeat(1001),
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Description must be 1000 characters or less');
    });

    it('should reject request with too many tags', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123',
            tags: Array(11).fill('tag')
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toContain('Maximum 10 tags allowed');
    });
  });

  describe('Access Control', () => {
    it('should reject request from user without case access', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'lawyer'
        }
      };

      // Mock case assignment check to return no access
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Access denied');
      expect(result.error.details).toContain('You do not have access to this case');
    });

    it('should allow request from admin user', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock successful validations
      mockDocClient.send
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Document type
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Document status
        .mockResolvedValueOnce({}) // Put document
        .mockResolvedValueOnce({ Item: { name: 'Test Type' } }) // Document type for response
        .mockResolvedValueOnce({ Item: { name: 'Test Status' } }) // Document status for response
        .mockResolvedValueOnce({ Item: { name: 'Test Case' } }) // Case for response
        .mockResolvedValueOnce({ Item: { name: 'Test User' } }) // Created by for response
        .mockResolvedValueOnce({ Item: { name: 'Test User' } }); // Updated by for response

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document.title).toBe('Test Document');
    });
  });

  describe('Document Type Validation', () => {
    it('should reject request with invalid document type', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'invalid-type',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock case assignment check to return access
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock document type check to return not found
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid document type');
      expect(result.error.details).toContain('Document type not found');
    });

    it('should reject request with inactive document type', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock case assignment check to return access
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock document type check to return inactive
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: false } });

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid document type');
      expect(result.error.details).toContain('Document type is not active');
    });
  });

  describe('Document Status Validation', () => {
    it('should reject request with invalid document status', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'invalid-status',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock case assignment check to return access
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock document type check to return valid
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock document status check to return not found
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid document status');
      expect(result.error.details).toContain('Document status not found');
    });
  });

  describe('Template Validation', () => {
    it('should reject request with invalid template', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123',
            templateId: 'invalid-template'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock case assignment check to return access
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock document type check to return valid
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock document status check to return valid
      mockDocClient.send.mockResolvedValueOnce({ Item: { isActive: true } });

      // Mock template check to return not found
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid document template');
      expect(result.error.details).toContain('Document template not found');
    });
  });

  describe('Successful Document Creation', () => {
    it('should create document successfully with all required fields', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock successful validations
      mockDocClient.send
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Document type
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Document status
        .mockResolvedValueOnce({}) // Put document
        .mockResolvedValueOnce({ Item: { name: 'Test Type' } }) // Document type for response
        .mockResolvedValueOnce({ Item: { name: 'Test Status' } }) // Document status for response
        .mockResolvedValueOnce({ Item: { name: 'Test Case' } }) // Case for response
        .mockResolvedValueOnce({ Item: { name: 'Test User' } }) // Created by for response
        .mockResolvedValueOnce({ Item: { name: 'Test User' } }); // Updated by for response

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document.title).toBe('Test Document');
      expect(result.document.typeId).toBe('type-123');
      expect(result.document.statusId).toBe('status-123');
      expect(result.document.caseId).toBe('case-123');
      expect(result.document.version).toBe(1);
      expect(result.document.isLatest).toBe(true);
      expect(result.document.createdById).toBe('user-123');
      expect(result.document.updatedById).toBe('user-123');
    });

    it('should create document successfully with optional fields', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            description: 'Test description',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123',
            templateId: 'template-123',
            filePath: 'path/to/file.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            tags: ['tag1', 'tag2'],
            metadata: { key: 'value' }
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock successful validations
      mockDocClient.send
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Document type
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Document status
        .mockResolvedValueOnce({ Item: { isActive: true } }) // Template
        .mockResolvedValueOnce({}) // Put document
        .mockResolvedValueOnce({ Item: { name: 'Test Type' } }) // Document type for response
        .mockResolvedValueOnce({ Item: { name: 'Test Status' } }) // Document status for response
        .mockResolvedValueOnce({ Item: { name: 'Test Case' } }) // Case for response
        .mockResolvedValueOnce({ Item: { name: 'Test User' } }) // Created by for response
        .mockResolvedValueOnce({ Item: { name: 'Test User' } }); // Updated by for response

      const result = await handler(event);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document.title).toBe('Test Document');
      expect(result.document.description).toBe('Test description');
      expect(result.document.templateId).toBe('template-123');
      expect(result.document.filePath).toBe('path/to/file.pdf');
      expect(result.document.fileSize).toBe(1024);
      expect(result.document.mimeType).toBe('application/pdf');
      expect(result.document.tags).toEqual(['tag1', 'tag2']);
      expect(result.document.metadata).toEqual({ key: 'value' });
    });
  });

  describe('Error Handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      const event = {
        arguments: {
          input: {
            title: 'Test Document',
            typeId: 'type-123',
            statusId: 'status-123',
            caseId: 'case-123'
          }
        },
        identity: {
          userId: 'user-123',
          userRole: 'admin'
        }
      };

      // Mock DynamoDB error
      mockDocClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      const result = await handler(event);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Internal server error');
      expect(result.error.details).toContain('DynamoDB error');
    });
  });
});
