// Document Management GraphQL Query Resolvers
// Handles all document-related queries with proper error handling and authorization

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
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

// Helper function to build query parameters
const buildQueryParams = (tableName, indexName, keyCondition, filterExpression, expressionValues, limit, nextToken) => {
  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
    Limit: limit || 20
  };

  if (filterExpression) {
    params.FilterExpression = filterExpression;
  }

  if (nextToken) {
    params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
  }

  return params;
};

// Get single document
const getDocument = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    const accessCheck = await checkDocumentAccess(id, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const document = accessCheck.document;

    // Get related data
    const [documentType, documentStatus, caseData, createdBy, updatedBy] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Key: { PK: document.typeId, SK: document.typeId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_STATUSES_TABLE,
        Key: { PK: document.statusId, SK: document.statusId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.CASES_TABLE,
        Key: { PK: document.caseId, SK: document.caseId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: document.createdById, SK: document.createdById }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: document.updatedById, SK: document.updatedById }
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
    console.error('Error getting document:', error);
    throw new Error(`Failed to get document: ${error.message}`);
  }
};

// List documents with filtering
const listDocuments = async (args, context) => {
  try {
    const { filters = {} } = args;
    const { userId, userRole } = context.identity;

    const {
      search,
      typeId,
      statusId,
      caseId,
      templateId,
      tags,
      createdById,
      dateFrom,
      dateTo,
      limit,
      nextToken,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;

    let queryParams;
    let documents = [];

    // Determine query strategy based on filters
    if (caseId) {
      // Query by case
      queryParams = buildQueryParams(
        process.env.DOCUMENTS_TABLE,
        'GSI1',
        'GSI1PK = :caseId',
        null,
        { ':caseId': caseId },
        limit,
        nextToken
      );
    } else if (createdById) {
      // Query by creator
      queryParams = buildQueryParams(
        process.env.DOCUMENTS_TABLE,
        'GSI2',
        'GSI2PK = :createdById',
        null,
        { ':createdById': createdById },
        limit,
        nextToken
      );
    } else if (typeId) {
      // Query by type
      queryParams = buildQueryParams(
        process.env.DOCUMENTS_TABLE,
        'GSI3',
        'GSI3PK = :typeId',
        null,
        { ':typeId': typeId },
        limit,
        nextToken
      );
    } else if (statusId) {
      // Query by status
      queryParams = buildQueryParams(
        process.env.DOCUMENTS_TABLE,
        'GSI4',
        'GSI4PK = :statusId',
        null,
        { ':statusId': statusId },
        limit,
        nextToken
      );
    } else {
      // Scan all documents (with filters)
      queryParams = {
        TableName: process.env.DOCUMENTS_TABLE,
        Limit: limit || 20
      };

      if (nextToken) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
      }

      // Build filter expression
      const filterExpressions = [];
      const expressionValues = {};

      if (search) {
        filterExpressions.push('contains(title, :search) OR contains(description, :search)');
        expressionValues[':search'] = search;
      }

      if (templateId) {
        filterExpressions.push('templateId = :templateId');
        expressionValues[':templateId'] = templateId;
      }

      if (tags && tags.length > 0) {
        filterExpressions.push('contains(tags, :tags)');
        expressionValues[':tags'] = tags[0]; // DynamoDB doesn't support array contains
      }

      if (dateFrom) {
        filterExpressions.push('createdAt >= :dateFrom');
        expressionValues[':dateFrom'] = dateFrom;
      }

      if (dateTo) {
        filterExpressions.push('createdAt <= :dateTo');
        expressionValues[':dateTo'] = dateTo;
      }

      if (filterExpressions.length > 0) {
        queryParams.FilterExpression = filterExpressions.join(' AND ');
        queryParams.ExpressionAttributeValues = expressionValues;
      }
    }

    const result = await docClient.send(new ScanCommand(queryParams));
    documents = result.Items || [];

    // Apply additional filters that can't be done in DynamoDB
    if (tags && tags.length > 0) {
      documents = documents.filter(doc =>
        doc.tags && tags.some(tag => doc.tags.includes(tag))
      );
    }

    // Sort results
    if (sortBy === 'createdAt') {
      documents.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'title') {
      documents.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return sortOrder === 'ASC' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });
    }

    // Get related data for each document
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const [documentType, documentStatus, caseData, createdBy, updatedBy] = await Promise.all([
          docClient.send(new GetCommand({
            TableName: process.env.DOCUMENT_TYPES_TABLE,
            Key: { PK: doc.typeId, SK: doc.typeId }
          })),
          docClient.send(new GetCommand({
            TableName: process.env.DOCUMENT_STATUSES_TABLE,
            Key: { PK: doc.statusId, SK: doc.statusId }
          })),
          docClient.send(new GetCommand({
            TableName: process.env.CASES_TABLE,
            Key: { PK: doc.caseId, SK: doc.caseId }
          })),
          docClient.send(new GetCommand({
            TableName: process.env.USERS_TABLE,
            Key: { PK: doc.createdById, SK: doc.createdById }
          })),
          docClient.send(new GetCommand({
            TableName: process.env.USERS_TABLE,
            Key: { PK: doc.updatedById, SK: doc.updatedById }
          }))
        ]);

        return {
          ...doc,
          type: documentType.Item,
          status: documentStatus.Item,
          case: caseData.Item,
          createdBy: createdBy.Item,
          updatedBy: updatedBy.Item
        };
      })
    );

    return {
      documents: enrichedDocuments,
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null,
      totalCount: enrichedDocuments.length
    };
  } catch (error) {
    console.error('Error listing documents:', error);
    throw new Error(`Failed to list documents: ${error.message}`);
  }
};

