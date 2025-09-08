// Upload Document Lambda Function
// Handles document upload with proper validation and error handling

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Helper function to generate CUID
const generateCUID = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `c${timestamp}${random}`;
};

// Helper function to validate upload input
const validateUploadInput = (input) => {
  const errors = [];

  if (!input.file) {
    errors.push('File is required');
  }

  if (!input.caseId) {
    errors.push('Case ID is required');
  }

  if (!input.typeId) {
    errors.push('Type ID is required');
  }

  if (input.file && input.file.size > 104857600) { // 100MB limit
    errors.push('File size must be less than 100MB');
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

// Helper function to validate file type
const validateFileType = (file, allowedMimeTypes) => {
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  return { valid: true };
};

// Helper function to generate file path
const generateFilePath = (documentId, originalName) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = originalName.split('.').pop();
  return `uploads/${timestamp}/${documentId}.${extension}`;
};

// Helper function to upload file to S3
const uploadFileToS3 = async (file, filePath) => {
  try {
    const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: filePath,
      Body: file.buffer || file,
      ContentType: file.type || 'application/octet-stream',
      Metadata: {
        'original-name': file.name || 'unknown',
        'uploaded-at': new Date().toISOString()
      }
    };

    const result = await s3Client.send(new PutObjectCommand(uploadParams));

    return {
      success: true,
      etag: result.ETag,
      location: `s3://${process.env.S3_BUCKET}/${filePath}`
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to generate download URL
const generateDownloadUrl = async (filePath) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: filePath
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    console.error('Error generating download URL:', error);
    return null;
  }
};

// Main handler
exports.handler = async (event) => {
  console.log('Upload Document Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { userId, userRole } = event.identity;

    // Validate input
    const validationErrors = validateUploadInput(input);
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

    const documentType = typeValidation.type;

    // Validate file type
    const fileValidation = validateFileType(input.file, documentType.mimeTypes);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid file type',
          details: [fileValidation.error]
        }
      };
    }

    // Check file size against type limit
    if (input.file.size > documentType.maxFileSize) {
      return {
        success: false,
        error: {
          message: 'File too large',
          details: [`File size exceeds maximum allowed size of ${documentType.maxFileSize} bytes`]
        }
      };
    }

    // Generate document ID and file path
    const documentId = generateCUID();
    const filePath = generateFilePath(documentId, input.file.name);

    // Upload file to S3
    const uploadResult = await uploadFileToS3(input.file, filePath);
    if (!uploadResult.success) {
      return {
        success: false,
        error: {
          message: 'Upload failed',
          details: [uploadResult.error]
        }
      };
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl(filePath);

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
      GSI4PK: 'uploaded',
      GSI4SK: now,
      id: documentId,
      title: input.title || input.file.name || `Uploaded Document - ${new Date().toISOString()}`,
      description: input.description || 'Document uploaded by user',
      typeId: input.typeId,
      statusId: 'uploaded',
      caseId: input.caseId,
      templateId: null,
      filePath: filePath,
      fileSize: input.file.size,
      mimeType: input.file.type || 'application/octet-stream',
      version: 1,
      isLatest: true,
      parentDocumentId: null,
      tags: ['uploaded', documentType.category],
      metadata: {
        originalName: input.file.name || 'unknown',
        uploadedAt: now,
        etag: uploadResult.etag,
        s3Location: uploadResult.location
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

    // Log successful upload
    console.log(`Document uploaded successfully: ${documentId}`);

    return {
      success: true,
      document: {
        ...document,
        downloadUrl: downloadUrl
      }
    };

  } catch (error) {
    console.error('Error uploading document:', error);

    return {
      success: false,
      error: {
        message: 'Internal server error',
        details: [error.message]
      }
    };
  }
};
