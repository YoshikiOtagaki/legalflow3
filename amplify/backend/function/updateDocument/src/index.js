// Update Document Lambda Function
// Handles document updates with proper validation and error handling

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper function to validate update input
const validateUpdateInput = (input) => {
  const errors = [];

  if (!input.id) {
    errors.push('Document ID is required');
  }

  if (input.title !== undefined && input.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  }

  if (input.title && input.title.length > 255) {
    errors.push('Title must be 255 characters or less');
  }

  if (input.description && input.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }

  if (input.tags && input.tags.length > 10) {
    errors.push('Maximum 10 tags allowed');
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

// Helper function to validate document status if provided
const validateDocumentStatus = async (statusId) => {
  try {
    if (!statusId) {
      return { valid: true };
    }

    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_STATUSES_TABLE,
      Key: { PK: statusId, SK: statusId }
    }));

    if (!result.Item) {
      return { valid: false, error: 'Document status not found' };
    }

    if (!result.Item.isActive) {
      return { valid: false, error: 'Document status is not active' };
    }

    return { valid: true, status: result.Item };
  } catch (error) {
    console.error('Error validating document status:', error);
    return { valid: false, error: error.message };
  }
};

// Main handler
exports.handler = async (event) => {
  console.log('Update Document Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { userId, userRole } = event.identity;

    // Validate input
    const validationErrors = validateUpdateInput(input);
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

    // Validate document status if provided
    if (input.statusId) {
      const statusValidation = await validateDocumentStatus(input.statusId);
      if (!statusValidation.valid) {
        return {
          success: false,
          error: {
            message: 'Invalid document status',
            details: [statusValidation.error]
          }
        };
      }
    }

    const now = new Date().toISOString();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression dynamically
    if (input.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionNames['#title'] = 'title';
      expressionValues[':title'] = input.title.trim();
    }

    if (input.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionNames['#description'] = 'description';
      expressionValues[':description'] = input.description.trim();
    }

    if (input.statusId !== undefined) {
      updateExpression.push('#statusId = :statusId');
      expressionNames['#statusId'] = 'statusId';
      expressionValues[':statusId'] = input.statusId;
    }

    if (input.tags !== undefined) {
      updateExpression.push('#tags = :tags');
      expressionNames['#tags'] = 'tags';
      expressionValues[':tags'] = input.tags;
    }

    if (input.metadata !== undefined) {
      updateExpression.push('#metadata = :metadata');
      expressionNames['#metadata'] = 'metadata';
      expressionValues[':metadata'] = input.metadata;
    }

    // Always update these fields
    updateExpression.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';
    expressionValues[':updatedAt'] = now;

    updateExpression.push('#updatedById = :updatedById');
    expressionNames['#updatedById'] = 'updatedById';
    expressionValues[':updatedById'] = userId;

    const updateParams = {
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    const updatedDocument = result.Attributes;

    // Get related data for response
    const [documentType, documentStatus, caseData, createdBy, updatedBy] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Key: { PK: updatedDocument.typeId, SK: updatedDocument.typeId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_STATUSES_TABLE,
        Key: { PK: updatedDocument.statusId, SK: updatedDocument.statusId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.CASES_TABLE,
        Key: { PK: updatedDocument.caseId, SK: updatedDocument.caseId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: updatedDocument.createdById, SK: updatedDocument.createdById }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: updatedDocument.updatedById, SK: updatedDocument.updatedById }
      }))
    ]);

    // Log successful update
    console.log(`Document updated successfully: ${input.id}`);

    return {
      success: true,
      document: {
        ...updatedDocument,
        type: documentType.Item,
        status: documentStatus.Item,
        case: caseData.Item,
        createdBy: createdBy.Item,
        updatedBy: updatedBy.Item
      }
    };

  } catch (error) {
    console.error('Error updating document:', error);

    return {
      success: false,
      error: {
        message: 'Internal server error',
        details: [error.message]
      }
    };
  }
};
