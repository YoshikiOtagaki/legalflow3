// Document Management GraphQL Mutation Resolvers
// Handles all document-related mutations with proper error handling and authorization

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { createHash } = require('crypto');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper function to check user permissions
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

// Helper function to generate CUID
const generateCUID = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `c${timestamp}${random}`;
};

// Create document
const createDocument = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    // Check if user has access to the case
    const caseAssignment = await docClient.send(new GetCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE,
      Key: { PK: input.caseId, SK: userId }
    }));

    if (!caseAssignment.Item && userRole !== 'admin') {
      throw new Error('Access denied to case');
    }

    const documentId = generateCUID();
    const now = new Date().toISOString();

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
      title: input.title,
      description: input.description || '',
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

    return {
      ...document,
      type: documentType.Item,
      status: documentStatus.Item,
      case: caseData.Item,
      createdBy: createdBy.Item,
      updatedBy: updatedBy.Item
    };
  } catch (error) {
    console.error('Error creating document:', error);
    throw new Error(`Failed to create document: ${error.message}`);
  }
};

// Update document
const updateDocument = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    // Check access to document
    const accessCheck = await checkDocumentAccess(input.id, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const now = new Date().toISOString();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression dynamically
    if (input.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionNames['#title'] = 'title';
      expressionValues[':title'] = input.title;
    }

    if (input.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionNames['#description'] = 'description';
      expressionValues[':description'] = input.description;
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

    return {
      ...updatedDocument,
      type: documentType.Item,
      status: documentStatus.Item,
      case: caseData.Item,
      createdBy: createdBy.Item,
      updatedBy: updatedBy.Item
    };
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }
};

// Delete document (soft delete)
const deleteDocument = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    // Check access to document
    const accessCheck = await checkDocumentAccess(id, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    // Soft delete by setting TTL to current time
    const now = Math.floor(Date.now() / 1000);

    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET #ttl = :ttl, #updatedAt = :updatedAt, #updatedById = :updatedById',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
        '#updatedAt': 'updatedAt',
        '#updatedById': 'updatedById'
      },
      ExpressionAttributeValues: {
        ':ttl': now,
        ':updatedAt': new Date().toISOString(),
        ':updatedById': userId
      }
    }));

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

// Restore document
const restoreDocument = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    // Check access to document
    const accessCheck = await checkDocumentAccess(id, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    // Restore by setting TTL to future time
    const futureTTL = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now

    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET #ttl = :ttl, #updatedAt = :updatedAt, #updatedById = :updatedById',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
        '#updatedAt': 'updatedAt',
        '#updatedById': 'updatedById'
      },
      ExpressionAttributeValues: {
        ':ttl': futureTTL,
        ':updatedAt': new Date().toISOString(),
        ':updatedById': userId
      }
    }));

    // Get the restored document
    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: id, SK: id }
    }));

    return result.Item;
  } catch (error) {
    console.error('Error restoring document:', error);
    throw new Error(`Failed to restore document: ${error.message}`);
  }
};

// Create document version
const createDocumentVersion = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    // Check access to parent document
    const accessCheck = await checkDocumentAccess(input.documentId, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const parentDocument = accessCheck.document;
    const newVersion = parentDocument.version + 1;
    const now = new Date().toISOString();

    // Create version record
    const version = {
      PK: input.documentId,
      SK: `v${newVersion.toString().padStart(3, '0')}`,
      GSI1PK: input.documentId,
      GSI1SK: `v${newVersion.toString().padStart(3, '0')}`,
      id: `${input.documentId}_v${newVersion}`,
      documentId: input.documentId,
      version: newVersion,
      filePath: input.filePath,
      fileSize: input.fileSize || null,
      mimeType: input.mimeType || null,
      changeDescription: input.changeDescription || '',
      createdAt: now,
      createdById: userId,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_VERSIONS_TABLE,
      Item: version
    }));

    // Update parent document
    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: input.documentId, SK: input.documentId },
      UpdateExpression: 'SET #version = :version, #filePath = :filePath, #fileSize = :fileSize, #mimeType = :mimeType, #updatedAt = :updatedAt, #updatedById = :updatedById',
      ExpressionAttributeNames: {
        '#version': 'version',
        '#filePath': 'filePath',
        '#fileSize': 'fileSize',
        '#mimeType': 'mimeType',
        '#updatedAt': 'updatedAt',
        '#updatedById': 'updatedById'
      },
      ExpressionAttributeValues: {
        ':version': newVersion,
        ':filePath': input.filePath,
        ':fileSize': input.fileSize || null,
        ':mimeType': input.mimeType || null,
        ':updatedAt': now,
        ':updatedById': userId
      }
    }));

    // Get creator information
    const createdBy = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { PK: userId, SK: userId }
    }));

    return {
      ...version,
      createdBy: createdBy.Item
    };
  } catch (error) {
    console.error('Error creating document version:', error);
    throw new Error(`Failed to create document version: ${error.message}`);
  }
};

