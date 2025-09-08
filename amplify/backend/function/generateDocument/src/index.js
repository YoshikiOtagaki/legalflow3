// Generate Document Lambda Function
// Handles document generation from templates with proper validation and error handling

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

// Helper function to validate generation input
const validateGenerationInput = (input) => {
  const errors = [];

  if (!input.templateId) {
    errors.push('Template ID is required');
  }

  if (!input.caseId) {
    errors.push('Case ID is required');
  }

  if (!input.data || typeof input.data !== 'object') {
    errors.push('Data is required and must be an object');
  }

  if (!input.outputFormat || !['DOCX', 'PDF'].includes(input.outputFormat)) {
    errors.push('Output format must be DOCX or PDF');
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

// Helper function to validate template
const validateTemplate = async (templateId) => {
  try {
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

// Helper function to get case data
const getCaseData = async (caseId) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env.CASES_TABLE,
      Key: { PK: caseId, SK: caseId }
    }));

    if (!result.Item) {
      return { valid: false, error: 'Case not found' };
    }

    return { valid: true, case: result.Item };
  } catch (error) {
    console.error('Error getting case data:', error);
    return { valid: false, error: error.message };
  }
};

// Helper function to get parties data
const getPartiesData = async (caseId) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.CASE_PARTIES_TABLE,
      KeyConditionExpression: 'PK = :caseId',
      ExpressionAttributeValues: { ':caseId': caseId }
    }));

    const parties = result.Items || [];

    // Get party details
    const partyDetails = await Promise.all(
      parties.map(async (party) => {
        const partyData = await docClient.send(new GetCommand({
          TableName: process.env.PARTIES_TABLE,
          Key: { PK: party.partyId, SK: party.partyId }
        }));

        if (partyData.Item) {
          // Get individual or corporate profile
          const profile = await docClient.send(new GetCommand({
            TableName: partyData.Item.isCorporation ?
              process.env.CORPORATE_PROFILES_TABLE :
              process.env.INDIVIDUAL_PROFILES_TABLE,
            Key: { PK: party.partyId, SK: party.partyId }
          }));

          return {
            ...party,
            partyData: partyData.Item,
            profile: profile.Item
          };
        }

        return party;
      })
    );

    return { valid: true, parties: partyDetails };
  } catch (error) {
    console.error('Error getting parties data:', error);
    return { valid: false, error: error.message };
  }
};

// Helper function to process template content
const processTemplateContent = (template, data, caseData, parties) => {
  let content = template.content;

  // Replace placeholders with actual data
  const placeholders = template.placeholders || [];

  placeholders.forEach(placeholder => {
    const value = getPlaceholderValue(placeholder, data, caseData, parties);
    const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
    content = content.replace(regex, value);
  });

  return content;
};

// Helper function to get placeholder value
const getPlaceholderValue = (placeholder, data, caseData, parties) => {
  // Check if value is provided in data
  if (data[placeholder] !== undefined) {
    return data[placeholder];
  }

  // Check case data
  if (caseData && caseData[placeholder] !== undefined) {
    return caseData[placeholder];
  }

  // Check parties data
  if (parties && parties.length > 0) {
    const party = parties.find(p => p.role === 'plaintiff' || p.role === 'defendant');
    if (party && party.profile) {
      if (placeholder === 'plaintiff_name' && party.role === 'plaintiff') {
        return party.profile.name || `${party.profile.lastName} ${party.profile.firstName}`;
      }
      if (placeholder === 'defendant_name' && party.role === 'defendant') {
        return party.profile.name || `${party.profile.lastName} ${party.profile.firstName}`;
      }
    }
  }

  // Return placeholder if no value found
  return `{{${placeholder}}}`;
};

// Helper function to generate file path
const generateFilePath = (documentId, outputFormat) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = outputFormat.toLowerCase();
  return `generated/${timestamp}/${documentId}.${extension}`;
};

// Main handler
exports.handler = async (event) => {
  console.log('Generate Document Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { userId, userRole } = event.identity;

    // Validate input
    const validationErrors = validateGenerationInput(input);
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

    // Validate template
    const templateValidation = await validateTemplate(input.templateId);
    if (!templateValidation.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid template',
          details: [templateValidation.error]
        }
      };
    }

    const template = templateValidation.template;

    // Get case data
    const caseDataResult = await getCaseData(input.caseId);
    if (!caseDataResult.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid case',
          details: [caseDataResult.error]
        }
      };
    }

    const caseData = caseDataResult.case;

    // Get parties data
    const partiesResult = await getPartiesData(input.caseId);
    if (!partiesResult.valid) {
      return {
        success: false,
        error: {
          message: 'Failed to get parties data',
          details: [partiesResult.error]
        }
      };
    }

    const parties = partiesResult.parties;

    // Process template content
    const processedContent = processTemplateContent(template, input.data, caseData, parties);

    // Generate document ID
    const documentId = generateCUID();
    const now = new Date().toISOString();

    // Generate file path
    const filePath = generateFilePath(documentId, input.outputFormat);

    // Create document record
    const document = {
      PK: documentId,
      SK: documentId,
      GSI1PK: input.caseId,
      GSI1SK: now,
      GSI2PK: userId,
      GSI2SK: now,
      GSI3PK: template.typeId,
      GSI3SK: now,
      GSI4PK: 'draft',
      GSI4SK: now,
      id: documentId,
      title: `Generated Document - ${template.name}`,
      description: `Document generated from template: ${template.name}`,
      typeId: template.typeId,
      statusId: 'draft',
      caseId: input.caseId,
      templateId: input.templateId,
      filePath: filePath,
      fileSize: 0, // Will be updated after actual generation
      mimeType: input.outputFormat === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      version: 1,
      isLatest: true,
      parentDocumentId: null,
      tags: ['generated', template.category],
      metadata: {
        ...input.data,
        templateName: template.name,
        templateVersion: template.version,
        generatedAt: now,
        outputFormat: input.outputFormat
      },
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

    // In a real implementation, this would:
    // 1. Call a document generation service (e.g., AWS Textract, custom service)
    // 2. Upload the generated file to S3
    // 3. Update the document record with actual file size and S3 path

    // For now, we'll simulate the generation process
    const simulatedFileSize = Math.floor(Math.random() * 1000000) + 10000; // Random size between 10KB and 1MB

    // Update document with simulated file size
    await docClient.send(new UpdateCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { PK: documentId, SK: documentId },
      UpdateExpression: 'SET #fileSize = :fileSize, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#fileSize': 'fileSize',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':fileSize': simulatedFileSize,
        ':updatedAt': new Date().toISOString()
      }
    }));

    // Log successful generation
    console.log(`Document generated successfully: ${documentId}`);

    return {
      success: true,
      documentId: documentId,
      filePath: filePath,
      downloadUrl: `https://s3.amazonaws.com/${process.env.S3_BUCKET}/${filePath}` // In real implementation, this would be a signed URL
    };

  } catch (error) {
    console.error('Error generating document:', error);

    return {
      success: false,
      error: {
        message: 'Internal server error',
        details: [error.message]
      }
    };
  }
};
