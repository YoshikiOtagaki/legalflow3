// Dashboard Queries Resolver
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const DASHBOARD_METRICS_TABLE = process.env.DASHBOARD_METRICS_TABLE;
const REPORTS_TABLE = process.env.REPORTS_TABLE;
const DASHBOARD_WIDGETS_TABLE = process.env.DASHBOARD_WIDGETS_TABLE;
const DASHBOARD_LAYOUTS_TABLE = process.env.DASHBOARD_LAYOUTS_TABLE;
const SYSTEM_METRICS_TABLE = process.env.SYSTEM_METRICS_TABLE;

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

// Dashboard Metrics Queries
async function getDashboardMetric(id) {
  try {
    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting dashboard metric:', error);
    throw new Error('Failed to get dashboard metric');
  }
}

async function listDashboardMetrics(filters = {}) {
  try {
    const {
      userId,
      caseId,
      metricType,
      period,
      startDate,
      endDate,
      limit,
      offset
    } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    // Determine query strategy based on filters
    if (userId) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :userId';
      expressionValues[':userId'] = userId;

      if (metricType) {
        keyCondition += ' AND begins_with(GSI1SK, :metricType)';
        expressionValues[':metricType'] = metricType;
      }
    } else if (caseId) {
      indexName = 'GSI2';
      keyCondition = 'GSI2PK = :caseId';
      expressionValues[':caseId'] = caseId;

      if (metricType) {
        keyCondition += ' AND begins_with(GSI2SK, :metricType)';
        expressionValues[':metricType'] = metricType;
      }
    } else if (metricType) {
      indexName = 'GSI3';
      keyCondition = 'GSI3PK = :metricType';
      expressionValues[':metricType'] = metricType;

      if (startDate) {
        keyCondition += ' AND GSI3SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI3SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else {
      const filterConditions = [];

      if (userId) {
        filterConditions.push('userId = :userId');
        expressionValues[':userId'] = userId;
      }
      if (caseId) {
        filterConditions.push('caseId = :caseId');
        expressionValues[':caseId'] = caseId;
      }
      if (metricType) {
        filterConditions.push('metricType = :metricType');
        expressionValues[':metricType'] = metricType;
      }
      if (period) {
        filterConditions.push('period = :period');
        expressionValues[':period'] = period;
      }
      if (startDate) {
        filterConditions.push('date >= :startDate');
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        filterConditions.push('date <= :endDate');
        expressionValues[':endDate'] = endDate;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        DASHBOARD_METRICS_TABLE,
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
        DASHBOARD_METRICS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing dashboard metrics:', error);
    throw new Error('Failed to list dashboard metrics');
  }
}

async function listUserMetrics(userId, filters = {}) {
  return listDashboardMetrics({ ...filters, userId });
}

async function listCaseMetrics(caseId, filters = {}) {
  return listDashboardMetrics({ ...filters, caseId });
}

async function listMetricsByType(metricType, filters = {}) {
  return listDashboardMetrics({ ...filters, metricType });
}

async function getDashboardStats(userId) {
  try {
    // Get timesheet stats
    const timesheetMetrics = await listDashboardMetrics({
      userId,
      metricType: 'timesheet',
      limit: 1000
    });

    // Get case stats
    const caseMetrics = await listDashboardMetrics({
      userId,
      metricType: 'cases',
      limit: 1000
    });

    // Get document stats
    const documentMetrics = await listDashboardMetrics({
      userId,
      metricType: 'documents',
      limit: 1000
    });

    // Get notification stats
    const notificationMetrics = await listDashboardMetrics({
      userId,
      metricType: 'notifications',
      limit: 1000
    });

    // Process timesheet stats
    const timesheetStats = processTimesheetStats(timesheetMetrics.items);

    // Process case stats
    const caseStats = processCaseStats(caseMetrics.items);

    // Process document stats
    const documentStats = processDocumentStats(documentMetrics.items);

    // Process notification stats
    const notificationStats = processNotificationStats(notificationMetrics.items);

    return {
      timesheet: timesheetStats,
      cases: caseStats,
      documents: documentStats,
      notifications: notificationStats,
      system: {
        apiResponseTime: 0,
        errorRate: 0,
        activeUsers: 0,
        totalUsers: 0,
        systemHealth: 'healthy',
        resourceUtilization: {
          cpu: 0,
          memory: 0,
          storage: 0,
          network: 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw new Error('Failed to get dashboard stats');
  }
}

// Helper function to process timesheet stats
function processTimesheetStats(metrics) {
  const totalHours = metrics
    .filter(m => m.metricName === 'totalHours')
    .reduce((sum, m) => sum + m.value, 0);

  const dailyHours = metrics
    .filter(m => m.metricName === 'dailyHours')
    .reduce((sum, m) => sum + m.value, 0);

  const weeklyHours = metrics
    .filter(m => m.metricName === 'weeklyHours')
    .reduce((sum, m) => sum + m.value, 0);

  const monthlyHours = metrics
    .filter(m => m.metricName === 'monthlyHours')
    .reduce((sum, m) => sum + m.value, 0);

  const averageSessionLength = metrics
    .filter(m => m.metricName === 'averageSessionLength')
    .reduce((sum, m) => sum + m.value, 0) / metrics.length || 0;

  const totalSessions = metrics
    .filter(m => m.metricName === 'totalSessions')
    .reduce((sum, m) => sum + m.value, 0);

  // Process case breakdown
  const caseBreakdown = {};
  metrics
    .filter(m => m.metricName === 'caseHours' && m.caseId)
    .forEach(m => {
      const caseName = m.metadata?.caseName || `Case ${m.caseId}`;
      caseBreakdown[caseName] = (caseBreakdown[caseName] || 0) + m.value;
    });

  // Process task breakdown
  const taskBreakdown = {};
  metrics
    .filter(m => m.metricName === 'taskHours')
    .forEach(m => {
      const taskTitle = m.metadata?.taskTitle || `Task ${m.metadata?.taskId}`;
      taskBreakdown[taskTitle] = (taskBreakdown[taskTitle] || 0) + m.value;
    });

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    dailyHours: Math.round(dailyHours * 100) / 100,
    weeklyHours: Math.round(weeklyHours * 100) / 100,
    monthlyHours: Math.round(monthlyHours * 100) / 100,
    averageSessionLength: Math.round(averageSessionLength * 100) / 100,
    totalSessions,
    caseBreakdown: Object.entries(caseBreakdown).map(([caseName, hours]) => ({
      caseId: null,
      caseName,
      hours: Math.round(hours * 100) / 100
    })),
    taskBreakdown: Object.entries(taskBreakdown).map(([taskTitle, hours]) => ({
      taskId: null,
      taskTitle,
      hours: Math.round(hours * 100) / 100
    })),
    dailyTrend: [],
    weeklyTrend: [],
    monthlyTrend: []
  };
}

// Helper function to process case stats
function processCaseStats(metrics) {
  const totalCases = metrics
    .filter(m => m.metricName === 'totalCases')
    .reduce((sum, m) => sum + m.value, 0);

  const activeCases = metrics
    .filter(m => m.metricName === 'activeCases')
    .reduce((sum, m) => sum + m.value, 0);

  const completedCases = metrics
    .filter(m => m.metricName === 'completedCases')
    .reduce((sum, m) => sum + m.value, 0);

  const newCases = metrics
    .filter(m => m.metricName === 'newCases')
    .reduce((sum, m) => sum + m.value, 0);

  const averageCaseDuration = metrics
    .filter(m => m.metricName === 'averageCaseDuration')
    .reduce((sum, m) => sum + m.value, 0) / metrics.length || 0;

  return {
    totalCases,
    activeCases,
    completedCases,
    newCases,
    averageCaseDuration: Math.round(averageCaseDuration * 100) / 100,
    caseStatusDistribution: [],
    casePriorityDistribution: [],
    caseTypeDistribution: [],
    recentCases: []
  };
}

// Helper function to process document stats
function processDocumentStats(metrics) {
  const totalDocuments = metrics
    .filter(m => m.metricName === 'totalDocuments')
    .reduce((sum, m) => sum + m.value, 0);

  const storageUsed = metrics
    .filter(m => m.metricName === 'storageUsed')
    .reduce((sum, m) => sum + m.value, 0);

  return {
    totalDocuments,
    documentsByType: [],
    documentsByStatus: [],
    storageUsed: Math.round(storageUsed * 100) / 100,
    recentDocuments: [],
    generationStats: {
      totalGenerated: 0,
      successRate: 0,
      averageGenerationTime: 0
    }
  };
}

// Helper function to process notification stats
function processNotificationStats(metrics) {
  const totalNotifications = metrics
    .filter(m => m.metricName === 'totalNotifications')
    .reduce((sum, m) => sum + m.value, 0);

  const unreadNotifications = metrics
    .filter(m => m.metricName === 'unreadNotifications')
    .reduce((sum, m) => sum + m.value, 0);

  return {
    totalNotifications,
    unreadNotifications,
    notificationTypes: [],
    deliveryStats: {
      totalSent: 0,
      deliveryRate: 0,
      channelBreakdown: []
    },
    recentNotifications: []
  };
}

// Reports Queries
async function getReport(id) {
  try {
    const params = {
      TableName: REPORTS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting report:', error);
    throw new Error('Failed to get report');
  }
}

async function listReports(filters = {}) {
  try {
    const {
      userId,
      reportType,
      status,
      startDate,
      endDate,
      limit,
      offset
    } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (userId) {
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
    } else if (reportType) {
      indexName = 'GSI2';
      keyCondition = 'GSI2PK = :reportType';
      expressionValues[':reportType'] = reportType;

      if (startDate) {
        keyCondition += ' AND GSI2SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI2SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else {
      const filterConditions = [];

      if (userId) {
        filterConditions.push('userId = :userId');
        expressionValues[':userId'] = userId;
      }
      if (reportType) {
        filterConditions.push('reportType = :reportType');
        expressionValues[':reportType'] = reportType;
      }
      if (status) {
        filterConditions.push('status = :status');
        expressionValues[':status'] = status;
      }
      if (startDate) {
        filterConditions.push('createdAt >= :startDate');
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        filterConditions.push('createdAt <= :endDate');
        expressionValues[':endDate'] = endDate;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        REPORTS_TABLE,
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
        REPORTS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing reports:', error);
    throw new Error('Failed to list reports');
  }
}

async function listUserReports(userId, filters = {}) {
  return listReports({ ...filters, userId });
}

async function listReportsByType(reportType, filters = {}) {
  return listReports({ ...filters, reportType });
}

// Dashboard Widgets Queries
async function getDashboardWidget(id) {
  try {
    const params = {
      TableName: DASHBOARD_WIDGETS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting dashboard widget:', error);
    throw new Error('Failed to get dashboard widget');
  }
}

async function listDashboardWidgets(filters = {}) {
  try {
    const {
      userId,
      widgetType,
      isVisible,
      limit,
      offset
    } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (userId) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :userId';
      expressionValues[':userId'] = userId;
    } else {
      const filterConditions = [];

      if (userId) {
        filterConditions.push('userId = :userId');
        expressionValues[':userId'] = userId;
      }
      if (widgetType) {
        filterConditions.push('widgetType = :widgetType');
        expressionValues[':widgetType'] = widgetType;
      }
      if (isVisible !== undefined) {
        filterConditions.push('isVisible = :isVisible');
        expressionValues[':isVisible'] = isVisible;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        DASHBOARD_WIDGETS_TABLE,
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
        DASHBOARD_WIDGETS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing dashboard widgets:', error);
    throw new Error('Failed to list dashboard widgets');
  }
}

async function listUserWidgets(userId, filters = {}) {
  return listDashboardWidgets({ ...filters, userId });
}

async function listVisibleWidgets(userId) {
  return listDashboardWidgets({ userId, isVisible: true });
}

// Dashboard Layouts Queries
async function getDashboardLayout(id) {
  try {
    const params = {
      TableName: DASHBOARD_LAYOUTS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting dashboard layout:', error);
    throw new Error('Failed to get dashboard layout');
  }
}

async function listDashboardLayouts(filters = {}) {
  try {
    const {
      userId,
      isActive,
      limit,
      offset
    } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (userId) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :userId';
      expressionValues[':userId'] = userId;
    } else {
      const filterConditions = [];

      if (userId) {
        filterConditions.push('userId = :userId');
        expressionValues[':userId'] = userId;
      }
      if (isActive !== undefined) {
        filterConditions.push('isActive = :isActive');
        expressionValues[':isActive'] = isActive;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        DASHBOARD_LAYOUTS_TABLE,
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
        DASHBOARD_LAYOUTS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing dashboard layouts:', error);
    throw new Error('Failed to list dashboard layouts');
  }
}

async function listUserLayouts(userId, filters = {}) {
  return listDashboardLayouts({ ...filters, userId });
}

async function getActiveLayout(userId) {
  try {
    const result = await listDashboardLayouts({ userId, isActive: true, limit: 1 });
    return result.items[0] || null;
  } catch (error) {
    console.error('Error getting active layout:', error);
    throw new Error('Failed to get active layout');
  }
}

// System Metrics Queries
async function getSystemMetric(id) {
  try {
    const params = {
      TableName: SYSTEM_METRICS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting system metric:', error);
    throw new Error('Failed to get system metric');
  }
}

async function listSystemMetrics(filters = {}) {
  try {
    const {
      serviceName,
      metricType,
      startDate,
      endDate,
      limit,
      offset
    } = filters;

    let keyCondition = '';
    let filterExpression = '';
    let expressionValues = {};
    let indexName = null;

    if (serviceName) {
      indexName = 'GSI2';
      keyCondition = 'GSI2PK = :serviceName';
      expressionValues[':serviceName'] = serviceName;

      if (startDate) {
        keyCondition += ' AND GSI2SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI2SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else if (metricType) {
      indexName = 'GSI1';
      keyCondition = 'GSI1PK = :metricType';
      expressionValues[':metricType'] = metricType;

      if (startDate) {
        keyCondition += ' AND GSI1SK >= :startDate';
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        keyCondition += ' AND GSI1SK <= :endDate';
        expressionValues[':endDate'] = endDate;
      }
    } else {
      const filterConditions = [];

      if (serviceName) {
        filterConditions.push('serviceName = :serviceName');
        expressionValues[':serviceName'] = serviceName;
      }
      if (metricType) {
        filterConditions.push('metricType = :metricType');
        expressionValues[':metricType'] = metricType;
      }
      if (startDate) {
        filterConditions.push('timestamp >= :startDate');
        expressionValues[':startDate'] = startDate;
      }
      if (endDate) {
        filterConditions.push('timestamp <= :endDate');
        expressionValues[':endDate'] = endDate;
      }

      filterExpression = filterConditions.join(' AND ');
    }

    let result;
    if (indexName) {
      const params = buildQueryParams(
        SYSTEM_METRICS_TABLE,
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
        SYSTEM_METRICS_TABLE,
        filterExpression,
        expressionValues,
        limit,
        offset
      );
      result = await docClient.send(new ScanCommand(params));
    }

    return processQueryResults(result);
  } catch (error) {
    console.error('Error listing system metrics:', error);
    throw new Error('Failed to list system metrics');
  }
}

async function listServiceMetrics(serviceName, filters = {}) {
  return listSystemMetrics({ ...filters, serviceName });
}

async function listMetricsByType(metricType, filters = {}) {
  return listSystemMetrics({ ...filters, metricType });
}

module.exports = {
  // Dashboard Metrics
  getDashboardMetric,
  listDashboardMetrics,
  listUserMetrics,
  listCaseMetrics,
  listMetricsByType,
  getDashboardStats,

  // Reports
  getReport,
  listReports,
  listUserReports,
  listReportsByType,

  // Dashboard Widgets
  getDashboardWidget,
  listDashboardWidgets,
  listUserWidgets,
  listVisibleWidgets,

  // Dashboard Layouts
  getDashboardLayout,
  listDashboardLayouts,
  listUserLayouts,
  getActiveLayout,

  // System Metrics
  getSystemMetric,
  listSystemMetrics,
  listServiceMetrics,
  listMetricsByType
};
