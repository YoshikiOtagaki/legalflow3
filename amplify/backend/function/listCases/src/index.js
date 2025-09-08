// LegalFlow3 - List Cases Lambda Function
// AWS Lambda with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('List Cases Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from event
    const userId = event.identity?.sub || event.userId;
    const limit = event.arguments?.limit || 20;
    const nextToken = event.arguments?.nextToken || null;
    const status = event.arguments?.status || null;
    const categoryId = event.arguments?.categoryId || null;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's case assignments
    const assignmentsQuery = new QueryCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      IndexName: 'UserCasesIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit * 2, // Get more assignments to account for filtering
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
    });

    const assignmentsResult = await docClient.send(assignmentsQuery);
    const assignments = assignmentsResult.Items || [];

    if (assignments.length === 0) {
      return {
        success: true,
        cases: [],
        nextToken: null,
        totalCount: 0
      };
    }

    // Get case details for each assignment
    const cases = [];
    const caseIds = assignments.map(assignment => assignment.caseId);

    for (const caseId of caseIds) {
      try {
        const getCaseCommand = new GetCommand({
          TableName: process.env.CASES_TABLE_NAME,
          Key: { id: caseId }
        });

        const caseResult = await docClient.send(getCaseCommand);

        if (caseResult.Item) {
          // Apply filters
          let includeCase = true;

          if (status && caseResult.Item.status !== status) {
            includeCase = false;
          }

          if (categoryId && caseResult.Item.categoryId !== categoryId) {
            includeCase = false;
          }

          if (includeCase) {
            // Add assignment info to case
            const assignment = assignments.find(a => a.caseId === caseId);
            cases.push({
              ...caseResult.Item,
              userRole: assignment.role,
              assignedAt: assignment.assignedAt,
              lastAccessedAt: assignment.lastAccessedAt,
              permissions: assignment.permissions
            });
          }
        }
      } catch (error) {
        console.error(`Error getting case ${caseId}:`, error);
        // Continue with other cases
      }
    }

    // Sort cases by lastAccessedAt (most recent first)
    cases.sort((a, b) => {
      const aTime = new Date(a.lastAccessedAt || a.createdAt).getTime();
      const bTime = new Date(b.lastAccessedAt || b.createdAt).getTime();
      return bTime - aTime;
    });

    // Apply limit
    const limitedCases = cases.slice(0, limit);

    // Prepare next token
    let nextTokenResult = null;
    if (assignmentsResult.LastEvaluatedKey && limitedCases.length === limit) {
      nextTokenResult = Buffer.from(JSON.stringify(assignmentsResult.LastEvaluatedKey)).toString('base64');
    }

    return {
      success: true,
      cases: limitedCases,
      nextToken: nextTokenResult,
      totalCount: cases.length
    };

  } catch (error) {
    console.error('Error listing cases:', error);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.name || 'ListCasesError'
      }
    };
  }
};

// Helper function to get cases by status
async function getCasesByStatus(status, limit = 20, nextToken = null) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.CASES_TABLE_NAME,
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      },
      Limit: limit,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
    });

    const result = await docClient.send(queryCommand);

    return {
      cases: result.Items || [],
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null
    };
  } catch (error) {
    console.error('Error getting cases by status:', error);
    throw error;
  }
}

// Helper function to get cases by category
async function getCasesByCategory(categoryId, limit = 20, nextToken = null) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.CASES_TABLE_NAME,
      IndexName: 'CategoryIndex',
      KeyConditionExpression: 'categoryId = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId
      },
      Limit: limit,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
    });

    const result = await docClient.send(queryCommand);

    return {
      cases: result.Items || [],
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null
    };
  } catch (error) {
    console.error('Error getting cases by category:', error);
    throw error;
  }
}