// Search documents
const searchDocuments = async (args, context) => {
  try {
    const { query, filters = {} } = args;
    const { userId, userRole } = context.identity;

    // Use the listDocuments function with search filter
    const searchFilters = {
      ...filters,
      search: query
    };

    return await listDocuments({ filters: searchFilters }, context);
  } catch (error) {
    console.error('Error searching documents:', error);
    throw new Error(`Failed to search documents: ${error.message}`);
  }
};

// Get document versions
const getDocumentVersions = async (args, context) => {
  try {
    const { documentId, limit, nextToken } = args;
    const { userId, userRole } = context.identity;

    // Check access to parent document
    const accessCheck = await checkDocumentAccess(documentId, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const queryParams = buildQueryParams(
      process.env.DOCUMENT_VERSIONS_TABLE,
      'GSI1',
      'GSI1PK = :documentId',
      null,
      { ':documentId': documentId },
      limit,
      nextToken
    );

    const result = await docClient.send(new QueryCommand(queryParams));
    const versions = result.Items || [];

    // Get creator information for each version
    const enrichedVersions = await Promise.all(
      versions.map(async (version) => {
        const createdBy = await docClient.send(new GetCommand({
          TableName: process.env.USERS_TABLE,
          Key: { PK: version.createdById, SK: version.createdById }
        }));

        return {
          ...version,
          createdBy: createdBy.Item
        };
      })
    );

    return {
      versions: enrichedVersions,
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null,
      totalCount: enrichedVersions.length
    };
  } catch (error) {
    console.error('Error getting document versions:', error);
    throw new Error(`Failed to get document versions: ${error.message}`);
  }
};

// Get specific document version
const getDocumentVersion = async (args, context) => {
  try {
    const { documentId, version } = args;
    const { userId, userRole } = context.identity;

    // Check access to parent document
    const accessCheck = await checkDocumentAccess(documentId, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_VERSIONS_TABLE,
      Key: { PK: documentId, SK: `v${version.toString().padStart(3, '0')}` }
    }));

    if (!result.Item) {
      throw new Error('Document version not found');
    }

    const createdBy = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { PK: result.Item.createdById, SK: result.Item.createdById }
    }));

    return {
      ...result.Item,
      createdBy: createdBy.Item
    };
  } catch (error) {
    console.error('Error getting document version:', error);
    throw new Error(`Failed to get document version: ${error.message}`);
  }
};

