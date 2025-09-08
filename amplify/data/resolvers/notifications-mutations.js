// Notification Mutations Resolver
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;
const NOTIFICATION_TYPES_TABLE = process.env.NOTIFICATION_TYPES_TABLE;
const NOTIFICATION_PRIORITIES_TABLE = process.env.NOTIFICATION_PRIORITIES_TABLE;
const NOTIFICATION_CHANNELS_TABLE = process.env.NOTIFICATION_CHANNELS_TABLE;
const NOTIFICATION_SETTINGS_TABLE = process.env.NOTIFICATION_SETTINGS_TABLE;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Create notification
async function createNotification(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

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
      message: input.message,
      data: input.data || null,
      isRead: false,
      isArchived: false,
      priorityId: input.priorityId,
      channels: input.channels || [],
      scheduledAt: input.scheduledAt || null,
      sentAt: null,
      readAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Item: notification
    };

    await docClient.send(new PutCommand(params));
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

// Update notification
async function updateNotification(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression dynamically
    if (input.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionNames['#title'] = 'title';
      expressionValues[':title'] = input.title;
    }
    if (input.message !== undefined) {
      updateExpression.push('#message = :message');
      expressionNames['#message'] = 'message';
      expressionValues[':message'] = input.message;
    }
    if (input.data !== undefined) {
      updateExpression.push('#data = :data');
      expressionNames['#data'] = 'data';
      expressionValues[':data'] = input.data;
    }
    if (input.priorityId !== undefined) {
      updateExpression.push('priorityId = :priorityId, GSI3PK = :priorityId');
      expressionValues[':priorityId'] = input.priorityId;
    }
    if (input.channels !== undefined) {
      updateExpression.push('channels = :channels');
      expressionValues[':channels'] = input.channels;
    }
    if (input.scheduledAt !== undefined) {
      updateExpression.push('scheduledAt = :scheduledAt');
      expressionValues[':scheduledAt'] = input.scheduledAt;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw new Error('Failed to update notification');
  }
}