// Delete document version
const deleteDocumentVersion = async (args, context) => {
  try {
    const { documentId, version } = args;
    const { userId, userRole } = context.identity;

    // Check access to parent document
    const accessCheck = await checkDocumentAccess(documentId, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    // Soft delete version
    const now = Math.floor(Date.now() / 1000);

    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENT_VERSIONS_TABLE,
      Key: { PK: documentId, SK: `v${version.toString().padStart(3, '0')}` },
      UpdateExpression: 'SET #ttl = :ttl',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':ttl': now }
    }));

    return true;
  } catch (error) {
    console.error('Error deleting document version:', error);
    throw new Error(`Failed to delete document version: ${error.message}`);
  }
};

// Create document template
const createDocumentTemplate = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    const templateId = generateCUID();
    const now = new Date().toISOString();

    const template = {
      PK: templateId,
      SK: templateId,
      GSI1PK: input.typeId,
      GSI1SK: `template-${input.name}`,
      GSI2PK: input.category,
      GSI2SK: `template-${input.name}`,
      id: templateId,
      name: input.name,
      description: input.description || '',
      typeId: input.typeId,
      category: input.category,
      content: input.content,
      placeholders: input.placeholders || [],
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      Item: template
    }));

    // Get related data for response
    const [documentType, createdBy] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Key: { PK: input.typeId, SK: input.typeId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: userId, SK: userId }
      }))
    ]);

    return {
      ...template,
      type: documentType.Item,
      createdBy: createdBy.Item
    };
  } catch (error) {
    console.error('Error creating document template:', error);
    throw new Error(`Failed to create document template: ${error.message}`);
  }
};

// Update document template
const updateDocumentTemplate = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    const now = new Date().toISOString();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression dynamically
    if (input.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionNames['#name'] = 'name';
      expressionValues[':name'] = input.name;
    }

    if (input.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionNames['#description'] = 'description';
      expressionValues[':description'] = input.description;
    }

    if (input.category !== undefined) {
      updateExpression.push('#category = :category');
      expressionNames['#category'] = 'category';
      expressionValues[':category'] = input.category;
    }

    if (input.content !== undefined) {
      updateExpression.push('#content = :content');
      expressionNames['#content'] = 'content';
      expressionValues[':content'] = input.content;
    }

    if (input.placeholders !== undefined) {
      updateExpression.push('#placeholders = :placeholders');
      expressionNames['#placeholders'] = 'placeholders';
      expressionValues[':placeholders'] = input.placeholders;
    }

    if (input.isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionNames['#isActive'] = 'isActive';
      expressionValues[':isActive'] = input.isActive;
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';
    expressionValues[':updatedAt'] = now;

    const updateParams = {
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    const updatedTemplate = result.Attributes;

    // Get related data for response
    const [documentType, createdBy] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Key: { PK: updatedTemplate.typeId, SK: updatedTemplate.typeId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: updatedTemplate.createdById, SK: updatedTemplate.createdById }
      }))
    ]);

    return {
      ...updatedTemplate,
      type: documentType.Item,
      createdBy: createdBy.Item
    };
  } catch (error) {
    console.error('Error updating document template:', error);
    throw new Error(`Failed to update document template: ${error.message}`);
  }
};

// Delete document template
const deleteDocumentTemplate = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    // Soft delete template
    const now = Math.floor(Date.now() / 1000);

    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET #ttl = :ttl, #updatedAt = :updatedAt, #updatedById = :updatedById',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
        '#updatedAt': 'updatedAt',
        '#updatedById': 'updatedById'
      },
      ExpressionAttributeValues: {
        ':ttl': now,
        ':updatedAt': new Date().toISOString(),
        ':updatedById': userId
      }
    }));

    return true;
  } catch (error) {
    console.error('Error deleting document template:', error);
    throw new Error(`Failed to delete document template: ${error.message}`);
  }
};