// Get document template
const getDocumentTemplate = async (args, context) => {
  try {
    const { id } = args;
    const { userId, userRole } = context.identity;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      Key: { PK: id, SK: id }
    }));

    if (!result.Item) {
      throw new Error('Document template not found');
    }

    const [documentType, createdBy] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Key: { PK: result.Item.typeId, SK: result.Item.typeId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { PK: result.Item.createdById, SK: result.Item.createdById }
      }))
    ]);

    return {
      ...result.Item,
      type: documentType.Item,
      createdBy: createdBy.Item
    };
  } catch (error) {
    console.error('Error getting document template:', error);
    throw new Error(`Failed to get document template: ${error.message}`);
  }
};

// List document templates
const listDocumentTemplates = async (args, context) => {
  try {
    const { category, typeId, limit, nextToken } = args;
    const { userId, userRole } = context.identity;

    let queryParams;

    if (typeId) {
      queryParams = buildQueryParams(
        process.env.DOCUMENT_TEMPLATES_TABLE,
        'GSI1',
        'GSI1PK = :typeId',
        null,
        { ':typeId': typeId },
        limit,
        nextToken
      );
    } else if (category) {
      queryParams = buildQueryParams(
        process.env.DOCUMENT_TEMPLATES_TABLE,
        'GSI2',
        'GSI2PK = :category',
        null,
        { ':category': category },
        limit,
        nextToken
      );
    } else {
      queryParams = {
        TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
        Limit: limit || 20
      };

      if (nextToken) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
      }
    }

    const result = await docClient.send(new ScanCommand(queryParams));
    const templates = result.Items || [];

    // Get related data for each template
    const enrichedTemplates = await Promise.all(
      templates.map(async (template) => {
        const [documentType, createdBy] = await Promise.all([
          docClient.send(new GetCommand({
            TableName: process.env.DOCUMENT_TYPES_TABLE,
            Key: { PK: template.typeId, SK: template.typeId }
          })),
          docClient.send(new GetCommand({
            TableName: process.env.USERS_TABLE,
            Key: { PK: template.createdById, SK: template.createdById }
          }))
        ]);

        return {
          ...template,
          type: documentType.Item,
          createdBy: createdBy.Item
        };
      })
    );

    return {
      templates: enrichedTemplates,
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null,
      totalCount: enrichedTemplates.length
    };
  } catch (error) {
    console.error('Error listing document templates:', error);
    throw new Error(`Failed to list document templates: ${error.message}`);
  }
};

// Search document templates
const searchDocumentTemplates = async (args, context) => {
  try {
    const { query, limit, nextToken } = args;
    const { userId, userRole } = context.identity;

    const queryParams = {
      TableName: process.env.DOCUMENT_TEMPLATES_TABLE,
      FilterExpression: 'contains(name, :query) OR contains(description, :query)',
      ExpressionAttributeValues: { ':query': query },
      Limit: limit || 20
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    const result = await docClient.send(new ScanCommand(queryParams));
    const templates = result.Items || [];

    // Get related data for each template
    const enrichedTemplates = await Promise.all(
      templates.map(async (template) => {
        const [documentType, createdBy] = await Promise.all([
          docClient.send(new GetCommand({
            TableName: process.env.DOCUMENT_TYPES_TABLE,
            Key: { PK: template.typeId, SK: template.typeId }
          })),
          docClient.send(new GetCommand({
            TableName: process.env.USERS_TABLE,
            Key: { PK: template.createdById, SK: template.createdById }
          }))
        ]);

        return {
          ...template,
          type: documentType.Item,
          createdBy: createdBy.Item
        };
      })
    );

    return {
      templates: enrichedTemplates,
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null,
      totalCount: enrichedTemplates.length
    };
  } catch (error) {
    console.error('Error searching document templates:', error);
    throw new Error(`Failed to search document templates: ${error.message}`);
  }
};

// Get document type
const getDocumentType = async (args, context) => {
  try {
    const { id } = args;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_TYPES_TABLE,
      Key: { PK: id, SK: id }
    }));

    if (!result.Item) {
      throw new Error('Document type not found');
    }

    return result.Item;
  } catch (error) {
    console.error('Error getting document type:', error);
    throw new Error(`Failed to get document type: ${error.message}`);
  }
};

