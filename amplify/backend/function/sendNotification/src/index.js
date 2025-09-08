// Send Notification Lambda Function
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDB);
const sns = new SNSClient({ region: process.env.AWS_REGION });
const ses = new SESClient({ region: process.env.AWS_REGION });

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;
const NOTIFICATION_SETTINGS_TABLE = process.env.NOTIFICATION_SETTINGS_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to get notification
async function getNotification(notificationId) {
  try {
    const params = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: notificationId, SK: notificationId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting notification:', error);
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

// Helper function to check if notification should be sent based on quiet hours
function shouldSendNotification(userSettings) {
  if (!userSettings || !userSettings.quietHoursStart || !userSettings.quietHoursEnd) {
    return true;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const startTime = parseTime(userSettings.quietHoursStart);
  const endTime = parseTime(userSettings.quietHoursEnd);

  if (startTime <= endTime) {
    // Same day quiet hours (e.g., 22:00 to 06:00)
    return currentTime < startTime || currentTime > endTime;
  } else {
    // Overnight quiet hours (e.g., 22:00 to 06:00)
    return currentTime < startTime && currentTime > endTime;
  }
}

// Helper function to parse time string (HH:MM format)
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to send email notification
async function sendEmailNotification(notification, userSettings) {
  try {
    if (!userSettings.emailEnabled || !userSettings.emailAddress) {
      console.log('Email notifications disabled or no email address');
      return false;
    }

    const params = {
      Source: SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [userSettings.emailAddress]
      },
      Message: {
        Subject: {
          Data: notification.title,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: notification.message,
            Charset: 'UTF-8'
          },
          Html: {
            Data: `
              <html>
                <body>
                  <h2>${notification.title}</h2>
                  <p>${notification.message}</p>
                  <p><small>Notification ID: ${notification.id}</small></p>
                </body>
              </html>
            `,
            Charset: 'UTF-8'
          }
        }
      }
    };

    await ses.send(new SendEmailCommand(params));
    console.log('Email notification sent:', notification.id);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

// Helper function to send SMS notification
async function sendSMSNotification(notification, userSettings) {
  try {
    if (!userSettings.smsEnabled || !userSettings.phoneNumber) {
      console.log('SMS notifications disabled or no phone number');
      return false;
    }

    const params = {
      TopicArn: SNS_TOPIC_ARN,
      Message: notification.message,
      Subject: notification.title,
      PhoneNumber: userSettings.phoneNumber,
      MessageAttributes: {
        notificationId: {
          DataType: 'String',
          StringValue: notification.id
        },
        priority: {
          DataType: 'String',
          StringValue: notification.priorityId
        }
      }
    };

    await sns.send(new PublishCommand(params));
    console.log('SMS notification sent:', notification.id);
    return true;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return false;
  }
}

// Helper function to send push notification
async function sendPushNotification(notification, userSettings) {
  try {
    if (!userSettings.pushEnabled) {
      console.log('Push notifications disabled');
      return false;
    }

    // This would integrate with your push notification service
    // For now, we'll just log it
    console.log('Push notification would be sent:', notification.id);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Helper function to send LINE notification
async function sendLINENotification(notification, userSettings) {
  try {
    if (!userSettings.lineEnabled || !userSettings.lineUserId) {
      console.log('LINE notifications disabled or no LINE user ID');
      return false;
    }

    // This would integrate with LINE API
    // For now, we'll just log it
    console.log('LINE notification would be sent:', notification.id);
    return true;
  } catch (error) {
    console.error('Error sending LINE notification:', error);
    return false;
  }
}

// Helper function to send in-app notification
async function sendInAppNotification(notification, userSettings) {
  try {
    if (!userSettings.inAppEnabled) {
      console.log('In-app notifications disabled');
      return false;
    }

    // This would integrate with your real-time notification system
    // For now, we'll just log it
    console.log('In-app notification would be sent:', notification.id);
    return true;
  } catch (error) {
    console.error('Error sending in-app notification:', error);
    return false;
  }
}

// Helper function to send notification via all enabled channels
async function sendNotificationViaChannels(notification, userSettings) {
  const results = {
    email: false,
    sms: false,
    push: false,
    line: false,
    inApp: false
  };

  // Check if notification should be sent based on quiet hours
  if (!shouldSendNotification(userSettings)) {
    console.log('Notification skipped due to quiet hours');
    return results;
  }

  // Send via each enabled channel
  const channelPromises = [];

  if (notification.channels.includes('email')) {
    channelPromises.push(
      sendEmailNotification(notification, userSettings)
        .then(success => { results.email = success; })
    );
  }

  if (notification.channels.includes('sms')) {
    channelPromises.push(
      sendSMSNotification(notification, userSettings)
        .then(success => { results.sms = success; })
    );
  }

  if (notification.channels.includes('push')) {
    channelPromises.push(
      sendPushNotification(notification, userSettings)
        .then(success => { results.push = success; })
    );
  }

  if (notification.channels.includes('line')) {
    channelPromises.push(
      sendLINENotification(notification, userSettings)
        .then(success => { results.line = success; })
    );
  }

  if (notification.channels.includes('in_app')) {
    channelPromises.push(
      sendInAppNotification(notification, userSettings)
        .then(success => { results.inApp = success; })
    );
  }

  await Promise.all(channelPromises);
  return results;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Send Notification Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    // Parse input from event
    const notificationId = event.arguments?.notificationId || event.notificationId;

    if (!notificationId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'notificationId is required'
        })
      };
    }

    // Get notification
    const notification = await getNotification(notificationId);
    if (!notification) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Notification not found',
          notificationId
        })
      };
    }

    // Check if notification is already sent
    if (notification.sentAt) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Notification already sent',
          sentAt: notification.sentAt
        })
      };
    }

    // Get user notification settings
    const userSettings = await getUserNotificationSettings(notification.userId);
    if (!userSettings) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'User notification settings not found',
          userId: notification.userId
        })
      };
    }

    // Send notification via all enabled channels
    const sendResults = await sendNotificationViaChannels(notification, userSettings);

    // Update notification with sent timestamp
    const now = getCurrentTimestamp();
    const updateParams = {
      TableName: NOTIFICATIONS_TABLE,
      Key: { PK: notificationId, SK: notificationId },
      UpdateExpression: 'SET sentAt = :sentAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':sentAt': now,
        ':updatedAt': now
      }
    };

    await docClient.send(new UpdateCommand(updateParams));

    console.log('Notification sent successfully:', notificationId);
    console.log('Send results:', sendResults);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        notificationId,
        sentAt: now,
        sendResults
      })
    };

  } catch (error) {
    console.error('Error sending notification:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
