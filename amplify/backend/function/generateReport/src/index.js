// Generate Report Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createId } = require('@paralleldrive/cuid2');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);
const s3 = new S3Client({ region: process.env.AWS_REGION });

const REPORTS_TABLE = process.env.REPORTS_TABLE;
const DASHBOARD_METRICS_TABLE = process.env.DASHBOARD_METRICS_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to generate TTL (7 days from now)
function generateTTL() {
  return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
}

// Generate PDF report
async function generatePDFReport(reportData, reportType) {
  try {
    // This would integrate with a PDF generation library like Puppeteer or PDFKit
    // For now, we'll create a simple HTML report and convert it to PDF

    const htmlContent = generateHTMLReport(reportData, reportType);

    // In a real implementation, you would:
    // 1. Use Puppeteer to convert HTML to PDF
    // 2. Or use PDFKit to generate PDF directly
    // 3. Upload the PDF to S3

    // For now, we'll just return the HTML content
    return {
      content: htmlContent,
      mimeType: 'text/html',
      extension: 'html'
    };
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}

// Generate CSV report
async function generateCSVReport(reportData, reportType) {
  try {
    let csvContent = '';

    switch (reportType) {
      case 'timesheet':
        csvContent = generateTimesheetCSV(reportData);
        break;
      case 'cases':
        csvContent = generateCasesCSV(reportData);
        break;
      case 'documents':
        csvContent = generateDocumentsCSV(reportData);
        break;
      case 'notifications':
        csvContent = generateNotificationsCSV(reportData);
        break;
      default:
        csvContent = generateGenericCSV(reportData);
    }

    return {
      content: csvContent,
      mimeType: 'text/csv',
      extension: 'csv'
    };
  } catch (error) {
    console.error('Error generating CSV report:', error);
    throw error;
  }
}

// Generate JSON report
async function generateJSONReport(reportData, reportType) {
  try {
    const jsonContent = JSON.stringify(reportData, null, 2);

    return {
      content: jsonContent,
      mimeType: 'application/json',
      extension: 'json'
    };
  } catch (error) {
    console.error('Error generating JSON report:', error);
    throw error;
  }
}

// Generate HTML report
function generateHTMLReport(reportData, reportType) {
  const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
  const generatedAt = new Date().toLocaleString();

  let content = '';

  switch (reportType) {
    case 'timesheet':
      content = generateTimesheetHTML(reportData);
      break;
    case 'cases':
      content = generateCasesHTML(reportData);
      break;
    case 'documents':
      content = generateDocumentsHTML(reportData);
      break;
    case 'notifications':
      content = generateNotificationsHTML(reportData);
      break;
    default:
      content = generateGenericHTML(reportData);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${generatedAt}</p>
      </div>
      ${content}
    </body>
    </html>
  `;
}

// Generate timesheet HTML
function generateTimesheetHTML(data) {
  const { timesheet } = data;

  return `
    <div class="section">
      <h2>Timesheet Summary</h2>
      <div class="metric">
        <div class="metric-value">${timesheet.totalHours.toFixed(2)}</div>
        <div class="metric-label">Total Hours</div>
      </div>
      <div class="metric">
        <div class="metric-value">${timesheet.dailyHours.toFixed(2)}</div>
        <div class="metric-label">Daily Hours</div>
      </div>
      <div class="metric">
        <div class="metric-value">${timesheet.weeklyHours.toFixed(2)}</div>
        <div class="metric-label">Weekly Hours</div>
      </div>
      <div class="metric">
        <div class="metric-value">${timesheet.monthlyHours.toFixed(2)}</div>
        <div class="metric-label">Monthly Hours</div>
      </div>
      <div class="metric">
        <div class="metric-value">${timesheet.totalSessions}</div>
        <div class="metric-label">Total Sessions</div>
      </div>
    </div>

    <div class="section">
      <h2>Case Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Case Name</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          ${timesheet.caseBreakdown.map(case => `
            <tr>
              <td>${case.caseName}</td>
              <td>${case.hours.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Task Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          ${timesheet.taskBreakdown.map(task => `
            <tr>
              <td>${task.taskTitle}</td>
              <td>${task.hours.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Generate cases HTML
function generateCasesHTML(data) {
  const { cases } = data;

  return `
    <div class="section">
      <h2>Case Summary</h2>
      <div class="metric">
        <div class="metric-value">${cases.totalCases}</div>
        <div class="metric-label">Total Cases</div>
      </div>
      <div class="metric">
        <div class="metric-value">${cases.activeCases}</div>
        <div class="metric-label">Active Cases</div>
      </div>
      <div class="metric">
        <div class="metric-value">${cases.completedCases}</div>
        <div class="metric-label">Completed Cases</div>
      </div>
      <div class="metric">
        <div class="metric-value">${cases.newCases}</div>
        <div class="metric-label">New Cases</div>
      </div>
      <div class="metric">
        <div class="metric-value">${cases.averageCaseDuration.toFixed(1)}</div>
        <div class="metric-label">Avg Duration (days)</div>
      </div>
    </div>
  `;
}

// Generate documents HTML
function generateDocumentsHTML(data) {
  const { documents } = data;

  return `
    <div class="section">
      <h2>Document Summary</h2>
      <div class="metric">
        <div class="metric-value">${documents.totalDocuments}</div>
        <div class="metric-label">Total Documents</div>
      </div>
      <div class="metric">
        <div class="metric-value">${(documents.storageUsed / 1024 / 1024).toFixed(2)} MB</div>
        <div class="metric-label">Storage Used</div>
      </div>
    </div>
  `;
}

// Generate notifications HTML
function generateNotificationsHTML(data) {
  const { notifications } = data;

  return `
    <div class="section">
      <h2>Notification Summary</h2>
      <div class="metric">
        <div class="metric-value">${notifications.totalNotifications}</div>
        <div class="metric-label">Total Notifications</div>
      </div>
      <div class="metric">
        <div class="metric-value">${notifications.unreadNotifications}</div>
        <div class="metric-label">Unread Notifications</div>
      </div>
    </div>
  `;
}

// Generate generic HTML
function generateGenericHTML(data) {
  return `
    <div class="section">
      <h2>Report Data</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

// Generate timesheet CSV
function generateTimesheetCSV(data) {
  const { timesheet } = data;

  let csv = 'Metric,Value,Unit\n';
  csv += `Total Hours,${timesheet.totalHours},hours\n`;
  csv += `Daily Hours,${timesheet.dailyHours},hours\n`;
  csv += `Weekly Hours,${timesheet.weeklyHours},hours\n`;
  csv += `Monthly Hours,${timesheet.monthlyHours},hours\n`;
  csv += `Total Sessions,${timesheet.totalSessions},count\n`;
  csv += `Average Session Length,${timesheet.averageSessionLength},hours\n`;

  csv += '\nCase Breakdown\n';
  csv += 'Case Name,Hours\n';
  timesheet.caseBreakdown.forEach(case => {
    csv += `${case.caseName},${case.hours}\n`;
  });

  csv += '\nTask Breakdown\n';
  csv += 'Task Title,Hours\n';
  timesheet.taskBreakdown.forEach(task => {
    csv += `${task.taskTitle},${task.hours}\n`;
  });

  return csv;
}

// Generate cases CSV
function generateCasesCSV(data) {
  const { cases } = data;

  let csv = 'Metric,Value,Unit\n';
  csv += `Total Cases,${cases.totalCases},count\n`;
  csv += `Active Cases,${cases.activeCases},count\n`;
  csv += `Completed Cases,${cases.completedCases},count\n`;
  csv += `New Cases,${cases.newCases},count\n`;
  csv += `Average Case Duration,${cases.averageCaseDuration},days\n`;

  return csv;
}

// Generate documents CSV
function generateDocumentsCSV(data) {
  const { documents } = data;

  let csv = 'Metric,Value,Unit\n';
  csv += `Total Documents,${documents.totalDocuments},count\n`;
  csv += `Storage Used,${documents.storageUsed},bytes\n`;

  return csv;
}

// Generate notifications CSV
function generateNotificationsCSV(data) {
  const { notifications } = data;

  let csv = 'Metric,Value,Unit\n';
  csv += `Total Notifications,${notifications.totalNotifications},count\n`;
  csv += `Unread Notifications,${notifications.unreadNotifications},count\n`;

  return csv;
}

// Generate generic CSV
function generateGenericCSV(data) {
  let csv = 'Key,Value\n';

  function flattenObject(obj, prefix = '') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          flattenObject(obj[key], newKey);
        } else {
          csv += `${newKey},${obj[key]}\n`;
        }
      }
    }
  }

  flattenObject(data);
  return csv;
}

// Upload report to S3
async function uploadReportToS3(content, mimeType, extension, reportId) {
  try {
    const key = `reports/${reportId}.${extension}`;

    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: content,
      ContentType: mimeType,
      Metadata: {
        reportId: reportId,
        generatedAt: getCurrentTimestamp()
      }
    };

    await s3.send(new PutObjectCommand(params));

    return {
      filePath: key,
      fileSize: Buffer.byteLength(content, 'utf8')
    };
  } catch (error) {
    console.error('Error uploading report to S3:', error);
    throw error;
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Generate Report Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const { reportId, reportType, reportFormat, parameters } = event;

    if (!reportId || !reportType || !reportFormat) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'reportId, reportType, and reportFormat are required'
        })
      };
    }

    // Get report record
    const reportParams = {
      TableName: REPORTS_TABLE,
      Key: { PK: reportId, SK: reportId }
    };

    const reportResult = await docClient.send(new GetCommand(reportParams));
    const report = reportResult.Item;

    if (!report) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Report not found'
        })
      };
    }

    // Update report status to generating
    const updateParams = {
      TableName: REPORTS_TABLE,
      Key: { PK: reportId, SK: reportId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'generating',
        ':updatedAt': getCurrentTimestamp()
      }
    };

    await docClient.send(new UpdateCommand(updateParams));

    // Collect data for the report
    const reportData = {
      reportType,
      parameters,
      generatedAt: getCurrentTimestamp(),
      timesheet: {
        totalHours: 0,
        dailyHours: 0,
        weeklyHours: 0,
        monthlyHours: 0,
        averageSessionLength: 0,
        totalSessions: 0,
        caseBreakdown: [],
        taskBreakdown: []
      },
      cases: {
        totalCases: 0,
        activeCases: 0,
        completedCases: 0,
        newCases: 0,
        averageCaseDuration: 0
      },
      documents: {
        totalDocuments: 0,
        storageUsed: 0
      },
      notifications: {
        totalNotifications: 0,
        unreadNotifications: 0
      }
    };

    // Generate report content based on format
    let reportContent;
    let mimeType;
    let extension;

    switch (reportFormat.toLowerCase()) {
      case 'pdf':
        const pdfResult = await generatePDFReport(reportData, reportType);
        reportContent = pdfResult.content;
        mimeType = pdfResult.mimeType;
        extension = pdfResult.extension;
        break;
      case 'csv':
        const csvResult = await generateCSVReport(reportData, reportType);
        reportContent = csvResult.content;
        mimeType = csvResult.mimeType;
        extension = csvResult.extension;
        break;
      case 'json':
        const jsonResult = await generateJSONReport(reportData, reportType);
        reportContent = jsonResult.content;
        mimeType = jsonResult.mimeType;
        extension = jsonResult.extension;
        break;
      case 'html':
        reportContent = generateHTMLReport(reportData, reportType);
        mimeType = 'text/html';
        extension = 'html';
        break;
      default:
        throw new Error(`Unsupported report format: ${reportFormat}`);
    }

    // Upload report to S3
    const uploadResult = await uploadReportToS3(
      reportContent,
      mimeType,
      extension,
      reportId
    );

    // Update report with completion status
    const completionParams = {
      TableName: REPORTS_TABLE,
      Key: { PK: reportId, SK: reportId },
      UpdateExpression: 'SET #status = :status, filePath = :filePath, fileSize = :fileSize, generatedAt = :generatedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':filePath': uploadResult.filePath,
        ':fileSize': uploadResult.fileSize,
        ':generatedAt': getCurrentTimestamp(),
        ':updatedAt': getCurrentTimestamp()
      }
    };

    await docClient.send(new UpdateCommand(completionParams));

    console.log(`Report generated successfully: ${reportId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        reportId,
        filePath: uploadResult.filePath,
        fileSize: uploadResult.fileSize,
        mimeType,
        extension
      })
    };

  } catch (error) {
    console.error('Error generating report:', error);

    // Update report status to failed
    try {
      const errorParams = {
        TableName: REPORTS_TABLE,
        Key: { PK: event.reportId, SK: event.reportId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':updatedAt': getCurrentTimestamp()
        }
      };

      await docClient.send(new UpdateCommand(errorParams));
    } catch (updateError) {
      console.error('Error updating report status to failed:', updateError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