// Delete notification
async function deleteNotification(id) {
  try {
    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
}

// Mark notification as read
async function markNotificationAsRead(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isRead = :isRead, readAt = :readAt, GSI4PK = :readStatus, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isRead': true,
        ':readAt': now,
        ':readStatus': 'read',
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

// Mark notification as unread
async function markNotificationAsUnread(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isRead = :isRead, readAt = :readAt, GSI4PK = :readStatus, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isRead': false,
        ':readAt': null,
        ':readStatus': 'unread',
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    throw new Error('Failed to mark notification as unread');
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead(userId) {
  try {
    // This would require a batch update operation
    // For now, we'll use a scan and update approach
    // In production, consider using a more efficient approach

    const scanParams = {
      TableName: NOTIFICATIONS_TABLE,
      FilterExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      }
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const notifications = scanResult.Items || [];

    // Update each notification
    const updatePromises = notifications.map(notification =>
      markNotificationAsRead(notification.id)
    );

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

// Archive notification
async function archiveNotification(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isArchived = :isArchived, archivedAt = :archivedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isArchived': true,
        ':archivedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw new Error('Failed to archive notification');
  }
}

// Unarchive notification
async function unarchiveNotification(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isArchived = :isArchived, archivedAt = :archivedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isArchived': false,
        ':archivedAt': null,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error unarchiving notification:', error);
    throw new Error('Failed to unarchive notification');
  }
}

// Archive all notifications
async function archiveAllNotifications(userId) {
  try {
    const scanParams = {
      TableName: NOTIFICATIONS_TABLE,
      FilterExpression: 'userId = :userId AND isArchived = :isArchived',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isArchived': false
      }
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const notifications = scanResult.Items || [];

    const archivePromises = notifications.map(notification =>
      archiveNotification(notification.id)
    );

    await Promise.all(archivePromises);
    return true;
  } catch (error) {
    console.error('Error archiving all notifications:', error);
    throw new Error('Failed to archive all notifications');
  }
}

// Send notification (create and send)
async function sendNotification(input) {
  try {
    const notification = await createNotification(input);

    // Here you would implement the actual sending logic
    // For now, we'll just mark it as sent
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: notification.id, SK: notification.id },
      UpdateExpression: 'SET sentAt = :sentAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':sentAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new Error('Failed to send notification');
  }
}

// Schedule notification
async function scheduleNotification(input) {
  try {
    const notification = await createNotification(input);

    // Here you would implement the scheduling logic
    // For now, we'll just return the notification
    return notification;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw new Error('Failed to schedule notification');
  }
}

// Create notification type
async function createNotificationType(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const notificationType = {
      PK: id,
      SK: id,
      GSI1PK: input.category,
      GSI1SK: input.name,
      id,
      name: input.name,
      description: input.description || null,
      category: input.category,
      template: input.template,
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Item: notificationType
    };

    await docClient.send(new PutCommand(params));
    return notificationType;
  } catch (error) {
    console.error('Error creating notification type:', error);
    throw new Error('Failed to create notification type');
  }
}

// Update notification type
async function updateNotificationType(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    if (input.name !== undefined) {
      updateExpression.push('#name = :name, GSI1SK = :name');
      expressionNames['#name'] = 'name';
      expressionValues[':name'] = input.name;
    }
    if (input.description !== undefined) {
      updateExpression.push('description = :description');
      expressionValues[':description'] = input.description;
    }
    if (input.category !== undefined) {
      updateExpression.push('category = :category, GSI1PK = :category');
      expressionValues[':category'] = input.category;
    }
    if (input.template !== undefined) {
      updateExpression.push('template = :template');
      expressionValues[':template'] = input.template;
    }
    if (input.isActive !== undefined) {
      updateExpression.push('isActive = :isActive');
      expressionValues[':isActive'] = input.isActive;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating notification type:', error);
    throw new Error('Failed to update notification type');
  }
}

// Delete notification type
async function deleteNotificationType(id) {
  try {
    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting notification type:', error);
    throw new Error('Failed to delete notification type');
  }
}

// Activate notification type
async function activateNotificationType(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isActive': true,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error activating notification type:', error);
    throw new Error('Failed to activate notification type');
  }
}

// Deactivate notification type
async function deactivateNotificationType(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isActive': false,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error deactivating notification type:', error);
    throw new Error('Failed to deactivate notification type');
  }
}

// Create notification priority
async function createNotificationPriority(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const notificationPriority = {
      PK: id,
      SK: id,
      GSI1PK: input.level,
      GSI1SK: input.name,
      id,
      name: input.name,
      level: input.level,
      color: input.color,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: NOTIFICATION_PRIORITIES_TABLE,
      Item: notificationPriority
    };

    await docClient.send(new PutCommand(params));
    return notificationPriority;
  } catch (error) {
    console.error('Error creating notification priority:', error);
    throw new Error('Failed to create notification priority');
  }
}

// Update notification priority
async function updateNotificationPriority(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    if (input.name !== undefined) {
      updateExpression.push('#name = :name, GSI1SK = :name');
      expressionNames['#name'] = 'name';
      expressionValues[':name'] = input.name;
    }
    if (input.level !== undefined) {
      updateExpression.push('#level = :level, GSI1PK = :level');
      expressionNames['#level'] = 'level';
      expressionValues[':level'] = input.level;
    }
    if (input.color !== undefined) {
      updateExpression.push('color = :color');
      expressionValues[':color'] = input.color;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: NOTIFICATION_PRIORITIES_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating notification priority:', error);
    throw new Error('Failed to update notification priority');
  }
}

