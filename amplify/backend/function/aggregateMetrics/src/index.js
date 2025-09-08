// Aggregate Metrics Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const DASHBOARD_METRICS_TABLE = process.env.DASHBOARD_METRICS_TABLE;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Helper function to create aggregated metric
async function createAggregatedMetric(metricData) {
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
    console.error('Error creating aggregated metric:', error);
    throw error;
  }
}

// Aggregate timesheet metrics by period
async function aggregateTimesheetMetrics(userId, startDate, endDate, period) {
  try {
    const metrics = [];

    // Get timesheet metrics for the period
    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId AND begins_with(GSI1SK, :metricType)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':metricType': 'timesheet'
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    const timesheetMetrics = result.Items || [];

    // Filter by date range
    const filteredMetrics = timesheetMetrics.filter(metric => {
      const metricDate = new Date(metric.date);
      return metricDate >= new Date(startDate) && metricDate <= new Date(endDate);
    });

    // Aggregate by period
    const aggregatedData = aggregateByPeriod(filteredMetrics, period);

    // Create aggregated metrics
    for (const [periodKey, data] of Object.entries(aggregatedData)) {
      // Total hours
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'timesheet',
        metricName: 'totalHours',
        value: data.totalHours,
        unit: 'hours',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Daily hours
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'timesheet',
        metricName: 'dailyHours',
        value: data.dailyHours,
        unit: 'hours',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Total sessions
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'timesheet',
        metricName: 'totalSessions',
        value: data.totalSessions,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Average session length
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'timesheet',
        metricName: 'averageSessionLength',
        value: data.averageSessionLength,
        unit: 'hours',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error aggregating timesheet metrics:', error);
    throw error;
  }
}

// Aggregate case metrics by period
async function aggregateCaseMetrics(userId, startDate, endDate, period) {
  try {
    const metrics = [];

    // Get case metrics for the period
    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId AND begins_with(GSI1SK, :metricType)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':metricType': 'cases'
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    const caseMetrics = result.Items || [];

    // Filter by date range
    const filteredMetrics = caseMetrics.filter(metric => {
      const metricDate = new Date(metric.date);
      return metricDate >= new Date(startDate) && metricDate <= new Date(endDate);
    });

    // Aggregate by period
    const aggregatedData = aggregateByPeriod(filteredMetrics, period);

    // Create aggregated metrics
    for (const [periodKey, data] of Object.entries(aggregatedData)) {
      // Total cases
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'cases',
        metricName: 'totalCases',
        value: data.totalCases,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Active cases
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'cases',
        metricName: 'activeCases',
        value: data.activeCases,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Completed cases
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'cases',
        metricName: 'completedCases',
        value: data.completedCases,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // New cases
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'cases',
        metricName: 'newCases',
        value: data.newCases,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error aggregating case metrics:', error);
    throw error;
  }
}

// Aggregate document metrics by period
async function aggregateDocumentMetrics(userId, startDate, endDate, period) {
  try {
    const metrics = [];

    // Get document metrics for the period
    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId AND begins_with(GSI1SK, :metricType)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':metricType': 'documents'
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    const documentMetrics = result.Items || [];

    // Filter by date range
    const filteredMetrics = documentMetrics.filter(metric => {
      const metricDate = new Date(metric.date);
      return metricDate >= new Date(startDate) && metricDate <= new Date(endDate);
    });

    // Aggregate by period
    const aggregatedData = aggregateByPeriod(filteredMetrics, period);

    // Create aggregated metrics
    for (const [periodKey, data] of Object.entries(aggregatedData)) {
      // Total documents
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'documents',
        metricName: 'totalDocuments',
        value: data.totalDocuments,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Storage used
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'documents',
        metricName: 'storageUsed',
        value: data.storageUsed,
        unit: 'bytes',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error aggregating document metrics:', error);
    throw error;
  }
}

// Aggregate notification metrics by period
async function aggregateNotificationMetrics(userId, startDate, endDate, period) {
  try {
    const metrics = [];

    // Get notification metrics for the period
    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId AND begins_with(GSI1SK, :metricType)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':metricType': 'notifications'
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    const notificationMetrics = result.Items || [];

    // Filter by date range
    const filteredMetrics = notificationMetrics.filter(metric => {
      const metricDate = new Date(metric.date);
      return metricDate >= new Date(startDate) && metricDate <= new Date(endDate);
    });

    // Aggregate by period
    const aggregatedData = aggregateByPeriod(filteredMetrics, period);

    // Create aggregated metrics
    for (const [periodKey, data] of Object.entries(aggregatedData)) {
      // Total notifications
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'notifications',
        metricName: 'totalNotifications',
        value: data.totalNotifications,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));

      // Unread notifications
      metrics.push(await createAggregatedMetric({
        userId,
        metricType: 'notifications',
        metricName: 'unreadNotifications',
        value: data.unreadNotifications,
        unit: 'count',
        period,
        date: periodKey,
        metadata: { aggregated: true, period }
      }));
    }

    return metrics;
  } catch (error) {
    console.error('Error aggregating notification metrics:', error);
    throw error;
  }
}

// Helper function to aggregate metrics by period
function aggregateByPeriod(metrics, period) {
  const aggregated = {};

  metrics.forEach(metric => {
    const metricDate = new Date(metric.date);
    let periodKey;

    switch (period) {
      case 'daily':
        periodKey = metricDate.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(metricDate);
        weekStart.setDate(metricDate.getDate() - metricDate.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        periodKey = `${metricDate.getFullYear()}-${String(metricDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        periodKey = metricDate.getFullYear().toString();
        break;
      default:
        periodKey = metricDate.toISOString().split('T')[0];
    }

    if (!aggregated[periodKey]) {
      aggregated[periodKey] = {
        totalHours: 0,
        dailyHours: 0,
        totalSessions: 0,
        averageSessionLength: 0,
        totalCases: 0,
        activeCases: 0,
        completedCases: 0,
        newCases: 0,
        totalDocuments: 0,
        storageUsed: 0,
        totalNotifications: 0,
        unreadNotifications: 0
      };
    }

    // Aggregate based on metric name
    switch (metric.metricName) {
      case 'totalHours':
        aggregated[periodKey].totalHours += metric.value;
        break;
      case 'dailyHours':
        aggregated[periodKey].dailyHours += metric.value;
        break;
      case 'totalSessions':
        aggregated[periodKey].totalSessions += metric.value;
        break;
      case 'averageSessionLength':
        aggregated[periodKey].averageSessionLength = Math.max(
          aggregated[periodKey].averageSessionLength,
          metric.value
        );
        break;
      case 'totalCases':
        aggregated[periodKey].totalCases = Math.max(
          aggregated[periodKey].totalCases,
          metric.value
        );
        break;
      case 'activeCases':
        aggregated[periodKey].activeCases = Math.max(
          aggregated[periodKey].activeCases,
          metric.value
        );
        break;
      case 'completedCases':
        aggregated[periodKey].completedCases += metric.value;
        break;
      case 'newCases':
        aggregated[periodKey].newCases += metric.value;
        break;
      case 'totalDocuments':
        aggregated[periodKey].totalDocuments = Math.max(
          aggregated[periodKey].totalDocuments,
          metric.value
        );
        break;
      case 'storageUsed':
        aggregated[periodKey].storageUsed = Math.max(
          aggregated[periodKey].storageUsed,
          metric.value
        );
        break;
      case 'totalNotifications':
        aggregated[periodKey].totalNotifications += metric.value;
        break;
      case 'unreadNotifications':
        aggregated[periodKey].unreadNotifications = Math.max(
          aggregated[periodKey].unreadNotifications,
          metric.value
        );
        break;
    }
  });

  return aggregated;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Aggregate Metrics Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { userId, startDate, endDate, period, metricTypes } = event;

    if (!userId || !startDate || !endDate || !period) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'userId, startDate, endDate, and period are required'
        })
      };
    }

    const types = metricTypes || ['timesheet', 'cases', 'documents', 'notifications'];
    const allMetrics = [];

    // Aggregate metrics for each type
    for (const metricType of types) {
      try {
        let metrics = [];

        switch (metricType) {
          case 'timesheet':
            metrics = await aggregateTimesheetMetrics(userId, startDate, endDate, period);
            break;
          case 'cases':
            metrics = await aggregateCaseMetrics(userId, startDate, endDate, period);
            break;
          case 'documents':
            metrics = await aggregateDocumentMetrics(userId, startDate, endDate, period);
            break;
          case 'notifications':
            metrics = await aggregateNotificationMetrics(userId, startDate, endDate, period);
            break;
          default:
            console.log(`Unknown metric type: ${metricType}`);
            continue;
        }

        allMetrics.push(...metrics);
        console.log(`Aggregated ${metrics.length} metrics for ${metricType}`);
      } catch (error) {
        console.error(`Error aggregating ${metricType} metrics:`, error);
        // Continue with other metric types
      }
    }

    console.log(`Total aggregated metrics: ${allMetrics.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        metrics: allMetrics,
        count: allMetrics.length,
        period,
        startDate,
        endDate
      })
    };

  } catch (error) {
    console.error('Error aggregating metrics:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
