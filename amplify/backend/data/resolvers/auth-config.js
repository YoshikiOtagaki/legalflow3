// LegalFlow3 - Authentication Configuration
// Authentication and authorization configuration for AppSync

export const authConfig = {
  defaultAuthorizationMode: 'AMAZON_COGNITO_USER_POOLS',
  additionalAuthorizationModes: [
    {
      authorizationType: 'API_KEY',
      apiKeyConfig: {
        description: 'API Key for public access',
        apiKeyExpirationDays: 30
      }
    }
  ],
  userPoolConfig: {
    userPoolId: process.env.USER_POOL_ID,
    awsRegion: process.env.AWS_REGION,
    defaultAction: 'ALLOW'
  }
};

export const authorizationRules = {
  // Case management rules
  caseRules: [
    {
      allow: 'owner',
      operations: ['create', 'read', 'update', 'delete'],
      identityClaim: 'sub'
    }
  ],

  // User management rules
  userRules: [
    {
      allow: 'owner',
      operations: ['read', 'update'],
      identityClaim: 'sub'
    }
  ],

  // Subscription rules
  subscriptionRules: [
    {
      allow: 'owner',
      operations: ['read', 'update'],
      identityClaim: 'sub'
    }
  ],

  // Public read rules for reference data
  publicReadRules: [
    {
      allow: 'public',
      operations: ['read'],
      provider: 'apiKey'
    }
  ]
};