// Create document type
const createDocumentType = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    const typeId = generateCUID();
    const now = new Date().toISOString();

    const documentType = {
      PK: typeId,
      SK: typeId,
      GSI1PK: input.category,
      GSI1SK: `type-${input.name}`,
      id: typeId,
      name: input.name,
      description: input.description || '',
      category: input.category,
      mimeTypes: input.mimeTypes || [],
      maxFileSize: input.maxFileSize || 10485760, // 10MB default
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_TYPES_TABLE,
      Item: documentType
    }));

    return documentType;
  } catch (error) {
    console.error('Error creating document type:', error);
    throw new Error(`Failed to create document type: ${error.message}`);
  }
};

// Update document type
const updateDocumentType = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    const now = new Date().toISOString();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression dynamically
    if (input.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionNames['#name'] = 'name';
      expressionValues[':name'] = input.name;
    }

    if (input.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionNames['#description'] = 'description';
      expressionValues[':description'] = input.description;
    }

    if (input.category !== undefined) {
      updateExpression.push('#category = :category');
      expressionNames['#category'] = 'category';
      expressionValues[':category'] = input.category;
    }

    if (input.mimeTypes !== undefined) {
      updateExpression.push('#mimeTypes = :mimeTypes');
      expressionNames['#mimeTypes'] = 'mimeTypes';
      expressionValues[':mimeTypes'] = input.mimeTypes;
    }

    if (input.maxFileSize !== undefined) {
      updateExpression.push('#maxFileSize = :maxFileSize');
      expressionNames['#maxFileSize'] = 'maxFileSize';
      expressionValues[':maxFileSize'] = input.maxFileSize;
    }

    if (input.isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionNames['#isActive'] = 'isActive';
      expressionValues[':isActive'] = input.isActive;
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';
    expressionValues[':updatedAt'] = now;

    const updateParams = {
      TableName: process.env.DOCUMENT_TYPES_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating document type:', error);
    throw new Error(`Failed to update document type: ${error.message}`);
  }
};

// Delete document type
const deleteDocumentType = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    // Soft delete type
    const now = Math.floor(Date.now() / 1000);

    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENT_TYPES_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET #ttl = :ttl, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':ttl': now,
        ':updatedAt': new Date().toISOString()
      }
    }));

    return true;
  } catch (error) {
    console.error('Error deleting document type:', error);
    throw new Error(`Failed to delete document type: ${error.message}`);
  }
};

// Create document status
const createDocumentStatus = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    const statusId = generateCUID();
    const now = new Date().toISOString();

    const documentStatus = {
      PK: statusId,
      SK: statusId,
      GSI1PK: input.category,
      GSI1SK: `status-${input.name}`,
      id: statusId,
      name: input.name,
      description: input.description || '',
      category: input.category,
      color: input.color || '#6B7280',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_STATUSES_TABLE,
      Item: documentStatus
    }));

    return documentStatus;
  } catch (error) {
    console.error('Error creating document status:', error);
    throw new Error(`Failed to create document status: ${error.message}`);
  }
};

// Update document status
const updateDocumentStatus = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    const now = new Date().toISOString();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression dynamically
    if (input.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionNames['#name'] = 'name';
      expressionValues[':name'] = input.name;
    }

    if (input.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionNames['#description'] = 'description';
      expressionValues[':description'] = input.description;
    }

    if (input.category !== undefined) {
      updateExpression.push('#category = :category');
      expressionNames['#category'] = 'category';
      expressionValues[':category'] = input.category;
    }

    if (input.color !== undefined) {
      updateExpression.push('#color = :color');
      expressionNames['#color'] = 'color';
      expressionValues[':color'] = input.color;
    }

    if (input.isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionNames['#isActive'] = 'isActive';
      expressionValues[':isActive'] = input.isActive;
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';
    expressionValues[':updatedAt'] = now;

    const updateParams = {
      TableName: process.env.DOCUMENT_STATUSES_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw new Error(`Failed to update document status: ${error.message}`);
  }
};

