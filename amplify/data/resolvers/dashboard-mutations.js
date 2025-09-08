// Dashboard Mutations Resolver
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);

const DASHBOARD_METRICS_TABLE = process.env.DASHBOARD_METRICS_TABLE;
const REPORTS_TABLE = process.env.REPORTS_TABLE;
const DASHBOARD_WIDGETS_TABLE = process.env.DASHBOARD_WIDGETS_TABLE;
const DASHBOARD_LAYOUTS_TABLE = process.env.DASHBOARD_LAYOUTS_TABLE;
const SYSTEM_METRICS_TABLE = process.env.SYSTEM_METRICS_TABLE;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Dashboard Metrics Mutations
async function createDashboardMetric(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const metric = {
      PK: id,
      SK: id,
      GSI1PK: input.userId || 'system',
      GSI1SK: `${input.metricType}-${input.date}`,
      GSI2PK: input.caseId || 'global',
      GSI2SK: `${input.metricType}-${input.date}`,
      GSI3PK: input.metricType,
      GSI3SK: input.date,
      id,
      userId: input.userId || null,
      caseId: input.caseId || null,
      metricType: input.metricType,
      metricName: input.metricName,
      value: input.value,
      unit: input.unit,
      period: input.period,
      date: input.date,
      metadata: input.metadata || null,
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
    console.error('Error creating dashboard metric:', error);
    throw new Error('Failed to create dashboard metric');
  }
}

async function updateDashboardMetric(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    if (input.metricName !== undefined) {
      updateExpression.push('metricName = :metricName');
      expressionValues[':metricName'] = input.metricName;
    }
    if (input.value !== undefined) {
      updateExpression.push('#value = :value');
      expressionNames['#value'] = 'value';
      expressionValues[':value'] = input.value;
    }
    if (input.unit !== undefined) {
      updateExpression.push('unit = :unit');
      expressionValues[':unit'] = input.unit;
    }
    if (input.period !== undefined) {
      updateExpression.push('period = :period');
      expressionValues[':period'] = input.period;
    }
    if (input.date !== undefined) {
      updateExpression.push('#date = :date, GSI1SK = :gsi1sk, GSI2SK = :gsi2sk, GSI3SK = :gsi3sk');
      expressionNames['#date'] = 'date';
      expressionValues[':date'] = input.date;
      expressionValues[':gsi1sk'] = `${input.metricType}-${input.date}`;
      expressionValues[':gsi2sk'] = `${input.metricType}-${input.date}`;
      expressionValues[':gsi3sk'] = input.date;
    }
    if (input.metadata !== undefined) {
      updateExpression.push('metadata = :metadata');
      expressionValues[':metadata'] = input.metadata;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating dashboard metric:', error);
    throw new Error('Failed to update dashboard metric');
  }
}

async function deleteDashboardMetric(id) {
  try {
    const params = {
      TableName: DASHBOARD_METRICS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting dashboard metric:', error);
    throw new Error('Failed to delete dashboard metric');
  }
}

async function bulkCreateMetrics(inputs) {
  try {
    const metrics = [];

    for (const input of inputs) {
      const metric = await createDashboardMetric(input);
      metrics.push(metric);
    }

    return metrics;
  } catch (error) {
    console.error('Error bulk creating metrics:', error);
    throw new Error('Failed to bulk create metrics');
  }
}

// Reports Mutations
async function createReport(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const report = {
      PK: id,
      SK: id,
      GSI1PK: input.userId,
      GSI1SK: now,
      GSI2PK: input.reportType,
      GSI2SK: now,
      id,
      userId: input.userId,
      reportType: input.reportType,
      reportName: input.reportName,
      reportFormat: input.reportFormat,
      status: 'generating',
      parameters: input.parameters || null,
      filePath: null,
      fileSize: null,
      generatedAt: null,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: REPORTS_TABLE,
      Item: report
    };

    await docClient.send(new PutCommand(params));
    return report;
  } catch (error) {
    console.error('Error creating report:', error);
    throw new Error('Failed to create report');
  }
}

async function updateReport(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};

    if (input.reportName !== undefined) {
      updateExpression.push('reportName = :reportName');
      expressionValues[':reportName'] = input.reportName;
    }
    if (input.status !== undefined) {
      updateExpression.push('#status = :status');
      expressionValues[':status'] = input.status;
    }
    if (input.filePath !== undefined) {
      updateExpression.push('filePath = :filePath');
      expressionValues[':filePath'] = input.filePath;
    }
    if (input.fileSize !== undefined) {
      updateExpression.push('fileSize = :fileSize');
      expressionValues[':fileSize'] = input.fileSize;
    }
    if (input.generatedAt !== undefined) {
      updateExpression.push('generatedAt = :generatedAt');
      expressionValues[':generatedAt'] = input.generatedAt;
    }
    if (input.expiresAt !== undefined) {
      updateExpression.push('expiresAt = :expiresAt');
      expressionValues[':expiresAt'] = input.expiresAt;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: REPORTS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating report:', error);
    throw new Error('Failed to update report');
  }
}

