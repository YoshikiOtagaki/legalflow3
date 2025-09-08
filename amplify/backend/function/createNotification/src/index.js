// Create Notification Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);
const sns = new SNSClient({ region: process.env.AWS_REGION });

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;
const NOTIFICATION_TYPES_TABLE = process.env.NOTIFICATION_TYPES_TABLE;
const NOTIFICATION_PRIORITIES_TABLE = process.env.NOTIFICATION_PRIORITIES_TABLE;
const NOTIFICATION_SETTINGS_TABLE = process.env.NOTIFICATION_SETTINGS_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Helper function to validate notification data
function validateNotificationData(data) {
  const errors = [];

  if (!data.userId) {
    errors.push('userId is required');
  }
  if (!data.typeId) {
    errors.push('typeId is required');
  }
  if (!data.title || data.title.trim() === '') {
    errors.push('title is required');
  }
  if (!data.message || data.message.trim() === '') {
    errors.push('message is required');
  }
  if (!data.priorityId) {
    errors.push('priorityId is required');
  }
  if (!data.channels || !Array.isArray(data.channels) || data.channels.length === 0) {
    errors.push('channels is required and must be a non-empty array');
  }

  return errors;
}

// Helper function to get notification type
async function getNotificationType(typeId) {
  try {
    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Key: { PK: typeId, SK: typeId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting notification type:', error);
    return null;
  }
}

// Helper function to get notification priority
async function getNotificationPriority(priorityId) {
  try {
    const params = {
      TableName: NOTIFICATION_PRIORITIES_TABLE,
      Key: { PK: priorityId, SK: priorityId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting notification priority:', error);
    return null;
  }
}

// Helper function to get user notification settings
async function getUserNotificationSettings(userId) {
  try {
    const params = {
      TableName: NOTIFICATION_SETTINGS_TABLE,
      Key: { PK: userId, SK: userId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting user notification settings:', error);
    return null;
  }
}

// Helper function to process notification template
function processTemplate(template, data) {
  if (!template) return data.message;

  let processedMessage = template;

  // Replace template variables
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key] || '';
    processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
  });

  return processedMessage;
}

// Helper function to send notification via SNS
async function sendNotificationViaSNS(notification, userSettings) {
  try {
    if (!SNS_TOPIC_ARN) {
      console.log('SNS topic ARN not configured, skipping SNS notification');
      return;
    }

    const message = {
      notificationId: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      channels: notification.channels,
      priority: notification.priorityId,
      scheduledAt: notification.scheduledAt,
      userSettings: userSettings
    };

    const params = {
      TopicArn: SNS_TOPIC_ARN,
      Message: JSON.stringify(message),
      Subject: `Notification: ${notification.title}`,
      MessageAttributes: {
        userId: {
          DataType: 'String',
          StringValue: notification.userId
        },
        priority: {
          DataType: 'String',
          StringValue: notification.priorityId
        },
        channels: {
          DataType: 'String',
          StringValue: notification.channels.join(',')
        }
      }
    };

    await sns.send(new PublishCommand(params));
    console.log('Notification sent via SNS:', notification.id);
  } catch (error) {
    console.error('Error sending notification via SNS:', error);
    // Don't throw error, just log it
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Create Notification Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    // Parse input from event
    const input = event.arguments?.input || event;

    // Validate input data
    const validationErrors = validateNotificationData(input);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validationErrors
        })
      };
    }

    // Get notification type and priority
    const [notificationType, notificationPriority, userSettings] = await Promise.all([
      getNotificationType(input.typeId),
      getNotificationPriority(input.priorityId),
      getUserNotificationSettings(input.userId)
    ]);

    if (!notificationType) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Notification type not found',
          typeId: input.typeId
        })
      };
    }

    if (!notificationPriority) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Notification priority not found',
          priorityId: input.priorityId
        })
      };
    }

    // Process message template if available
    let processedMessage = input.message;
    if (notificationType.template && input.data) {
      processedMessage = processTemplate(notificationType.template, input.data);
    }

    // Generate notification ID and timestamp
    const id = createId();
    const now = getCurrentTimestamp();

    // Create notification object
    const notification = {
      PK: id,
      SK: id,
      GSI1PK: input.userId,
      GSI1SK: now,
      GSI2PK: input.typeId,
      GSI2SK: now,
      GSI3PK: input.priorityId,
      GSI3SK: now,
      GSI4PK: 'unread',
      GSI4SK: now,
      id,
      userId: input.userId,
      typeId: input.typeId,
      title: input.title,
      message: processedMessage,
      data: input.data || null,
      isRead: false,
      isArchived: false,
      priorityId: input.priorityId,
      channels: input.channels,
      scheduledAt: input.scheduledAt || null,
      sentAt: null,
      readAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL(),
      // Include related data for response
      type: notificationType,
      priority: notificationPriority
    };

    // Create notification in database
    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Item: notification
    };

    await docClient.send(new PutCommand(params));

    // Send notification via SNS if not scheduled
    if (!input.scheduledAt) {
      await sendNotificationViaSNS(notification, userSettings);

      // Update sentAt timestamp
      const updateParams = {
        TableName: NOTIFICATIONS_TABLE,
        Key: { PK: id, SK: id },
        UpdateExpression: 'SET sentAt = :sentAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':sentAt': now,
          ':updatedAt': now
        }
      };

      await docClient.send(new UpdateCommand(updateParams));
      notification.sentAt = now;
    }

    console.log('Notification created successfully:', id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        notification: notification
      })
    };

  } catch (error) {
    console.error('Error creating notification:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
