// LegalFlow3 - Create Case Lambda Function
// AWS Lambda with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Create Case Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Extract input from event
    const input = event.arguments?.input || event;
    const userId = event.identity?.sub || event.userId;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate required fields
    if (!input.name) {
      throw new Error('Case name is required');
    }

    if (!input.categoryId) {
      throw new Error('Category ID is required');
    }

    // Generate case ID
    const caseId = `CASE#${uuidv4()}`;
    const now = new Date().toISOString();

    // Prepare case data
    const caseData = {
      id: caseId,
      name: input.name,
      caseNumber: input.caseNumber || null,
      status: input.status || 'Active',
      trialLevel: input.trialLevel || null,
      hourlyRate: input.hourlyRate || null,
      categoryId: input.categoryId,
      currentPhaseId: input.currentPhaseId || null,
      courtDivisionId: input.courtDivisionId || null,
      createdAt: now,
      updatedAt: now,
      firstConsultationDate: input.firstConsultationDate || null,
      engagementDate: input.engagementDate || null,
      caseClosedDate: input.caseClosedDate || null,
      litigationStartDate: input.litigationStartDate || null,
      oralArgumentEndDate: input.oralArgumentEndDate || null,
      judgmentDate: input.judgmentDate || null,
      judgmentReceivedDate: input.judgmentReceivedDate || null,
      hasEngagementLetter: input.hasEngagementLetter || false,
      engagementLetterPath: input.engagementLetterPath || null,
      remarks: input.remarks || null,
      customProperties: input.customProperties || null,
      tags: input.tags || [],
      priority: input.priority || 'Medium'
    };

    // Create case in DynamoDB
    const putCommand = new PutCommand({
      TableName: process.env.CASES_TABLE_NAME,
      Item: caseData,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    await docClient.send(putCommand);

    // Create case assignment for the user
    const assignmentId = `ASSIGNMENT#${uuidv4()}`;
    const assignment = {
      id: assignmentId,
      caseId: caseId,
      userId: userId,
      role: 'Lead', // Creator is always the lead
      permissions: {
        canEdit: true,
        canDelete: true,
        canAssign: true,
        canViewFinancials: true
      },
      assignedAt: now,
      lastAccessedAt: now,
      isActive: true
    };

    const assignmentCommand = new PutCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE_NAME,
      Item: assignment
    });

    await docClient.send(assignmentCommand);

    // Update user's case count in subscription
    await updateUserCaseCount(userId, 1);

    // Return the created case
    return {
      success: true,
      case: caseData,
      assignment: assignment
    };

  } catch (error) {
    console.error('Error creating case:', error);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.name || 'CreateCaseError'
      }
    };
  }
};

// Helper function to update user's case count
async function updateUserCaseCount(userId, increment) {
  try {
    const getCommand = new GetCommand({
      TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
      Key: { userId: userId }
    });

    const result = await docClient.send(getCommand);

    if (result.Item) {
      const newCount = (result.Item.caseCount || 0) + increment;

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