// Delete document status
const deleteDocumentStatus = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    // Soft delete status
    const now = Math.floor(Date.now() / 1000);

    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENT_STATUSES_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET #ttl = :ttl, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':ttl': now,
        ':updatedAt': new Date().toISOString()
      }
    }));

    return true;
  } catch (error) {
    console.error('Error deleting document status:', error);
    throw new Error(`Failed to delete document status: ${error.message}`);
  }
};

// Generate document
const generateDocument = async (args, context) => {
  try {
    const { input } = args;
    const { userId, userRole } = context.identity;

    // Check if user has access to the case
    const caseAssignment = await docClient.send(new GetCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE,
      Key: { PK: input.caseId, SK: userId }
    }));

    if (!caseAssignment.Item && userRole !== 'admin') {
      throw new Error('Access denied to case');
    }

    // Get template
    const template = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      Key: { PK: input.templateId, SK: input.templateId }
    }));

    if (!template.Item) {
      throw new Error('Document template not found');
    }

    // Generate document using template
    const documentId = generateCUID();
    const now = new Date().toISOString();

    // In a real implementation, this would call a document generation service
    const generatedDocument = {
      PK: documentId,
      SK: documentId,
      GSI1PK: input.caseId,
      GSI1SK: now,
      GSI2PK: userId,
      GSI2SK: now,
      GSI3PK: template.Item.typeId,
      GSI3SK: now,
      GSI4PK: 'draft', // Default status
      GSI4SK: now,
      id: documentId,
      title: `Generated Document - ${template.Item.name}`,
      description: `Document generated from template: ${template.Item.name}`,
      typeId: template.Item.typeId,
      statusId: 'draft',
      caseId: input.caseId,
      templateId: input.templateId,
      filePath: `generated/${documentId}.${input.outputFormat.toLowerCase()}`,
      fileSize: 0, // Will be updated after generation
      mimeType: input.outputFormat === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      version: 1,
      isLatest: true,
      parentDocumentId: null,
      tags: ['generated'],
      metadata: input.data,
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      updatedById: userId,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Item: generatedDocument
    }));

    return {
      documentId: documentId,
      filePath: generatedDocument.filePath,
      downloadUrl: `https://s3.amazonaws.com/bucket/${generatedDocument.filePath}` // In real implementation, this would be a signed URL
    };
  } catch (error) {
    console.error('Error generating document:', error);
    throw new Error(`Failed to generate document: ${error.message}`);
  }
};

// Upload document
const uploadDocument = async (args, context) => {
  try {
    const { file, caseId, typeId } = args;
    const { userId, userRole } = context.identity;

    // Check if user has access to the case
    const caseAssignment = await docClient.send(new GetCommand({
      TableName: process.env.CASE_ASSIGNMENTS_TABLE,
      Key: { PK: caseId, SK: userId }
    }));

    if (!caseAssignment.Item && userRole !== 'admin') {
      throw new Error('Access denied to case');
    }

    // In a real implementation, this would upload the file to S3
    const documentId = generateCUID();
    const now = new Date().toISOString();

    const document = {
      PK: documentId,
      SK: documentId,
      GSI1PK: caseId,
      GSI1SK: now,
      GSI2PK: userId,
      GSI2SK: now,
      GSI3PK: typeId,
      GSI3SK: now,
      GSI4PK: 'uploaded',
      GSI4SK: now,
      id: documentId,
      title: `Uploaded Document - ${new Date().toISOString()}`,
      description: 'Document uploaded by user',
      typeId: typeId,
      statusId: 'uploaded',
      caseId: caseId,
      templateId: null,
      filePath: `uploads/${documentId}`,
      fileSize: 0, // Will be updated after upload
      mimeType: 'application/octet-stream',
      version: 1,
      isLatest: true,
      parentDocumentId: null,
      tags: ['uploaded'],
      metadata: {},
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      updatedById: userId,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Item: document
    }));

    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }
};

// Download document
const downloadDocument = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    // Check access to document
    const accessCheck = await checkDocumentAccess(id, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const document = accessCheck.document;

    // In a real implementation, this would generate a signed URL
    return `https://s3.amazonaws.com/bucket/${document.filePath}`;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error(`Failed to download document: ${error.message}`);
  }
};

module.exports = {
  createDocument,
  updateDocument,
  deleteDocument,
  restoreDocument,
  createDocumentVersion,
  deleteDocumentVersion,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  createDocumentStatus,
  updateDocumentStatus,
  deleteDocumentStatus,
  generateDocument,
  uploadDocument,
  downloadDocument
};
