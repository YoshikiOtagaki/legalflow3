// Create Document Lambda Function
// Handles document creation with proper validation and error handling

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper function to generate CUID
const generateCUID = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `c${timestamp}${random}`;
};

// Helper function to validate document input
const validateDocumentInput = (input) => {
  const errors = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!input.typeId) {
    errors.push('Type ID is required');
  }

  if (!input.statusId) {
    errors.push('Status ID is required');
  }

  if (!input.caseId) {
    errors.push('Case ID is required');
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

// Helper function to check case access
const checkCaseAccess = async (caseId, userId, userRole) => {
  try {
    if (userRole === 'admin') {
      return { hasAccess: true };
    }

    const caseAssignment = await docClient.send(new GetCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE,
      Key: { PK: caseId, SK: userId }
    }));

    return { hasAccess: !!caseAssignment.Item };
  } catch (error) {
    console.error('Error checking case access:', error);
    return { hasAccess: false, error: error.message };
  }
};

// Helper function to validate document type
const validateDocumentType = async (typeId) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_TYPES_TABLE,
      Key: { PK: typeId, SK: typeId }
    }));

    if (!result.Item) {
      return { valid: false, error: 'Document type not found' };
    }

    if (!result.Item.isActive) {
      return { valid: false, error: 'Document type is not active' };
    }

    return { valid: true, type: result.Item };
  } catch (error) {
    console.error('Error validating document type:', error);
    return { valid: false, error: error.message };
  }
};

// Helper function to validate document status
const validateDocumentStatus = async (statusId) => {
  try {
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

// Helper function to validate template if provided
const validateTemplate = async (templateId) => {
  try {
    if (!templateId) {
      return { valid: true };
    }

    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      Key: { PK: templateId, SK: templateId }
    }));

    if (!result.Item) {
      return { valid: false, error: 'Document template not found' };
    }

    if (!result.Item.isActive) {
      return { valid: false, error: 'Document template is not active' };
    }

    return { valid: true, template: result.Item };
  } catch (error) {
    console.error('Error validating template:', error);
    return { valid: false, error: error.message };
  }
};

// Main handler
exports.handler = async (event) => {
  console.log('Create Document Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { userId, userRole } = event.identity;

    // Validate input
    const validationErrors = validateDocumentInput(input);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: {
          message: 'Validation failed',
          details: validationErrors
        }
      };
    }

    // Check case access
    const caseAccess = await checkCaseAccess(input.caseId, userId, userRole);
    if (!caseAccess.hasAccess) {
      return {
        success: false,
        error: {
          message: 'Access denied',
          details: ['You do not have access to this case']
        }
      };
    }

    // Validate document type
    const typeValidation = await validateDocumentType(input.typeId);
    if (!typeValidation.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid document type',
          details: [typeValidation.error]
        }
      };
    }

    // Validate document status
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

    // Validate template if provided
    const templateValidation = await validateTemplate(input.templateId);
    if (!templateValidation.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid document template',
          details: [templateValidation.error]
        }
      };
    }

    // Generate document ID
    const documentId = generateCUID();
    const now = new Date().toISOString();

    // Create document record
    const document = {
      PK: documentId,
      SK: documentId,
      GSI1PK: input.caseId,
      GSI1SK: now,
      GSI2PK: userId,
      GSI2SK: now,
      GSI3PK: input.typeId,
      GSI3SK: now,
      GSI4PK: input.statusId,
      GSI4SK: now,
      id: documentId,
      title: input.title.trim(),
      description: input.description ? input.description.trim() : '',
      typeId: input.typeId,
      statusId: input.statusId,
      caseId: input.caseId,
      templateId: input.templateId || null,
      filePath: input.filePath || null,
      fileSize: input.fileSize || null,
      mimeType: input.mimeType || null,
      version: 1,
      isLatest: true,
      parentDocumentId: null,
      tags: input.tags || [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      updatedById: userId,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    // Save document to DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Item: document
    }));

    // Get related data for response
    const [documentType, documentStatus, caseData, createdBy, updatedBy] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Key: { PK: input.typeId, SK: input.typeId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_STATUSES_TABLE,
        Key: { PK: input.statusId, SK: input.statusId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.CASES_TABLE,
        Key: { PK: input.caseId, SK: input.caseId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: userId, SK: userId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: userId, SK: userId }
      }))
    ]);

    // Log successful creation
    console.log(`Document created successfully: ${documentId}`);

    return {
      success: true,
      document: {
        ...document,
        type: documentType.Item,
        status: documentStatus.Item,
        case: caseData.Item,
        createdBy: createdBy.Item,
        updatedBy: updatedBy.Item
      }
    };

  } catch (error) {
    console.error('Error creating document:', error);

    return {
      success: false,
      error: {
        message: 'Internal server error',
        details: [error.message]
      }
    };
  }
};