// List document types
const listDocumentTypes = async (args, context) => {
  try {
    const { category, limit, nextToken } = args;

    let queryParams;

    if (category) {
      queryParams = buildQueryParams(
        process.env.DOCUMENT_TYPES_TABLE,
        'GSI1',
        'GSI1PK = :category',
        null,
        { ':category': category },
        limit,
        nextToken
      );
    } else {
      queryParams = {
        TableName: process.env.DOCUMENT_TYPES_TABLE,
        Limit: limit || 20
      };

      if (nextToken) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
      }
    }

    const result = await docClient.send(new ScanCommand(queryParams));

    return {
      types: result.Items || [],
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null,
      totalCount: result.Items ? result.Items.length : 0
    };
  } catch (error) {
    console.error('Error listing document types:', error);
    throw new Error(`Failed to list document types: ${error.message}`);
  }
};

// Get document status
const getDocumentStatus = async (args, context) => {
  try {
    const { id } = args;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.DOCUMENT_STATUSES_TABLE,
      Key: { PK: id, SK: id }
    }));

    if (!result.Item) {
      throw new Error('Document status not found');
    }

    return result.Item;
  } catch (error) {
    console.error('Error getting document status:', error);
    throw new Error(`Failed to get document status: ${error.message}`);
  }
};

// List document statuses
const listDocumentStatuses = async (args, context) => {
  try {
    const { category, limit, nextToken } = args;

    let queryParams;

    if (category) {
      queryParams = buildQueryParams(
        process.env.DOCUMENT_STATUSES_TABLE,
        'GSI1',
        'GSI1PK = :category',
        null,
        { ':category': category },
        limit,
        nextToken
      );
    } else {
      queryParams = {
        TableName: process.env.DOCUMENT_STATUSES_TABLE,
        Limit: limit || 20
      };

      if (nextToken) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
      }
    }

    const result = await docClient.send(new ScanCommand(queryParams));

    return {
      statuses: result.Items || [],
      nextToken: result.LastEvaluatedKey ?
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null,
      totalCount: result.Items ? result.Items.length : 0
    };
  } catch (error) {
    console.error('Error listing document statuses:', error);
    throw new Error(`Failed to list document statuses: ${error.message}`);
  }
};

// Get document generation status
const getDocumentGenerationStatus = async (args, context) => {
  try {
    const { documentId } = args;
    const { userId, userRole } = context.identity;

    // Check access to document
    const accessCheck = await checkDocumentAccess(documentId, userId, userRole);
    if (!accessCheck.hasAccess) {
      throw new Error(accessCheck.error);
    }

    const document = accessCheck.document;

    return {
      documentId: document.id,
      filePath: document.filePath,
      downloadUrl: document.filePath // In a real implementation, this would be a signed URL
    };
  } catch (error) {
    console.error('Error getting document generation status:', error);
    throw new Error(`Failed to get document generation status: ${error.message}`);
  }
};

module.exports = {
  getDocument,
  listDocuments,
  searchDocuments,
  getDocumentVersions,
  getDocumentVersion,
  getDocumentTemplate,
  listDocumentTemplates,
  searchDocumentTemplates,
  getDocumentType,
  listDocumentTypes,
  getDocumentStatus,
  listDocumentStatuses,
  getDocumentGenerationStatus
};
