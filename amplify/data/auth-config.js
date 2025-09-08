// LegalFlow3 GraphQL Authentication & Authorization Configuration
// AWS AppSync with Cognito integration

// =============================================================================
// Authentication Configuration
// =============================================================================

exports.authConfig = {
  // Default authentication mode
  defaultAuthentication: {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: process.env.USER_POOL_ID,
      awsRegion: process.env.AWS_REGION,
      defaultAction: 'ALLOW'
    }
  },

  // Additional authentication modes
  additionalAuthenticationProviders: [
    {
      authenticationType: 'API_KEY',
      apiKeyConfig: {
        description: 'API Key for public access',
        apiKeyExpirationDays: 365
      }
    },
    {
      authenticationType: 'AWS_IAM',
      iamConfig: {
        signingRegion: process.env.AWS_REGION,
        signingServiceName: 'appsync'
      }
    }
  ]
};

// =============================================================================
// Authorization Rules
// =============================================================================

exports.authorizationRules = {
  // User model authorization
  User: [
    {
      allow: 'owner',
      operations: ['read', 'update'],
      identityClaim: 'sub'
    },
    {
      allow: 'groups',
      groups: ['Lawyers'],
      operations: ['read']
    }
  ],

  // Case model authorization
  Case: [
    {
      allow: 'owner',
      operations: ['create', 'read', 'update', 'delete'],
      identityClaim: 'sub'
    },
    {
      allow: 'groups',
      groups: ['Lawyers'],
      operations: ['read']
    }
  ],

  // Task model authorization
  Task: [
    {
      allow: 'owner',
      operations: ['create', 'read', 'update', 'delete'],
      identityClaim: 'sub'
    },
    {
      allow: 'groups',
      groups: ['Lawyers'],
      operations: ['read']
    }
  ],

  // TimesheetEntry model authorization
  TimesheetEntry: [
    {
      allow: 'owner',
      operations: ['create', 'read', 'update', 'delete'],
      identityClaim: 'sub'
    },
    {
      allow: 'groups',
      groups: ['Lawyers'],
      operations: ['read']
    }
  ],

  // Notification model authorization
  Notification: [
    {
      allow: 'owner',
      operations: ['create', 'read', 'update', 'delete'],
      identityClaim: 'sub'
    }
  ]
};

// =============================================================================
// Custom Authorization Logic
// =============================================================================

exports.customAuthorization = {
  // Check if user can access case
  canAccessCase: async (ctx) => {
    const userId = ctx.identity?.sub;
    const caseId = ctx.arguments.caseId || ctx.source?.id;

    if (!userId || !caseId) {
      return false;
    }

    // Check if user is assigned to the case
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
      const command = new QueryCommand({
        TableName: 'LegalFlow3-CaseAssignments',
        IndexName: 'UserCasesIndex',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'caseId = :caseId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':caseId': caseId
        }
      });

      const result = await docClient.send(command);
      return result.Items && result.Items.length > 0;
    } catch (error) {
      console.error('Error checking case access:', error);
      return false;
    }
  },

  // Check if user can modify case
  canModifyCase: async (ctx) => {
    const userId = ctx.identity?.sub;
    const caseId = ctx.arguments.caseId || ctx.source?.id;

    if (!userId || !caseId) {
      return false;
    }

    // Check if user is the lead on the case
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
      const command = new QueryCommand({
        TableName: 'LegalFlow3-CaseAssignments',
        IndexName: 'UserCasesIndex',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'caseId = :caseId AND #role = :role',
        ExpressionAttributeNames: {
          '#role': 'role'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':caseId': caseId,
          ':role': 'Lead'
        }
      });

      const result = await docClient.send(command);
      return result.Items && result.Items.length > 0;
    } catch (error) {
      console.error('Error checking case modification access:', error);
      return false;
    }
  },

  // Check if user can access task
  canAccessTask: async (ctx) => {
    const userId = ctx.identity?.sub;
    const taskId = ctx.arguments.taskId || ctx.source?.id;

    if (!userId || !taskId) {
      return false;
    }

    // Get task details
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
      const command = new GetCommand({
        TableName: 'LegalFlow3-Tasks',
        Key: { id: taskId }
      });

      const result = await docClient.send(command);
      if (!result.Item) {
        return false;
      }

      // Check if user can access the case
      return await exports.customAuthorization.canAccessCase({
        identity: { sub: userId },
        arguments: { caseId: result.Item.caseId }
      });
    } catch (error) {
      console.error('Error checking task access:', error);
      return false;
    }
  },

  // Check if user can access timesheet entry
  canAccessTimesheetEntry: async (ctx) => {
    const userId = ctx.identity?.sub;
    const entryId = ctx.arguments.entryId || ctx.source?.id;

    if (!userId || !entryId) {
      return false;
    }

    // Get timesheet entry details
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
      const command = new GetCommand({
        TableName: 'LegalFlow3-TimesheetEntries',
        Key: { id: entryId }
      });

      const result = await docClient.send(command);
      if (!result.Item) {
        return false;
      }

      // Check if user owns the entry or can access the case
      if (result.Item.userId === userId) {
        return true;
      }

      return await exports.customAuthorization.canAccessCase({
        identity: { sub: userId },
        arguments: { caseId: result.Item.caseId }
      });
    } catch (error) {
      console.error('Error checking timesheet entry access:', error);
      return false;
    }
  }
};

