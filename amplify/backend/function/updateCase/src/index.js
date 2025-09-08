// LegalFlow3 - Update Case Lambda Function
// AWS Lambda with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Update Case Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Extract input from event
    const input = event.arguments?.input || event;
    const userId = event.identity?.sub || event.userId;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!input.id) {
      throw new Error('Case ID is required');
    }

    // Check if user has permission to update the case
    const hasPermission = await checkCasePermission(input.id, userId, 'update');
    if (!hasPermission) {
      throw new Error('User does not have permission to update this case');
    }

    const now = new Date().toISOString();

    // Build update expression dynamically
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Fields that can be updated
    const updatableFields = [
      'name', 'caseNumber', 'status', 'trialLevel', 'hourlyRate',
      'categoryId', 'currentPhaseId', 'courtDivisionId',
      'firstConsultationDate', 'engagementDate', 'caseClosedDate',
      'litigationStartDate', 'oralArgumentEndDate', 'judgmentDate',
      'judgmentReceivedDate', 'hasEngagementLetter', 'engagementLetterPath',
      'remarks', 'customProperties', 'tags', 'priority'
    ];

    // Process each field
    updatableFields.forEach(field => {
      if (input[field] !== undefined) {
        if (field === 'name' || field === 'status' || field === 'priority') {
          // These fields need expression attribute names
          updateExpression.push(`#${field} = :${field}`);
          expressionAttributeNames[`#${field}`] = field;
        } else {
          updateExpression.push(`${field} = :${field}`);
        }
        expressionAttributeValues[`:${field}`] = input[field];
      }
    });

    // Always update the updatedAt field
    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    if (updateExpression.length === 1) {
      // Only updatedAt was added, no actual fields to update
      throw new Error('No fields to update');
    }

    // Update the case
    const updateCommand = new UpdateCommand({
      TableName: process.env.CASES_TABLE_NAME,
      Key: { id: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);

    // Update last accessed time for the user
    await updateLastAccessedTime(input.id, userId);

    return {
      success: true,
      case: result.Attributes
    };

  } catch (error) {
    console.error('Error updating case:', error);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.name || 'UpdateCaseError'
      }
    };
  }
};

// Helper function to check if user has permission to update the case
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
    if (operation === 'update') {
      return result.Item.permissions?.canEdit || result.Item.role === 'Lead';
    }

    if (operation === 'delete') {
      return result.Item.permissions?.canDelete || result.Item.role === 'Lead';
    }

    return true;
  } catch (error) {
    console.error('Error checking case permission:', error);
    return false;
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
