// LegalFlow3 - AppSync Configuration
// AppSync GraphQL API configuration

export const appsyncConfig = {
  name: 'LegalFlow3GraphQLAPI',
  apiId: process.env.APPSYNC_API_ID,
  region: process.env.AWS_REGION,
  endpoint: process.env.APPSYNC_ENDPOINT,
  authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  userPoolConfig: {
    userPoolId: process.env.USER_POOL_ID,
    awsRegion: process.env.AWS_REGION,
    defaultAction: 'ALLOW'
  },
  additionalAuthenticationProviders: [
    {
      authenticationType: 'API_KEY',
      apiKeyConfig: {
        description: 'API Key for public access',
        apiKeyExpirationDays: 30
      }
    }
  ],
  logConfig: {
    fieldLogLevel: 'ERROR',
    cloudWatchLogsRoleArn: process.env.CLOUDWATCH_LOGS_ROLE_ARN
  },
  xrayEnabled: true,
  tags: {
    Project: 'LegalFlow3',
    Environment: process.env.NODE_ENV || 'development',
    Service: 'GraphQL-API'
  }
};

export const dataSourceConfig = {
  // DynamoDB Data Sources
  casesDataSource: {
    type: 'AMAZON_DYNAMODB',
    name: 'CasesDataSource',
    description: 'DynamoDB data source for Cases table',
    serviceRoleArn: process.env.DYNAMODB_SERVICE_ROLE_ARN,
    dynamodbConfig: {
      tableName: process.env.CASES_TABLE_NAME,
      useCallerCredentials: false
    }
  },

  caseAssignmentsDataSource: {
    type: 'AMAZON_DYNAMODB',
    name: 'CaseAssignmentsDataSource',
    description: 'DynamoDB data source for CaseAssignments table',
    serviceRoleArn: process.env.DYNAMODB_SERVICE_ROLE_ARN,
    dynamodbConfig: {
      tableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      useCallerCredentials: false
    }
  },

  // Lambda Data Sources
  createCaseDataSource: {
    type: 'AWS_LAMBDA',
    name: 'CreateCaseDataSource',
    description: 'Lambda data source for createCase function',
    serviceRoleArn: process.env.LAMBDA_SERVICE_ROLE_ARN,
    lambdaConfig: {
      lambdaFunctionArn: process.env.CREATE_CASE_FUNCTION_ARN
    }
  },

  updateCaseDataSource: {
    type: 'AWS_LAMBDA',
    name: 'UpdateCaseDataSource',
    description: 'Lambda data source for updateCase function',
    serviceRoleArn: process.env.LAMBDA_SERVICE_ROLE_ARN,
    lambdaConfig: {
      lambdaFunctionArn: process.env.UPDATE_CASE_FUNCTION_ARN
    }
  },

  deleteCaseDataSource: {
    type: 'AWS_LAMBDA',
    name: 'DeleteCaseDataSource',
    description: 'Lambda data source for deleteCase function',
    serviceRoleArn: process.env.LAMBDA_SERVICE_ROLE_ARN,
    lambdaConfig: {
      lambdaFunctionArn: process.env.DELETE_CASE_FUNCTION_ARN
    }
  },

  getCaseDataSource: {
    type: 'AWS_LAMBDA',
    name: 'GetCaseDataSource',
    description: 'Lambda data source for getCase function',
    serviceRoleArn: process.env.LAMBDA_SERVICE_ROLE_ARN,
    lambdaConfig: {
      lambdaFunctionArn: process.env.GET_CASE_FUNCTION_ARN
    }
  },

  listCasesDataSource: {
    type: 'AWS_LAMBDA',
    name: 'ListCasesDataSource',
    description: 'Lambda data source for listCases function',
    serviceRoleArn: process.env.LAMBDA_SERVICE_ROLE_ARN,
    lambdaConfig: {
      lambdaFunctionArn: process.env.LIST_CASES_FUNCTION_ARN
    }
  },

  searchCasesDataSource: {
    type: 'AWS_LAMBDA',
    name: 'SearchCasesDataSource',
    description: 'Lambda data source for searchCases function',
    serviceRoleArn: process.env.LAMBDA_SERVICE_ROLE_ARN,
    lambdaConfig: {
      lambdaFunctionArn: process.env.SEARCH_CASES_FUNCTION_ARN
    }
  }
};

export const resolverConfig = {
  // Query Resolvers
  getCaseResolver: {
    typeName: 'Query',
    fieldName: 'getCase',
    dataSourceName: 'GetCaseDataSource',
    requestMappingTemplate: 'getCaseRequest.vtl',
    responseMappingTemplate: 'getCaseResponse.vtl'
  },

  listCasesResolver: {
    typeName: 'Query',
    fieldName: 'listCases',
    dataSourceName: 'ListCasesDataSource',
    requestMappingTemplate: 'listCasesRequest.vtl',
    responseMappingTemplate: 'listCasesResponse.vtl'
  },

  searchCasesResolver: {
    typeName: 'Query',
    fieldName: 'searchCases',
    dataSourceName: 'SearchCasesDataSource',
    requestMappingTemplate: 'searchCasesRequest.vtl',
    responseMappingTemplate: 'searchCasesResponse.vtl'
  },

  // Mutation Resolvers
  createCaseResolver: {
    typeName: 'Mutation',
    fieldName: 'createCase',
    dataSourceName: 'CreateCaseDataSource',
    requestMappingTemplate: 'createCaseRequest.vtl',
    responseMappingTemplate: 'createCaseResponse.vtl'
  },

  updateCaseResolver: {
    typeName: 'Mutation',
    fieldName: 'updateCase',
    dataSourceName: 'UpdateCaseDataSource',
    requestMappingTemplate: 'updateCaseRequest.vtl',
    responseMappingTemplate: 'updateCaseResponse.vtl'
  },

  deleteCaseResolver: {
    typeName: 'Mutation',
    fieldName: 'deleteCase',
    dataSourceName: 'DeleteCaseDataSource',
    requestMappingTemplate: 'deleteCaseRequest.vtl',
    responseMappingTemplate: 'deleteCaseResponse.vtl'
  },

  // Subscription Resolvers
  onCaseCreatedResolver: {
    typeName: 'Subscription',
    fieldName: 'onCaseCreated',
    dataSourceName: 'CasesDataSource',
    requestMappingTemplate: 'onCaseCreatedRequest.vtl',
    responseMappingTemplate: 'onCaseCreatedResponse.vtl'
  },

  onCaseUpdatedResolver: {
    typeName: 'Subscription',
    fieldName: 'onCaseUpdated',
    dataSourceName: 'CasesDataSource',
    requestMappingTemplate: 'onCaseUpdatedRequest.vtl',
    responseMappingTemplate: 'onCaseUpdatedResponse.vtl'
  },

  onCaseDeletedResolver: {
    typeName: 'Subscription',
    fieldName: 'onCaseDeleted',
    dataSourceName: 'CasesDataSource',
    requestMappingTemplate: 'onCaseDeletedRequest.vtl',
    responseMappingTemplate: 'onCaseDeletedResponse.vtl'
  }
};
