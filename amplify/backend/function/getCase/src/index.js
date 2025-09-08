// LegalFlow3 - Get Case Lambda Function
// AWS Lambda with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Get Case Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from event
    const caseId = event.arguments?.id || event.id;
    const userId = event.identity?.sub || event.userId;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!caseId) {
      throw new Error('Case ID is required');
    }

    // Check if user has permission to access the case
    const hasPermission = await checkCasePermission(caseId, userId);
    if (!hasPermission) {
      throw new Error('User does not have permission to access this case');
    }

    // Get case details
    const getCaseCommand = new GetCommand({
      TableName: process.env.CASES_TABLE_NAME,
      Key: { id: caseId }
    });

    const caseResult = await docClient.send(getCaseCommand);
    if (!caseResult.Item) {
      throw new Error('Case not found');
    }

    // Get related data
    const [assignments, parties, tasks, timesheetEntries, memos] = await Promise.all([
      getCaseAssignments(caseId),
      getCaseParties(caseId),
      getCaseTasks(caseId),
      getCaseTimesheetEntries(caseId),
      getCaseMemos(caseId)
    ]);

    // Update last accessed time for the user
    await updateLastAccessedTime(caseId, userId);

    // Build comprehensive case object
    const caseData = {
      ...caseResult.Item,
      assignments: assignments,
      parties: parties,
      tasks: tasks,
      timesheetEntries: timesheetEntries,
      memos: memos,
      stats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.isCompleted).length,
        totalTimeSpent: timesheetEntries.reduce((total, entry) => total + (entry.duration || 0), 0),
        totalParties: parties.length,
        totalMemos: memos.length
      }
    };

    return {
      success: true,
      case: caseData
    };

  } catch (error) {
    console.error('Error getting case:', error);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.name || 'GetCaseError'
      }
    };
  }
};

// Helper function to check if user has permission to access the case
async function checkCasePermission(caseId, userId) {
  try {
    const getCommand = new GetCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      Key: {
        caseId: caseId,
        userId: userId
      }
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return false;
    }

    // Check if user is active on the case
    return result.Item.isActive;
  } catch (error) {
    console.error('Error checking case permission:', error);
    return false;
  }
}

// Helper function to get case assignments
async function getCaseAssignments(caseId) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(queryCommand);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting case assignments:', error);
    return [];
  }
}

// Helper function to get case parties
async function getCaseParties(caseId) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.CASE_PARTIES_TABLE_NAME,
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(queryCommand);
    const parties = result.Items || [];

    // Get party details for each party
    const partyDetails = [];
    for (const party of parties) {
      try {
        const getPartyCommand = new GetCommand({
          TableName: process.env.PARTIES_TABLE_NAME,
          Key: { id: party.partyId }
        });

        const partyResult = await docClient.send(getPartyCommand);
        if (partyResult.Item) {
          partyDetails.push({
            ...party,
            partyDetails: partyResult.Item
          });
        }
      } catch (error) {
        console.error(`Error getting party ${party.partyId}:`, error);
        partyDetails.push(party);
      }
    }

    return partyDetails;
  } catch (error) {
    console.error('Error getting case parties:', error);
    return [];
  }
}

// Helper function to get case tasks
async function getCaseTasks(caseId) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.TASKS_TABLE_NAME,
      IndexName: 'CaseTasksIndex',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(queryCommand);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting case tasks:', error);
    return [];
  }
}

// Helper function to get case timesheet entries
async function getCaseTimesheetEntries(caseId) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE_NAME,
      IndexName: 'CaseTimesheetIndex',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(queryCommand);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting case timesheet entries:', error);
    return [];
  }
}

// Helper function to get case memos
async function getCaseMemos(caseId) {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.MEMOS_TABLE_NAME,
      IndexName: 'byCase',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(queryCommand);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting case memos:', error);
    return [];
  }
}

// Helper function to update last accessed time
async function updateLastAccessedTime(caseId, userId) {
  try {
    const updateCommand = new UpdateCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      Key: {
        caseId: caseId,
        userId: userId
      },
      UpdateExpression: 'SET lastAccessedAt = :lastAccessedAt',
      ExpressionAttributeValues: {
        ':lastAccessedAt': new Date().toISOString()
      }
    });

    await docClient.send(updateCommand);
  } catch (error) {
    console.error('Error updating last accessed time:', error);
    // Don't throw error here as it's not critical
  }
}
