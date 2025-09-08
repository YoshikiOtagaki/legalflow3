// Notification Queries Resolver
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;
const NOTIFICATION_TYPES_TABLE = process.env.NOTIFICATION_TYPES_TABLE;
const NOTIFICATION_PRIORITIES_TABLE = process.env.NOTIFICATION_PRIORITIES_TABLE;
const NOTIFICATION_CHANNELS_TABLE = process.env.NOTIFICATION_CHANNELS_TABLE;
const NOTIFICATION_SETTINGS_TABLE = process.env.NOTIFICATION_SETTINGS_TABLE;

// Helper function to build query parameters
function buildQueryParams(tableName, indexName, keyCondition, filterExpression, expressionValues, limit, offset) {
  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
    Limit: limit || 20,
    ScanIndexForward: false // Sort by creation date descending
  };

  if (filterExpression) {
    params.FilterExpression = filterExpression;
  }

  if (offset) {
    params.ExclusiveStartKey = offset;
  }

  return params;
}

// Helper function to build scan parameters
function buildScanParams(tableName, filterExpression, expressionValues, limit, offset) {
  const params = {
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionValues,
    Limit: limit || 20
  };

  if (offset) {
    params.ExclusiveStartKey = offset;
  }

  return params;
}

// Helper function to process query results
function processQueryResults(result) {
  return {
    items: result.Items || [],
    totalCount: result.Count || 0,
    hasMore: !!result.LastEvaluatedKey,
    lastEvaluatedKey: result.LastEvaluatedKey
  };
}

// Get single notification
async function getNotification(id) {
  try {
    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting notification:', error);
    throw new Error('Failed to get notification');
  }
}

