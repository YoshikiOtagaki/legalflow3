// Update Notification Settings Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const NOTIFICATION_SETTINGS_TABLE = process.env.NOTIFICATION_SETTINGS_TABLE;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Helper function to validate notification settings data
function validateNotificationSettingsData(data) {
  const errors = [];

  if (!data.userId) {
    errors.push('userId is required');
  }

  // Validate email address if provided
  if (data.emailAddress && !isValidEmail(data.emailAddress)) {
    errors.push('Invalid email address format');
  }

  // Validate phone number if provided
  if (data.phoneNumber && !isValidPhoneNumber(data.phoneNumber)) {
    errors.push('Invalid phone number format');
  }

  // Validate timezone if provided
  if (data.timezone && !isValidTimezone(data.timezone)) {
    errors.push('Invalid timezone format');
  }

  // Validate language if provided
  if (data.language && !isValidLanguage(data.language)) {
    errors.push('Invalid language code format');
  }

  // Validate quiet hours if provided
  if (data.quietHoursStart && !isValidTime(data.quietHoursStart)) {
    errors.push('Invalid quiet hours start time format (HH:MM)');
  }

  if (data.quietHoursEnd && !isValidTime(data.quietHoursEnd)) {
    errors.push('Invalid quiet hours end time format (HH:MM)');
  }

  return errors;
}

// Helper function to validate email address
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone number
function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Helper function to validate timezone
function isValidTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to validate language code
function isValidLanguage(language) {
  const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
  return languageRegex.test(language);
}

// Helper function to validate time format (HH:MM)
function isValidTime(time) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Helper function to get existing notification settings
async function getNotificationSettings(userId) {
  try {
    const params = {
      TableName: NOTIFICATION_SETTINGS_TABLE,
      Key: { PK: userId, SK: userId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return null;
  }
}

// Helper function to create default notification settings
function createDefaultSettings(userId, input) {
  const now = getCurrentTimestamp();

  return {
    PK: userId,
    SK: userId,
    id: createId(),
    userId,
    emailEnabled: input.emailEnabled !== undefined ? input.emailEnabled : true,
    smsEnabled: input.smsEnabled !== undefined ? input.smsEnabled : false,
    pushEnabled: input.pushEnabled !== undefined ? input.pushEnabled : true,
    lineEnabled: input.lineEnabled !== undefined ? input.lineEnabled : false,
    inAppEnabled: input.inAppEnabled !== undefined ? input.inAppEnabled : true,
    emailAddress: input.emailAddress || null,
    phoneNumber: input.phoneNumber || null,
    lineUserId: input.lineUserId || null,
    quietHoursStart: input.quietHoursStart || null,
    quietHoursEnd: input.quietHoursEnd || null,
    timezone: input.timezone || 'UTC',
    language: input.language || 'en',
    createdAt: now,
    updatedAt: now,
    ttl: generateTTL()
  };
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Update Notification Settings Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    // Parse input from event
    const input = event.arguments?.input || event;

    // Validate input data
    const validationErrors = validateNotificationSettingsData(input);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validationErrors
        })
      };
    }

    const userId = input.userId;
    const now = getCurrentTimestamp();

    // Get existing settings
    const existingSettings = await getNotificationSettings(userId);

    let notificationSettings;

    if (existingSettings) {
      // Update existing settings
      const updateExpression = [];
      const expressionValues = {};
      const expressionNames = {};

      // Build update expression dynamically
      if (input.emailEnabled !== undefined) {
        updateExpression.push('emailEnabled = :emailEnabled');
        expressionValues[':emailEnabled'] = input.emailEnabled;
      }
      if (input.smsEnabled !== undefined) {
        updateExpression.push('smsEnabled = :smsEnabled');
        expressionValues[':smsEnabled'] = input.smsEnabled;
      }
      if (input.pushEnabled !== undefined) {
        updateExpression.push('pushEnabled = :pushEnabled');
        expressionValues[':pushEnabled'] = input.pushEnabled;
      }
      if (input.lineEnabled !== undefined) {
        updateExpression.push('lineEnabled = :lineEnabled');
        expressionValues[':lineEnabled'] = input.lineEnabled;
      }
      if (input.inAppEnabled !== undefined) {
        updateExpression.push('inAppEnabled = :inAppEnabled');
        expressionValues[':inAppEnabled'] = input.inAppEnabled;
      }
      if (input.emailAddress !== undefined) {
        updateExpression.push('emailAddress = :emailAddress');
        expressionValues[':emailAddress'] = input.emailAddress;
      }
      if (input.phoneNumber !== undefined) {
        updateExpression.push('phoneNumber = :phoneNumber');
        expressionValues[':phoneNumber'] = input.phoneNumber;
      }
      if (input.lineUserId !== undefined) {
        updateExpression.push('lineUserId = :lineUserId');
        expressionValues[':lineUserId'] = input.lineUserId;
      }
      if (input.quietHoursStart !== undefined) {
        updateExpression.push('quietHoursStart = :quietHoursStart');
        expressionValues[':quietHoursStart'] = input.quietHoursStart;
      }
      if (input.quietHoursEnd !== undefined) {
        updateExpression.push('quietHoursEnd = :quietHoursEnd');
        expressionValues[':quietHoursEnd'] = input.quietHoursEnd;
      }
      if (input.timezone !== undefined) {
        updateExpression.push('timezone = :timezone');
        expressionValues[':timezone'] = input.timezone;
      }
      if (input.language !== undefined) {
        updateExpression.push('language = :language');
        expressionValues[':language'] = input.language;
      }

      updateExpression.push('updatedAt = :updatedAt');
      expressionValues[':updatedAt'] = now;

      const params = {
        TableName: NOTIFICATION_SETTINGS_TABLE,
        Key: { PK: userId, SK: userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.send(new UpdateCommand(params));
      notificationSettings = result.Attributes;
    } else {
      // Create new settings
      notificationSettings = createDefaultSettings(userId, input);

      const params = {
        TableName: NOTIFICATION_SETTINGS_TABLE,
        Item: notificationSettings
      };

      await docClient.send(new PutCommand(params));
    }

    console.log('Notification settings updated successfully:', userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        notificationSettings
      })
    };

  } catch (error) {
    console.error('Error updating notification settings:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