// =============================================================================
// Role-Based Access Control (RBAC)
// =============================================================================

exports.rbacConfig = {
  roles: {
    Lawyer: {
      permissions: [
        'cases:read',
        'cases:create',
        'cases:update',
        'cases:delete',
        'tasks:read',
        'tasks:create',
        'tasks:update',
        'tasks:delete',
        'timesheet:read',
        'timesheet:create',
        'timesheet:update',
        'timesheet:delete',
        'notifications:read',
        'notifications:create',
        'notifications:update',
        'notifications:delete',
        'parties:read',
        'parties:create',
        'parties:update',
        'parties:delete'
      ]
    },
    Paralegal: {
      permissions: [
        'cases:read',
        'tasks:read',
        'tasks:create',
        'tasks:update',
        'timesheet:read',
        'timesheet:create',
        'timesheet:update',
        'notifications:read',
        'parties:read',
        'parties:create',
        'parties:update'
      ]
    }
  },

  // Check if user has permission
  hasPermission: async (ctx, permission) => {
    const userId = ctx.identity?.sub;
    if (!userId) {
      return false;
    }

    // Get user role from JWT token
    const userRole = ctx.identity?.claims?.['custom:role'] || 'Paralegal';

    const rolePermissions = exports.rbacConfig.roles[userRole]?.permissions || [];
    return rolePermissions.includes(permission);
  }
};

// =============================================================================
// Subscription Authorization
// =============================================================================

exports.subscriptionAuth = {
  // Authorize case subscription
  authorizeCaseSubscription: async (ctx) => {
    const userId = ctx.identity?.sub;
    const caseId = ctx.arguments.caseId;

    if (!userId || !caseId) {
      return false;
    }

    return await exports.customAuthorization.canAccessCase({
      identity: { sub: userId },
      arguments: { caseId }
    });
  },

  // Authorize notification subscription
  authorizeNotificationSubscription: async (ctx) => {
    const userId = ctx.identity?.sub;
    const targetUserId = ctx.arguments.userId;

    if (!userId || !targetUserId) {
      return false;
    }

    // Users can only subscribe to their own notifications
    return userId === targetUserId;
  },

  // Authorize task subscription
  authorizeTaskSubscription: async (ctx) => {
    const userId = ctx.identity?.sub;
    const taskId = ctx.arguments.taskId;

    if (!userId || !taskId) {
      return false;
    }

    return await exports.customAuthorization.canAccessTask({
      identity: { sub: userId },
      arguments: { taskId }
    });
  }
};

// =============================================================================
// API Key Management
// =============================================================================

exports.apiKeyConfig = {
  // Generate API key for public access
  generateApiKey: async () => {
    const { AppSyncClient, CreateApiKeyCommand } = require('@aws-sdk/client-appsync');

    const client = new AppSyncClient({ region: process.env.AWS_REGION });

    try {
      const command = new CreateApiKeyCommand({
        apiId: process.env.APPSYNC_API_ID,
        description: 'Public API Key for LegalFlow3',
        expires: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
      });

      const result = await client.send(command);
      return result.apiKey;
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  },

  // Validate API key
  validateApiKey: async (apiKey) => {
    const { AppSyncClient, ListApiKeysCommand } = require('@aws-sdk/client-appsync');

    const client = new AppSyncClient({ region: process.env.AWS_REGION });

    try {
      const command = new ListApiKeysCommand({
        apiId: process.env.APPSYNC_API_ID
      });

      const result = await client.send(command);
      const validKeys = result.apiKeys?.filter(key =>
        key.id === apiKey &&
        key.expires > Math.floor(Date.now() / 1000)
      ) || [];

      return validKeys.length > 0;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
};

// =============================================================================
// Security Headers
// =============================================================================

exports.securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// =============================================================================
// Rate Limiting
// =============================================================================

exports.rateLimiting = {
  // Rate limit configuration
  limits: {
    queries: {
      perMinute: 100,
      perHour: 1000
    },
    mutations: {
      perMinute: 50,
      perHour: 500
    },
    subscriptions: {
      perMinute: 10,
      perHour: 100
    }
  },

  // Check rate limit
  checkRateLimit: async (ctx, operation) => {
    const userId = ctx.identity?.sub;
    const operationType = operation || 'queries';

    if (!userId) {
      return true; // Allow for API key access
    }

    // In a real implementation, you'd use Redis or DynamoDB
    // to track rate limits per user
    // For now, we'll allow all operations
    return true;
  }
};

// =============================================================================
// Audit Logging
// =============================================================================

exports.auditLogging = {
  // Log authentication events
  logAuthEvent: async (ctx, event) => {
    const userId = ctx.identity?.sub;
    const timestamp = new Date().toISOString();

    console.log(`[AUDIT] ${timestamp} - User: ${userId} - Event: ${event}`);

    // In a real implementation, you'd send this to CloudWatch Logs
    // or another logging service
  },

  // Log data access
  logDataAccess: async (ctx, resource, action) => {
    const userId = ctx.identity?.sub;
    const timestamp = new Date().toISOString();

    console.log(`[AUDIT] ${timestamp} - User: ${userId} - Resource: ${resource} - Action: ${action}`);
  },

  // Log errors
  logError: async (ctx, error) => {
    const userId = ctx.identity?.sub;
    const timestamp = new Date().toISOString();

    console.error(`[AUDIT] ${timestamp} - User: ${userId} - Error: ${error.message}`);
  }
};
