// LegalFlow3 - Delete Case Lambda Function
// AWS Lambda with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Delete Case Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Extract input from event
    const caseId = event.arguments?.id || event.id;
    const userId = event.identity?.sub || event.userId;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!caseId) {
      throw new Error('Case ID is required');
    }

    // Check if user has permission to delete the case
    const hasPermission = await checkCasePermission(caseId, userId, 'delete');
    if (!hasPermission) {
      throw new Error('User does not have permission to delete this case');
    }

    // Get the case details before deletion
    const getCaseCommand = new GetCommand({
      TableName: process.env.CASES_TABLE_NAME,
      Key: { id: caseId }
    });

    const caseResult = await docClient.send(getCaseCommand);
    if (!caseResult.Item) {
      throw new Error('Case not found');
    }

    // Delete related data first
    await deleteRelatedData(caseId);

    // Delete the case
    const deleteCommand = new DeleteCommand({
      TableName: process.env.CASES_TABLE_NAME,
      Key: { id: caseId }
    });

    await docClient.send(deleteCommand);

    // Update user's case count in subscription
    await updateUserCaseCount(userId, -1);

    return {
      success: true,
      case: caseResult.Item,
      message: 'Case deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting case:', error);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.name || 'DeleteCaseError'
      }
    };
  }
};

// Helper function to check if user has permission to delete the case
async function checkCasePermission(caseId, userId, operation) {
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
    if (!result.Item.isActive) {
      return false;
    }

    // Check specific permissions based on operation
    if (operation === 'delete') {
      return result.Item.permissions?.canDelete || result.Item.role === 'Lead';
    }

    return true;
  } catch (error) {
    console.error('Error checking case permission:', error);
    return false;
  }
}

// Helper function to delete all related data
async function deleteRelatedData(caseId) {
  try {
    // Delete case assignments
    const assignmentsQuery = new QueryCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const assignmentsResult = await docClient.send(assignmentsQuery);

    for (const assignment of assignmentsResult.Items || []) {
      const deleteAssignmentCommand = new DeleteCommand({
        TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
        Key: {
          caseId: assignment.caseId,
          userId: assignment.userId
        }
      });

      await docClient.send(deleteAssignmentCommand);
    }

    // Delete case parties
    const partiesQuery = new QueryCommand({
      TableName: process.env.CASE_PARTIES_TABLE_NAME,
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const partiesResult = await docClient.send(partiesQuery);

    for (const party of partiesResult.Items || []) {
      const deletePartyCommand = new DeleteCommand({
        TableName: process.env.CASE_PARTIES_TABLE_NAME,
        Key: {
          caseId: party.caseId,
          partyId: party.partyId,
          role: party.role
        }
      });

      await docClient.send(deletePartyCommand);
    }

    // Delete tasks
    const tasksQuery = new QueryCommand({
      TableName: process.env.TASKS_TABLE_NAME,
      IndexName: 'CaseTasksIndex',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const tasksResult = await docClient.send(tasksQuery);

    for (const task of tasksResult.Items || []) {
      const deleteTaskCommand = new DeleteCommand({
        TableName: process.env.TASKS_TABLE_NAME,
        Key: { id: task.id }
      });

      await docClient.send(deleteTaskCommand);
    }

    // Delete timesheet entries
    const timesheetQuery = new QueryCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE_NAME,
      IndexName: 'CaseTimesheetIndex',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const timesheetResult = await docClient.send(timesheetQuery);

    for (const entry of timesheetResult.Items || []) {
      const deleteTimesheetCommand = new DeleteCommand({
        TableName: process.env.TIMESHEET_ENTRIES_TABLE_NAME,
        Key: { id: entry.id }
      });

      await docClient.send(deleteTimesheetCommand);
    }

    // Delete memos
    const memosQuery = new QueryCommand({
      TableName: process.env.MEMOS_TABLE_NAME,
      IndexName: 'byCase',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const memosResult = await docClient.send(memosQuery);

    for (const memo of memosResult.Items || []) {
      const deleteMemoCommand = new DeleteCommand({
        TableName: process.env.MEMOS_TABLE_NAME,
        Key: { id: memo.id }
      });

      await docClient.send(deleteMemoCommand);
    }

    console.log(`Deleted related data for case ${caseId}`);

  } catch (error) {
    console.error('Error deleting related data:', error);
    throw error;
  }
}

// Helper function to update user's case count
async function updateUserCaseCount(userId, increment) {
  try {
    const getCommand = new GetCommand({
      TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
      Key: { userId: userId }
    });

    const result = await docClient.send(getCommand);

    if (result.Item) {
      const newCount = Math.max(0, (result.Item.caseCount || 0) + increment);

      const updateCommand = new PutCommand({
        TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
        Item: {
          ...result.Item,
          caseCount: newCount,
          updatedAt: new Date().toISOString()
        }
      });

      await docClient.send(updateCommand);
    }
  } catch (error) {
    console.error('Error updating user case count:', error);
    // Don't throw error here as it's not critical
  }
}