// Delete notification priority
async function deleteNotificationPriority(id) {
  try {
    const params = {
      TableName: NOTIFICATION_PRIORITIES_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting notification priority:', error);
    throw new Error('Failed to delete notification priority');
  }
}

// Create notification channel
async function createNotificationChannel(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const notificationChannel = {
      PK: id,
      SK: id,
      GSI1PK: input.type,
      GSI1SK: input.name,
      id,
      name: input.name,
      type: input.type,
      isEnabled: input.isEnabled !== undefined ? input.isEnabled : true,
      config: input.config || null,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: NOTIFICATION_CHANNELS_TABLE,
      Item: notificationChannel
    };

    await docClient.send(new PutCommand(params));
    return notificationChannel;
  } catch (error) {
    console.error('Error creating notification channel:', error);
    throw new Error('Failed to create notification channel');
  }
}

// Update notification channel
async function updateNotificationChannel(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    if (input.name !== undefined) {
      updateExpression.push('#name = :name, GSI1SK = :name');
      expressionNames['#name'] = 'name';
      expressionValues[':name'] = input.name;
    }
    if (input.type !== undefined) {
      updateExpression.push('#type = :type, GSI1PK = :type');
      expressionNames['#type'] = 'type';
      expressionValues[':type'] = input.type;
    }
    if (input.isEnabled !== undefined) {
      updateExpression.push('isEnabled = :isEnabled');
      expressionValues[':isEnabled'] = input.isEnabled;
    }
    if (input.config !== undefined) {
      updateExpression.push('config = :config');
      expressionValues[':config'] = input.config;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: NOTIFICATION_CHANNELS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating notification channel:', error);
    throw new Error('Failed to update notification channel');
  }
}

// Delete notification channel
async function deleteNotificationChannel(id) {
  try {
    const params = {
      TableName: NOTIFICATION_CHANNELS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting notification channel:', error);
    throw new Error('Failed to delete notification channel');
  }
}

// Enable notification channel
async function enableNotificationChannel(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATION_CHANNELS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isEnabled = :isEnabled, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isEnabled': true,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error enabling notification channel:', error);
    throw new Error('Failed to enable notification channel');
  }
}

// Disable notification channel
async function disableNotificationChannel(id) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATION_CHANNELS_TABLE,
      Key: { PK: id, SK: id },
      UpdateExpression: 'SET isEnabled = :isEnabled, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isEnabled': false,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error disabling notification channel:', error);
    throw new Error('Failed to disable notification channel');
  }
}

// Create notification settings
async function createNotificationSettings(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const notificationSettings = {
      PK: input.userId,
      SK: input.userId,
      id,
      userId: input.userId,
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

    const params = {
      TableName: NOTIFICATION_SETTINGS_TABLE,
      Item: notificationSettings
    };

    await docClient.send(new PutCommand(params));
    return notificationSettings;
  } catch (error) {
    console.error('Error creating notification settings:', error);
    throw new Error('Failed to create notification settings');
  }
}

// Update notification settings
async function updateNotificationSettings(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};

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
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw new Error('Failed to update notification settings');
  }
}

// Delete notification settings
async function deleteNotificationSettings(id) {
  try {
    const params = {
      TableName: NOTIFICATION_SETTINGS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting notification settings:', error);
    throw new Error('Failed to delete notification settings');
  }
}

// Update user notification settings
async function updateUserNotificationSettings(userId, input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};

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
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating user notification settings:', error);
    throw new Error('Failed to update user notification settings');
  }
}

module.exports = {
  createNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  archiveNotification,
  unarchiveNotification,
  archiveAllNotifications,
  sendNotification,
  scheduleNotification,
  createNotificationType,
  updateNotificationType,
  deleteNotificationType,
  activateNotificationType,
  deactivateNotificationType,
  createNotificationPriority,
  updateNotificationPriority,
  deleteNotificationPriority,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
  enableNotificationChannel,
  disableNotificationChannel,
  createNotificationSettings,
  updateNotificationSettings,
  deleteNotificationSettings,
  updateUserNotificationSettings
};
