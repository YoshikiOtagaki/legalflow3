// Collect Metrics Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const DASHBOARD_METRICS_TABLE = process.env.DASHBOARD_METRICS_TABLE;
const TIMESHEET_ENTRIES_TABLE = process.env.TIMESHEET_ENTRIES_TABLE;
const CASES_TABLE = process.env.CASES_TABLE;
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Helper function to create metric
async function createMetric(metricData) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const metric = {
      PK: id,
      SK: id,
      GSI1PK: metricData.userId || 'system',
      GSI1SK: `${metricData.metricType}-${metricData.date}`,
      GSI2PK: metricData.caseId || 'global',
      GSI2SK: `${metricData.metricType}-${metricData.date}`,
      GSI3PK: metricData.metricType,
      GSI3SK: metricData.date,
      id,
      userId: metricData.userId || null,
      caseId: metricData.caseId || null,
      metricType: metricData.metricType,
      metricName: metricData.metricName,
      value: metricData.value,
      unit: metricData.unit,
      period: metricData.period,
      date: metricData.date,
      metadata: metricData.metadata || null,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      Item: metric
    };

    await docClient.send(new PutCommand(params));
    return metric;
  } catch (error) {
    console.error('Error creating metric:', error);
    throw error;
  }
}

// Collect timesheet metrics
async function collectTimesheetMetrics(userId, date) {
  try {
    const metrics = [];

    // Get timesheet entries for the user
    const params = {
      TableName: TIMESHEET_ENTRIES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    };

    const result = await docClient.send(new QueryCommand(params));
    const entries = result.Items || [];

    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

    // Calculate daily hours (for the specific date)
    const dailyHours = entries
      .filter(entry => entry.date === date)
      .reduce((sum, entry) => sum + (entry.hours || 0), 0);

    // Calculate weekly hours (last 7 days)
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyHours = entries
      .filter(entry => new Date(entry.date) >= weekStart)
      .reduce((sum, entry) => sum + (entry.hours || 0), 0);

    // Calculate monthly hours (last 30 days)
    const monthStart = new Date(date);
    monthStart.setDate(monthStart.getDate() - 30);
    const monthlyHours = entries
      .filter(entry => new Date(entry.date) >= monthStart)
      .reduce((sum, entry) => sum + (entry.hours || 0), 0);

    // Calculate average session length
    const averageSessionLength = entries.length > 0 ? totalHours / entries.length : 0;

    // Create metrics
    metrics.push(await createMetric({
      userId,
      metricType: 'timesheet',
      metricName: 'totalHours',
      value: totalHours,
      unit: 'hours',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'timesheet',
      metricName: 'dailyHours',
      value: dailyHours,
      unit: 'hours',
      period: 'daily',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'timesheet',
      metricName: 'weeklyHours',
      value: weeklyHours,
      unit: 'hours',
      period: 'weekly',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'timesheet',
      metricName: 'monthlyHours',
      value: monthlyHours,
      unit: 'hours',
      period: 'monthly',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'timesheet',
      metricName: 'averageSessionLength',
      value: averageSessionLength,
      unit: 'hours',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'timesheet',
      metricName: 'totalSessions',
      value: entries.length,
      unit: 'count',
      period: 'all',
      date
    }));

    // Case breakdown
    const caseHours = {};
    entries.forEach(entry => {
      if (entry.caseId) {
        const caseName = entry.case?.name || `Case ${entry.caseId}`;
        caseHours[caseName] = (caseHours[caseName] || 0) + (entry.hours || 0);
      }
    });

    for (const [caseName, hours] of Object.entries(caseHours)) {
      metrics.push(await createMetric({
        userId,
        metricType: 'timesheet',
        metricName: 'caseHours',
        value: hours,
        unit: 'hours',
        period: 'all',
        date,
        metadata: { caseName }
      }));
    }

    // Task breakdown
    const taskHours = {};
    entries.forEach(entry => {
      if (entry.taskId) {
        const taskTitle = entry.task?.title || `Task ${entry.taskId}`;
        taskHours[taskTitle] = (taskHours[taskTitle] || 0) + (entry.hours || 0);
      }
    });

    for (const [taskTitle, hours] of Object.entries(taskHours)) {
      metrics.push(await createMetric({
        userId,
        metricType: 'timesheet',
        metricName: 'taskHours',
        value: hours,
        unit: 'hours',
        period: 'all',
        date,
        metadata: { taskTitle }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error collecting timesheet metrics:', error);
    throw error;
  }
}

// Collect case metrics
async function collectCaseMetrics(userId, date) {
  try {
    const metrics = [];

    // Get cases for the user
    const params = {
      TableName: CASES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    };

    const result = await docClient.send(new QueryCommand(params));
    const cases = result.Items || [];

    // Calculate case statistics
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    const completedCases = cases.filter(c => c.status === 'completed').length;
    const newCases = cases.filter(c => {
      const caseDate = new Date(c.createdAt);
      const targetDate = new Date(date);
      return caseDate.toDateString() === targetDate.toDateString();
    }).length;

    // Calculate average case duration
    const completedCasesWithDuration = cases.filter(c => c.status === 'completed' && c.completedAt);
    const averageCaseDuration = completedCasesWithDuration.length > 0
      ? completedCasesWithDuration.reduce((sum, c) => {
          const duration = new Date(c.completedAt) - new Date(c.createdAt);
          return sum + duration;
        }, 0) / completedCasesWithDuration.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Create metrics
    metrics.push(await createMetric({
      userId,
      metricType: 'cases',
      metricName: 'totalCases',
      value: totalCases,
      unit: 'count',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'cases',
      metricName: 'activeCases',
      value: activeCases,
      unit: 'count',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'cases',
      metricName: 'completedCases',
      value: completedCases,
      unit: 'count',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'cases',
      metricName: 'newCases',
      value: newCases,
      unit: 'count',
      period: 'daily',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'cases',
      metricName: 'averageCaseDuration',
      value: averageCaseDuration,
      unit: 'days',
      period: 'all',
      date
    }));

    return metrics;
  } catch (error) {
    console.error('Error collecting case metrics:', error);
    throw error;
  }
}

// Collect document metrics
async function collectDocumentMetrics(userId, date) {
  try {
    const metrics = [];

    // Get documents for the user
    const params = {
      TableName: DOCUMENTS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    };

    const result = await docClient.send(new QueryCommand(params));
    const documents = result.Items || [];

    // Calculate document statistics
    const totalDocuments = documents.length;
    const storageUsed = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);

    // Document type breakdown
    const documentsByType = {};
    documents.forEach(doc => {
      const type = doc.type || 'unknown';
      documentsByType[type] = (documentsByType[type] || 0) + 1;
    });

    // Document status breakdown
    const documentsByStatus = {};
    documents.forEach(doc => {
      const status = doc.status || 'unknown';
      documentsByStatus[status] = (documentsByStatus[status] || 0) + 1;
    });

    // Create metrics
    metrics.push(await createMetric({
      userId,
      metricType: 'documents',
      metricName: 'totalDocuments',
      value: totalDocuments,
      unit: 'count',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'documents',
      metricName: 'storageUsed',
      value: storageUsed,
      unit: 'bytes',
      period: 'all',
      date
    }));

    // Type breakdown metrics
    for (const [type, count] of Object.entries(documentsByType)) {
      metrics.push(await createMetric({
        userId,
        metricType: 'documents',
        metricName: 'documentsByType',
        value: count,
        unit: 'count',
        period: 'all',
        date,
        metadata: { type }
      }));
    }

    // Status breakdown metrics
    for (const [status, count] of Object.entries(documentsByStatus)) {
      metrics.push(await createMetric({
        userId,
        metricType: 'documents',
        metricName: 'documentsByStatus',
        value: count,
        unit: 'count',
        period: 'all',
        date,
        metadata: { status }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error collecting document metrics:', error);
    throw error;
  }
}

// Collect notification metrics
async function collectNotificationMetrics(userId, date) {
  try {
    const metrics = [];

    // Get notifications for the user
    const params = {
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    };

    const result = await docClient.send(new QueryCommand(params));
    const notifications = result.Items || [];

    // Calculate notification statistics
    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    // Notification type breakdown
    const notificationsByType = {};
    notifications.forEach(notification => {
      const type = notification.typeId || 'unknown';
      notificationsByType[type] = (notificationsByType[type] || 0) + 1;
    });

    // Create metrics
    metrics.push(await createMetric({
      userId,
      metricType: 'notifications',
      metricName: 'totalNotifications',
      value: totalNotifications,
      unit: 'count',
      period: 'all',
      date
    }));

    metrics.push(await createMetric({
      userId,
      metricType: 'notifications',
      metricName: 'unreadNotifications',
      value: unreadNotifications,
      unit: 'count',
      period: 'all',
      date
    }));

    // Type breakdown metrics
    for (const [type, count] of Object.entries(notificationsByType)) {
      metrics.push(await createMetric({
        userId,
        metricType: 'notifications',
        metricName: 'notificationsByType',
        value: count,
        unit: 'count',
        period: 'all',
        date,
        metadata: { type }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error collecting notification metrics:', error);
    throw error;
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Collect Metrics Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { userId, date, metricTypes } = event;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'userId is required'
        })
      };
    }

    const targetDate = date || getCurrentTimestamp();
    const types = metricTypes || ['timesheet', 'cases', 'documents', 'notifications'];

    const allMetrics = [];

    // Collect metrics for each type
    for (const metricType of types) {
      try {
        let metrics = [];

        switch (metricType) {
          case 'timesheet':
            metrics = await collectTimesheetMetrics(userId, targetDate);
            break;
          case 'cases':
            metrics = await collectCaseMetrics(userId, targetDate);
            break;
          case 'documents':
            metrics = await collectDocumentMetrics(userId, targetDate);
            break;
          case 'notifications':
            metrics = await collectNotificationMetrics(userId, targetDate);
            break;
          default:
            console.log(`Unknown metric type: ${metricType}`);
            continue;
        }

        allMetrics.push(...metrics);
        console.log(`Collected ${metrics.length} metrics for ${metricType}`);
      } catch (error) {
        console.error(`Error collecting ${metricType} metrics:`, error);
        // Continue with other metric types
      }
    }

    console.log(`Total metrics collected: ${allMetrics.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        metrics: allMetrics,
        count: allMetrics.length
      })
    };

  } catch (error) {
    console.error('Error collecting metrics:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