async function deleteReport(id) {
  try {
    const params = {
      TableName: REPORTS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw new Error('Failed to delete report');
  }
}

async function generateReport(input) {
  try {
    // Create the report record
    const report = await createReport(input);

    // Here you would trigger the actual report generation
    // For now, we'll just update the status
    const now = getCurrentTimestamp();

    const updateParams = {
      TableName: REPORTS_TABLE,
      Key: { PK: report.id, SK: report.id },
      UpdateExpression: 'SET #status = :status, generatedAt = :generatedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':generatedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    return result.Attributes;
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report');
  }
}

async function downloadReport(id) {
  try {
    const params = {
      TableName: REPORTS_TABLE,
      Key: { PK: id, SK: id }
    };

    const result = await docClient.send(new GetCommand(params));
    const report = result.Item;

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'completed') {
      throw new Error('Report is not ready for download');
    }

    if (!report.filePath) {
      throw new Error('Report file not available');
    }

    // Here you would generate a signed URL for S3 download
    // For now, we'll just return the file path
    return report.filePath;
  } catch (error) {
    console.error('Error downloading report:', error);
    throw new Error('Failed to download report');
  }
}

// Dashboard Widgets Mutations
async function createDashboardWidget(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const widget = {
      PK: id,
      SK: id,
      GSI1PK: input.userId,
      GSI1SK: input.position.toString().padStart(3, '0'),
      id,
      userId: input.userId,
      widgetType: input.widgetType,
      widgetName: input.widgetName,
      widgetConfig: input.widgetConfig,
      position: input.position,
      size: input.size,
      isVisible: input.isVisible !== undefined ? input.isVisible : true,
      refreshInterval: input.refreshInterval || null,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: DASHBOARD_WIDGETS_TABLE,
      Item: widget
    };

    await docClient.send(new PutCommand(params));
    return widget;
  } catch (error) {
    console.error('Error creating dashboard widget:', error);
    throw new Error('Failed to create dashboard widget');
  }
}

async function updateDashboardWidget(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};
    const expressionNames = {};

    if (input.widgetName !== undefined) {
      updateExpression.push('widgetName = :widgetName');
      expressionValues[':widgetName'] = input.widgetName;
    }
    if (input.widgetConfig !== undefined) {
      updateExpression.push('widgetConfig = :widgetConfig');
      expressionValues[':widgetConfig'] = input.widgetConfig;
    }
    if (input.position !== undefined) {
      updateExpression.push('#position = :position, GSI1SK = :gsi1sk');
      expressionNames['#position'] = 'position';
      expressionValues[':position'] = input.position;
      expressionValues[':gsi1sk'] = input.position.toString().padStart(3, '0');
    }
    if (input.size !== undefined) {
      updateExpression.push('size = :size');
      expressionValues[':size'] = input.size;
    }
    if (input.isVisible !== undefined) {
      updateExpression.push('isVisible = :isVisible');
      expressionValues[':isVisible'] = input.isVisible;
    }
    if (input.refreshInterval !== undefined) {
      updateExpression.push('refreshInterval = :refreshInterval');
      expressionValues[':refreshInterval'] = input.refreshInterval;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: DASHBOARD_WIDGETS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating dashboard widget:', error);
    throw new Error('Failed to update dashboard widget');
  }
}

async function deleteDashboardWidget(id) {
  try {
    const params = {
      TableName: DASHBOARD_WIDGETS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting dashboard widget:', error);
    throw new Error('Failed to delete dashboard widget');
  }
}

async function reorderWidgets(userId, widgetIds) {
  try {
    const now = getCurrentTimestamp();
    const updates = [];

    for (let i = 0; i < widgetIds.length; i++) {
      const widgetId = widgetIds[i];
      const position = i + 1;

      updates.push({
        TableName: DASHBOARD_WIDGETS_TABLE,
        Key: { PK: widgetId, SK: widgetId },
        UpdateExpression: 'SET #position = :position, GSI1SK = :gsi1sk, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#position': 'position'
        },
        ExpressionAttributeValues: {
          ':position': position,
          ':gsi1sk': position.toString().padStart(3, '0'),
          ':updatedAt': now
        }
      });
    }

    // Execute all updates in a transaction
    const transactParams = {
      TransactItems: updates.map(update => ({ Update: update }))
    };

    await docClient.send(new TransactWriteCommand(transactParams));

    // Return updated widgets
    const updatedWidgets = [];
    for (const widgetId of widgetIds) {
      const params = {
        TableName: DASHBOARD_WIDGETS_TABLE,
        Key: { PK: widgetId, SK: widgetId }
      };

      const result = await docClient.send(new GetCommand(params));
      if (result.Item) {
        updatedWidgets.push(result.Item);
      }
    }

    return updatedWidgets;
  } catch (error) {
    console.error('Error reordering widgets:', error);
    throw new Error('Failed to reorder widgets');
  }
}

