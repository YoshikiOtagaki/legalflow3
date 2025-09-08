// LegalFlow3 - Search Cases Lambda Function
// AWS Lambda with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Search Cases Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from event
    const userId = event.identity?.sub || event.userId;
    const filter = event.arguments?.filter || event.filter || {};
    const limit = event.arguments?.limit || 20;
    const nextToken = event.arguments?.nextToken || null;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's accessible case IDs
    const userCaseIds = await getUserCaseIds(userId);

    if (userCaseIds.length === 0) {
      return {
        success: true,
        cases: [],
        nextToken: null,
        totalCount: 0
      };
    }

    // Build search parameters
    const searchParams = buildSearchParams(filter, userCaseIds, limit, nextToken);

    // Perform search
    const searchCommand = new ScanCommand(searchParams);
    const result = await docClient.send(searchCommand);

    // Process results
    const cases = result.Items || [];

    // Add user role and permissions to each case
    const enrichedCases = await enrichCasesWithUserData(cases, userId);

    // Sort results by relevance (lastAccessedAt or createdAt)
    enrichedCases.sort((a, b) => {
      const aTime = new Date(a.lastAccessedAt || a.createdAt).getTime();
      const bTime = new Date(b.lastAccessedAt || b.createdAt).getTime();
      return bTime - aTime;
    });

    // Prepare next token
    let nextTokenResult = null;
    if (result.LastEvaluatedKey && enrichedCases.length === limit) {
      nextTokenResult = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return {
      success: true,
      cases: enrichedCases,
      nextToken: nextTokenResult,
      totalCount: enrichedCases.length
    };

  } catch (error) {
    console.error('Error searching cases:', error);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.name || 'SearchCasesError'
      }
    };
  }
};

// Helper function to get user's accessible case IDs
async function getUserCaseIds(userId) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      IndexName: 'UserCasesIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true
      }
    });

    const result = await docClient.send(queryCommand);
    return result.Items?.map(item => item.caseId) || [];
  } catch (error) {
    console.error('Error getting user case IDs:', error);
    return [];
  }
}

// Helper function to build search parameters
function buildSearchParams(filter, userCaseIds, limit, nextToken) {
  const params = {
    TableName: process.env.CASES_TABLE_NAME,
    Limit: limit,
    ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
  };

  // Build filter expression
  const conditions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Filter by user's accessible cases
  conditions.push('id IN (:caseIds)');
  expressionAttributeValues[':caseIds'] = userCaseIds;

  // Apply search filters
  if (filter.name) {
    conditions.push('contains(#name, :name)');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = filter.name;
  }

  if (filter.caseNumber) {
    conditions.push('contains(caseNumber, :caseNumber)');
    expressionAttributeValues[':caseNumber'] = filter.caseNumber;
  }

  if (filter.status) {
    conditions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = filter.status;
  }

  if (filter.categoryId) {
    conditions.push('categoryId = :categoryId');
    expressionAttributeValues[':categoryId'] = filter.categoryId;
  }

  if (filter.priority) {
    conditions.push('#priority = :priority');
    expressionAttributeNames['#priority'] = 'priority';
    expressionAttributeValues[':priority'] = filter.priority;
  }

  if (filter.tags && filter.tags.length > 0) {
    // DynamoDB doesn't support array contains directly, so we check each tag
    filter.tags.forEach((tag, index) => {
      conditions.push(`contains(tags, :tag${index})`);
      expressionAttributeValues[`:tag${index}`] = tag;
    });
  }

  if (filter.dateRange) {
    if (filter.dateRange.startDate) {
      conditions.push('#createdAt >= :startDate');
      expressionAttributeNames['#createdAt'] = 'createdAt';
      expressionAttributeValues[':startDate'] = filter.dateRange.startDate;
    }
    if (filter.dateRange.endDate) {
      conditions.push('#createdAt <= :endDate');
      expressionAttributeNames['#createdAt'] = 'createdAt';
      expressionAttributeValues[':endDate'] = filter.dateRange.endDate;
    }
  }

  // Add filter expression if conditions exist
  if (conditions.length > 0) {
    params.FilterExpression = conditions.join(' AND ');
  }

  // Add expression attribute names and values
  if (Object.keys(expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  if (Object.keys(expressionAttributeValues).length > 0) {
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  return params;
}

// Helper function to enrich cases with user data
async function enrichCasesWithUserData(cases, userId) {
  const enrichedCases = [];

  for (const caseData of cases) {
    try {
      // Get user's assignment info for this case
      const getAssignmentCommand = new GetCommand({
        TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
        Key: {
          caseId: caseData.id,
          userId: userId
        }
      });

      const assignmentResult = await docClient.send(getAssignmentCommand);

      if (assignmentResult.Item) {
        enrichedCases.push({
          ...caseData,
          userRole: assignmentResult.Item.role,
          assignedAt: assignmentResult.Item.assignedAt,
          lastAccessedAt: assignmentResult.Item.lastAccessedAt,
          permissions: assignmentResult.Item.permissions
        });
      }
    } catch (error) {
      console.error(`Error enriching case ${caseData.id}:`, error);
      enrichedCases.push(caseData);
    }
  }

  return enrichedCases;
}

// Helper function for advanced search with full-text search capabilities
async function advancedSearch(filter, userCaseIds, limit, nextToken) {
  try {
    // This would integrate with Amazon OpenSearch or Elasticsearch
    // For now, we'll use DynamoDB scan with more sophisticated filtering

    const searchTerms = [];

    if (filter.query) {
      // Split query into terms for partial matching
      const terms = filter.query.toLowerCase().split(/\s+/);
      terms.forEach((term, index) => {
        searchTerms.push({
          field: 'name',
          value: term,
          operator: 'contains'
        });
      });
    }

    // Build more complex search parameters
    const params = buildAdvancedSearchParams(searchTerms, userCaseIds, limit, nextToken);

    const searchCommand = new ScanCommand(params);
    const result = await docClient.send(searchCommand);

    return {
      cases: result.Items || [],
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null
    };
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
}

// Helper function to build advanced search parameters
function buildAdvancedSearchParams(searchTerms, userCaseIds, limit, nextToken) {
  const params = {
    TableName: process.env.CASES_TABLE_NAME,
    Limit: limit,
    ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
  };

  const conditions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Filter by user's accessible cases
  conditions.push('id IN (:caseIds)');
  expressionAttributeValues[':caseIds'] = userCaseIds;

  // Add search term conditions
  searchTerms.forEach((term, index) => {
    conditions.push(`contains(#name, :term${index})`);
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[`:term${index}`] = term.value;
  });

  if (conditions.length > 0) {
    params.FilterExpression = conditions.join(' AND ');
  }

  if (Object.keys(expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  if (Object.keys(expressionAttributeValues).length > 0) {
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  return params;
}