// List notifications with filters
async function listNotifications(filters = {}) {
  try {
    const {
      userId,
      typeId,
      priorityId,
      isRead,
      isArchived,
      channels,
      startDate,
      endDate,
      searchTerm,
      limit,
      offset
    } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    // Determine query strategy based on filters
    if (userId) {
      // Query by user using GSI1
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :userId';
      expressionValues[':userId'] = userId;

      if (startDate) {
        keyCondition += ' AND GSI1SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI1SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else if (typeId) {
      // Query by type using GSI2
      indexName = 'GSI2';
      keyCondition = 'GSI2PK = :typeId';
      expressionValues[':typeId'] = typeId;

      if (startDate) {
        keyCondition += ' AND GSI2SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI2SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else if (priorityId) {
      // Query by priority using GSI3
      indexName = 'GSI3';
      keyCondition = 'GSI3PK = :priorityId';
      expressionValues[':priorityId'] = priorityId;

      if (startDate) {
        keyCondition += ' AND GSI3SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI3SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else if (isRead !== undefined) {
      // Query by read status using GSI4
      indexName = 'GSI4';
      keyCondition = 'GSI4PK = :readStatus';
      expressionValues[':readStatus'] = isRead ? 'read' : 'unread';

      if (startDate) {
        keyCondition += ' AND GSI4SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI4SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else {
      // Scan table with filters
      const filterConditions = [];

      if (userId) {
        filterConditions.push('userId = :userId');
        expressionValues[':userId'] = userId;
      }
      if (typeId) {
        filterConditions.push('typeId = :typeId');
        expressionValues[':typeId'] = typeId;
      }
      if (priorityId) {
        filterConditions.push('priorityId = :priorityId');
        expressionValues[':priorityId'] = priorityId;
      }
      if (isRead !== undefined) {
        filterConditions.push('isRead = :isRead');
        expressionValues[':isRead'] = isRead;
      }
      if (isArchived !== undefined) {
        filterConditions.push('isArchived = :isArchived');
        expressionValues[':isArchived'] = isArchived;
      }
      if (channels && channels.length > 0) {
        filterConditions.push('contains(channels, :channel)');
        expressionValues[':channel'] = channels[0]; // DynamoDB limitation
      }
      if (startDate) {
        filterConditions.push('createdAt >= :startDate');
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        filterConditions.push('createdAt <= :endDate');
        expressionValues[':endDate'] = endDate;
      }
      if (searchTerm) {
        filterConditions.push('(contains(title, :searchTerm) OR contains(message, :searchTerm))');
        expressionValues[':searchTerm'] = searchTerm;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        NOTIFICATIONS_TABLE,
        indexName,
        keyCondition,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new QueryCommand(params));
    } else {
      const params = buildScanParams(
        NOTIFICATIONS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing notifications:', error);
    throw new Error('Failed to list notifications');
  }
}

// List user notifications
async function listUserNotifications(userId, filters = {}) {
  return listNotifications({ ...filters, userId });
}

// List unread notifications
async function listUnreadNotifications(userId, filters = {}) {
  return listNotifications({ ...filters, userId, isRead: false });
}

// List archived notifications
async function listArchivedNotifications(userId, filters = {}) {
  return listNotifications({ ...filters, userId, isArchived: true });
}

// Search notifications
async function searchNotifications(searchTerm, filters = {}) {
  return listNotifications({ ...filters, searchTerm });
}

// Get notification statistics
async function getNotificationStats(userId) {
  try {
    const params = {
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    };

    const result = await docClient.send(new QueryCommand(params));
    const notifications = result.Items || [];

    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      read: notifications.filter(n => n.isRead).length,
      archived: notifications.filter(n => n.isArchived).length,
      byType: {},
      byPriority: {},
      byChannel: {}
    };

    // Count by type
    notifications.forEach(notification => {
      const typeId = notification.typeId;
      if (!stats.byType[typeId]) {
        stats.byType[typeId] = { typeId, typeName: notification.type?.name || 'Unknown', count: 0 };
      }
      stats.byType[typeId].count++;
    });

    // Count by priority
    notifications.forEach(notification => {
      const priorityId = notification.priorityId;
      if (!stats.byPriority[priorityId]) {
        stats.byPriority[priorityId] = { priorityId, priorityName: notification.priority?.name || 'Unknown', count: 0 };
      }
      stats.byPriority[priorityId].count++;
    });

    // Count by channel
    notifications.forEach(notification => {
      notification.channels.forEach(channel => {
        if (!stats.byChannel[channel]) {
          stats.byChannel[channel] = { channel, count: 0 };
        }
        stats.byChannel[channel].count++;
      });
    });

    return {
      ...stats,
      byType: Object.values(stats.byType),
      byPriority: Object.values(stats.byPriority),
      byChannel: Object.values(stats.byChannel)
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw new Error('Failed to get notification stats');
  }
}

// Get notification type
async function getNotificationType(id) {
  try {
    const params = {
      TableName: NOTIFICATION_TYPES_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting notification type:', error);
    throw new Error('Failed to get notification type');
  }
}

// List notification types
async function listNotificationTypes(filters = {}) {
  try {
    const { category, isActive, searchTerm, limit, offset } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (category) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :category';
      expressionValues[':category'] = category;
    } else {
      const filterConditions = [];

      if (isActive !== undefined) {
        filterConditions.push('isActive = :isActive');
        expressionValues[':isActive'] = isActive;
      }
      if (searchTerm) {
        filterConditions.push('(contains(name, :searchTerm) OR contains(description, :searchTerm))');
        expressionValues[':searchTerm'] = searchTerm;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        NOTIFICATION_TYPES_TABLE,
        indexName,
        keyCondition,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new QueryCommand(params));
    } else {
      const params = buildScanParams(
        NOTIFICATION_TYPES_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing notification types:', error);
    throw new Error('Failed to list notification types');
  }
}

// List notification types by category
async function listNotificationTypesByCategory(category, filters = {}) {
  return listNotificationTypes({ ...filters, category });
}

// Search notification types
async function searchNotificationTypes(searchTerm, filters = {}) {
  return listNotificationTypes({ ...filters, searchTerm });
}

// Get notification priority
async function getNotificationPriority(id) {
  try {
    const params = {
      TableName: NOTIFICATION_PRIORITIES_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting notification priority:', error);
    throw new Error('Failed to get notification priority');
  }
}

// List notification priorities
async function listNotificationPriorities(filters = {}) {
  try {
    const { level, searchTerm, limit, offset } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (level !== undefined) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :level';
      expressionValues[':level'] = level;
    } else {
      const filterConditions = [];

      if (searchTerm) {
        filterConditions.push('(contains(name, :searchTerm) OR contains(color, :searchTerm))');
        expressionValues[':searchTerm'] = searchTerm;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        NOTIFICATION_PRIORITIES_TABLE,
        indexName,
        keyCondition,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new QueryCommand(params));
    } else {
      const params = buildScanParams(
        NOTIFICATION_PRIORITIES_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing notification priorities:', error);
    throw new Error('Failed to list notification priorities');
  }
}

// List notification priorities by level
async function listNotificationPrioritiesByLevel(level, filters = {}) {
  return listNotificationPriorities({ ...filters, level });
}

// Search notification priorities
async function searchNotificationPriorities(searchTerm, filters = {}) {
  return listNotificationPriorities({ ...filters, searchTerm });
}

// Get notification channel
async function getNotificationChannel(id) {
  try {
    const params = {
      TableName: NOTIFICATION_CHANNELS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting notification channel:', error);
    throw new Error('Failed to get notification channel');
  }
}

// List notification channels
async function listNotificationChannels(filters = {}) {
  try {
    const { type, isEnabled, searchTerm, limit, offset } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (type) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :type';
      expressionValues[':type'] = type;
    } else {
      const filterConditions = [];

      if (isEnabled !== undefined) {
        filterConditions.push('isEnabled = :isEnabled');
        expressionValues[':isEnabled'] = isEnabled;
      }
      if (searchTerm) {
        filterConditions.push('(contains(name, :searchTerm) OR contains(type, :searchTerm))');
        expressionValues[':searchTerm'] = searchTerm;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        NOTIFICATION_CHANNELS_TABLE,
        indexName,
        keyCondition,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new QueryCommand(params));
    } else {
      const params = buildScanParams(
        NOTIFICATION_CHANNELS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing notification channels:', error);
    throw new Error('Failed to list notification channels');
  }
}

// List notification channels by type
async function listNotificationChannelsByType(type, filters = {}) {
  return listNotificationChannels({ ...filters, type });
}

// Search notification channels
async function searchNotificationChannels(searchTerm, filters = {}) {
  return listNotificationChannels({ ...filters, searchTerm });
}

// Get notification settings
async function getNotificationSettings(userId) {
  try {
    const params = {
      TableName: NOTIFICATION_SETTINGS_TABLE,
      Key: { PK: userId, SK: userId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw new Error('Failed to get notification settings');
  }
}

// Get user notification settings (alias)
async function getUserNotificationSettings(userId) {
  return getNotificationSettings(userId);
}

module.exports = {
  getNotification,
  listNotifications,
  listUserNotifications,
  listUnreadNotifications,
  listArchivedNotifications,
  searchNotifications,
  getNotificationStats,
  getNotificationType,
  listNotificationTypes,
  listNotificationTypesByCategory,
  searchNotificationTypes,
  getNotificationPriority,
  listNotificationPriorities,
  listNotificationPrioritiesByLevel,
  searchNotificationPriorities,
  getNotificationChannel,
  listNotificationChannels,
  listNotificationChannelsByType,
  searchNotificationChannels,
  getNotificationSettings,
  getUserNotificationSettings
};
