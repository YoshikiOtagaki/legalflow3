// Delete Document Lambda Function
// Handles document deletion (soft delete) with proper validation and error handling

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper function to validate delete input
const validateDeleteInput = (input) => {
  const errors = [];

  if (!input.id) {
    errors.push('Document ID is required');
  }

  return errors;
};

// Helper function to check document access
const checkDocumentAccess = async (documentId, userId, userRole) => {
  try {
    const document = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: documentId, SK: documentId }
    }));

    if (!document.Item) {
      return { hasAccess: false, error: 'Document not found' };
    }

    // Check if user has access to the case
    const caseId = document.Item.caseId;
    const caseAssignment = await docClient.send(new GetCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE,
      Key: { PK: caseId, SK: userId }
    }));

    if (!caseAssignment.Item && userRole !== 'admin') {
      return { hasAccess: false, error: 'Access denied' };
    }

    return { hasAccess: true, document: document.Item };
  } catch (error) {
    console.error('Error checking document access:', error);
    return { hasAccess: false, error: 'Access check failed' };
  }
};

// Main handler
exports.handler = async (event) => {
  console.log('Delete Document Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { userId, userRole } = event.identity;

    // Validate input
    const validationErrors = validateDeleteInput(input);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: {
          message: 'Validation failed',
          details: validationErrors
        }
      };
    }

    // Check document access
    const accessCheck = await checkDocumentAccess(input.id, userId, userRole);
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        error: {
          message: 'Access denied',
          details: [accessCheck.error]
        }
      };
    }

    const now = new Date().toISOString();

    // Soft delete by setting TTL to current time
    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: 'SET #ttl = :ttl, #updatedAt = :updatedAt, #updatedById = :updatedById',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
        '#updatedAt': 'updatedAt',
        '#updatedById': 'updatedById'
      },
      ExpressionAttributeValues: {
        ':ttl': Math.floor(Date.now() / 1000),
        ':updatedAt': now,
        ':updatedById': userId
      }
    }));

    // Log successful deletion
    console.log(`Document deleted successfully: ${input.id}`);

    return {
      success: true,
      message: 'Document deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting document:', error);

    return {
      success: false,
      error: {
        message: 'Internal server error',
        details: [error.message]
      }
    };
  }
};