// Dashboard Layouts Mutations
async function createDashboardLayout(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const layout = {
      PK: id,
      SK: id,
      GSI1PK: input.userId,
      GSI1SK: input.layoutName,
      id,
      userId: input.userId,
      layoutName: input.layoutName,
      layoutConfig: input.layoutConfig,
      isDefault: input.isDefault !== undefined ? input.isDefault : false,
      isActive: input.isActive !== undefined ? input.isActive : false,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: DASHBOARD_LAYOUTS_TABLE,
      Item: layout
    };

    await docClient.send(new PutCommand(params));
    return layout;
  } catch (error) {
    console.error('Error creating dashboard layout:', error);
    throw new Error('Failed to create dashboard layout');
  }
}

async function updateDashboardLayout(input) {
  try {
    const now = getCurrentTimestamp();
    const updateExpression = [];
    const expressionValues = {};

    if (input.layoutName !== undefined) {
      updateExpression.push('layoutName = :layoutName, GSI1SK = :gsi1sk');
      expressionValues[':layoutName'] = input.layoutName;
      expressionValues[':gsi1sk'] = input.layoutName;
    }
    if (input.layoutConfig !== undefined) {
      updateExpression.push('layoutConfig = :layoutConfig');
      expressionValues[':layoutConfig'] = input.layoutConfig;
    }
    if (input.isDefault !== undefined) {
      updateExpression.push('isDefault = :isDefault');
      expressionValues[':isDefault'] = input.isDefault;
    }
    if (input.isActive !== undefined) {
      updateExpression.push('isActive = :isActive');
      expressionValues[':isActive'] = input.isActive;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = now;

    const params = {
      TableName: DASHBOARD_LAYOUTS_TABLE,
      Key: { PK: input.id, SK: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating dashboard layout:', error);
    throw new Error('Failed to update dashboard layout');
  }
}

async function deleteDashboardLayout(id) {
  try {
    const params = {
      TableName: DASHBOARD_LAYOUTS_TABLE,
      Key: { PK: id, SK: id }
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error('Error deleting dashboard layout:', error);
    throw new Error('Failed to delete dashboard layout');
  }
}

async function setActiveLayout(userId, layoutId) {
  try {
    const now = getCurrentTimestamp();

    // First, deactivate all other layouts for the user
    const deactivateParams = {
      TableName: DASHBOARD_LAYOUTS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true
      }
    };

    // This would require a scan and update operation
    // For now, we'll just update the specific layout

    // Update the specified layout to be active
    const updateParams = {
      TableName: DASHBOARD_LAYOUTS_TABLE,
      Key: { PK: layoutId, SK: layoutId },
      UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isActive': true,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    return result.Attributes;
  } catch (error) {
    console.error('Error setting active layout:', error);
    throw new Error('Failed to set active layout');
  }
}

// System Metrics Mutations
async function createSystemMetric(input) {
  try {
    const id = createId();
    const now = getCurrentTimestamp();

    const metric = {
      PK: id,
      SK: id,
      GSI1PK: input.metricType,
      GSI1SK: input.timestamp,
      GSI2PK: input.serviceName,
      GSI2SK: input.timestamp,
      id,
      serviceName: input.serviceName,
      metricType: input.metricType,
      metricName: input.metricName,
      value: input.value,
      unit: input.unit,
      tags: input.tags || null,
      timestamp: input.timestamp,
      createdAt: now,
      updatedAt: now,
      ttl: generateTTL()
    };

    const params = {
      TableName: SYSTEM_METRICS_TABLE,
      Item: metric
    };

    await docClient.send(new PutCommand(params));
    return metric;
  } catch (error) {
    console.error('Error creating system metric:', error);
    throw new Error('Failed to create system metric');
  }
}

async function bulkCreateSystemMetrics(inputs) {
  try {
    const metrics = [];

    for (const input of inputs) {
      const metric = await createSystemMetric(input);
      metrics.push(metric);
    }

    return metrics;
  } catch (error) {
    console.error('Error bulk creating system metrics:', error);
    throw new Error('Failed to bulk create system metrics');
  }
}

module.exports = {
  // Dashboard Metrics
  createDashboardMetric,
  updateDashboardMetric,
  deleteDashboardMetric,
  bulkCreateMetrics,

  // Reports
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  downloadReport,

  // Dashboard Widgets
  createDashboardWidget,
  updateDashboardWidget,
  deleteDashboardWidget,
  reorderWidgets,

  // Dashboard Layouts
  createDashboardLayout,
  updateDashboardLayout,
  deleteDashboardLayout,
  setActiveLayout,

  // System Metrics
  createSystemMetric,
  bulkCreateSystemMetrics
};
