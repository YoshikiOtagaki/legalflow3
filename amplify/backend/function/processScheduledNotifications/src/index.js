// Process Scheduled Notifications Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);
const lambda = new LambdaClient({ region: process.env.AWS_REGION });

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;
const SEND_NOTIFICATION_FUNCTION_NAME = process.env.SEND_NOTIFICATION_FUNCTION_NAME;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to get scheduled notifications
async function getScheduledNotifications() {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      FilterExpression: 'scheduledAt <= :now AND sentAt = :sentAt',
      ExpressionAttributeValues: {
        ':now': now,
        ':sentAt': null
      }
    };

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

// Helper function to invoke send notification Lambda
async function invokeSendNotification(notificationId) {
  try {
    const params = {
      FunctionName: SEND_NOTIFICATION_FUNCTION_NAME,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({
        notificationId
      })
    };

    await lambda.send(new InvokeCommand(params));
    console.log('Send notification Lambda invoked for:', notificationId);
    return true;
  } catch (error) {
    console.error('Error invoking send notification Lambda:', error);
    return false;
  }
}

// Helper function to mark notification as processing
async function markNotificationAsProcessing(notificationId) {
  try {
    const now = getCurrentTimestamp();

    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: notificationId, SK: notificationId },
      UpdateExpression: 'SET processingStartedAt = :processingStartedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':processingStartedAt': now,
        ':updatedAt': now
      }
    };

    await docClient.send(new UpdateCommand(params));
    return true;
  } catch (error) {
    console.error('Error marking notification as processing:', error);
    return false;
  }
}

// Helper function to process a single notification
async function processNotification(notification) {
  try {
    console.log('Processing scheduled notification:', notification.id);

    // Mark as processing to prevent duplicate processing
    const marked = await markNotificationAsProcessing(notification.id);
    if (!marked) {
      console.error('Failed to mark notification as processing:', notification.id);
      return false;
    }

    // Invoke send notification Lambda
    const invoked = await invokeSendNotification(notification.id);
    if (!invoked) {
      console.error('Failed to invoke send notification Lambda:', notification.id);
      return false;
    }

    console.log('Successfully processed notification:', notification.id);
    return true;
  } catch (error) {
    console.error('Error processing notification:', notification.id, error);
    return false;
  }
}

// Helper function to process notifications in batches
async function processNotificationsBatch(notifications, batchSize = 10) {
  const results = {
    processed: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(notifications.length / batchSize)}`);

    const batchPromises = batch.map(notification =>
      processNotification(notification)
        .then(success => {
          if (success) {
            results.processed++;
          } else {
            results.failed++;
            results.errors.push(`Failed to process notification: ${notification.id}`);
          }
        })
        .catch(error => {
          results.failed++;
          results.errors.push(`Error processing notification ${notification.id}: ${error.message}`);
        })
    );

    await Promise.all(batchPromises);

    // Add a small delay between batches to avoid overwhelming the system
    if (i + batchSize < notifications.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Process Scheduled Notifications Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    // Get scheduled notifications
    const scheduledNotifications = await getScheduledNotifications();

    if (scheduledNotifications.length === 0) {
      console.log('No scheduled notifications to process');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No scheduled notifications to process',
          processed: 0,
          failed: 0
        })
      };
    }

    console.log(`Found ${scheduledNotifications.length} scheduled notifications to process`);

    // Process notifications in batches
    const results = await processNotificationsBatch(scheduledNotifications);

    console.log('Scheduled notifications processing completed:', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Scheduled notifications processing completed',
        ...results
      })
    };

  } catch (error) {
    console.error('Error processing scheduled notifications:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
