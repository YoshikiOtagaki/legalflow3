# Notification Management Database Design

## Overview
This document outlines the DynamoDB database design for the Notification Management feature in LegalFlow3, based on the local Prisma schema and existing notification management services.

## Database Tables

### 1. Notifications Table
**Primary Key**: `PK` (Notification ID), `SK` (Notification ID)
**Purpose**: Store notification data and metadata

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Notification ID (CUID) |
| SK | String | Notification ID (CUID) |
| GSI1PK | String | User ID |
| GSI1SK | String | Created At (ISO 8601) |
| GSI2PK | String | Event Type |
| GSI2SK | String | Created At (ISO 8601) |
| GSI3PK | String | Priority Level |
| GSI3SK | String | Created At (ISO 8601) |
| GSI4PK | String | Read Status |
| GSI4SK | String | Created At (ISO 8601) |
| id | String | Notification ID (CUID) |
| userId | String | Target user ID |
| typeId | String | Notification type ID |
| title | String | Notification title |
| message | String | Notification message |
| data | Map | Additional notification data |
| isRead | Boolean | Read status |
| isArchived | Boolean | Archive status |
| priorityId | String | Priority level ID |
| channels | List<String> | Delivery channels |
| scheduledAt | String | Scheduled delivery time (ISO 8601) |
| sentAt | String | Actual delivery time (ISO 8601) |
| readAt | String | Read time (ISO 8601) |
| archivedAt | String | Archive time (ISO 8601) |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 2. NotificationTypes Table
**Primary Key**: `PK` (Type ID), `SK` (Type ID)
**Purpose**: Define notification types and templates

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Type ID (CUID) |
| SK | String | Type ID (CUID) |
| GSI1PK | String | Category |
| GSI1SK | String | Type Name |
| id | String | Type ID (CUID) |
| name | String | Type name |
| description | String | Type description |
| category | String | Type category |
| template | String | Message template |
| isActive | Boolean | Is type active |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 3. NotificationPriorities Table
**Primary Key**: `PK` (Priority ID), `SK` (Priority ID)
**Purpose**: Define notification priority levels

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Priority ID (CUID) |
| SK | String | Priority ID (CUID) |
| GSI1PK | String | Level |
| GSI1SK | String | Priority Name |
| id | String | Priority ID (CUID) |
| name | String | Priority name |
| level | Number | Priority level (1-5) |
| color | String | Display color (hex) |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 4. NotificationChannels Table
**Primary Key**: `PK` (Channel ID), `SK` (Channel ID)
**Purpose**: Define notification delivery channels

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Channel ID (CUID) |
| SK | String | Channel ID (CUID) |
| GSI1PK | String | Channel Type |
| GSI1SK | String | Channel Name |
| id | String | Channel ID (CUID) |
| name | String | Channel name |
| type | String | Channel type (email, sms, push, line, in_app) |
| isEnabled | Boolean | Is channel enabled |
| config | Map | Channel configuration |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 5. NotificationSettings Table
**Primary Key**: `PK` (User ID), `SK` (User ID)
**Purpose**: Store user notification preferences

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | User ID (CUID) |
| SK | String | User ID (CUID) |
| id | String | Settings ID (CUID) |
| userId | String | User ID |
| emailEnabled | Boolean | Email notifications enabled |
| smsEnabled | Boolean | SMS notifications enabled |
| pushEnabled | Boolean | Push notifications enabled |
| lineEnabled | Boolean | LINE notifications enabled |
| inAppEnabled | Boolean | In-app notifications enabled |
| emailAddress | String | Email address for notifications |
| phoneNumber | String | Phone number for SMS |
| lineUserId | String | LINE user ID |
| quietHoursStart | String | Quiet hours start time |
| quietHoursEnd | String | Quiet hours end time |
| timezone | String | User timezone |
| language | String | User language preference |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

## Global Secondary Indexes (GSI)

### Notifications Table GSIs

#### GSI1: User Notifications
- **PK**: User ID
- **SK**: Created At
- **Purpose**: Query notifications by user, sorted by creation date

#### GSI2: Event Type Notifications
- **PK**: Event Type
- **SK**: Created At
- **Purpose**: Query notifications by event type, sorted by creation date

#### GSI3: Priority Notifications
- **PK**: Priority Level
- **SK**: Created At
- **Purpose**: Query notifications by priority, sorted by creation date

#### GSI4: Read Status Notifications
- **PK**: Read Status (read/unread)
- **SK**: Created At
- **Purpose**: Query notifications by read status, sorted by creation date

### NotificationTypes Table GSIs

#### GSI1: Category Types
- **PK**: Category
- **SK**: Type Name
- **Purpose**: Query notification types by category

### NotificationPriorities Table GSIs

#### GSI1: Priority Levels
- **PK**: Level
- **SK**: Priority Name
- **Purpose**: Query priorities by level

### NotificationChannels Table GSIs

#### GSI1: Channel Types
- **PK**: Channel Type
- **SK**: Channel Name
- **Purpose**: Query channels by type

## Access Patterns

### 1. Notification Management
- **Get Notification**: PK = Notification ID, SK = Notification ID
- **List User Notifications**: GSI1PK = User ID, GSI1SK begins_with "2024-"
- **List Unread Notifications**: GSI4PK = "unread", GSI4SK begins_with "2024-"
- **List Event Type Notifications**: GSI2PK = Event Type, GSI2SK begins_with "2024-"
- **List Priority Notifications**: GSI3PK = Priority Level, GSI3SK begins_with "2024-"

### 2. Notification Types
- **Get Type**: PK = Type ID, SK = Type ID
- **List Types by Category**: GSI1PK = Category, GSI1SK begins_with "type-"

### 3. Notification Priorities
- **Get Priority**: PK = Priority ID, SK = Priority ID
- **List Priorities by Level**: GSI1PK = Level, GSI1SK begins_with "priority-"

### 4. Notification Channels
- **Get Channel**: PK = Channel ID, SK = Channel ID
- **List Channels by Type**: GSI1PK = Channel Type, GSI1SK begins_with "channel-"

### 5. Notification Settings
- **Get User Settings**: PK = User ID, SK = User ID
- **Update User Settings**: PK = User ID, SK = User ID

### 6. Search and Filter
- **Search by Message**: Scan with filter on message attribute
- **Filter by Date Range**: Use GSI SK with begins_with for date range
- **Filter by Multiple Criteria**: Use multiple GSIs or scan with filters

## Data Relationships

### Notification to User
- Notifications are linked to users via `userId`
- Use GSI1 to query notifications by user

### Notification to Type
- Notifications are linked to types via `typeId`
- Types define templates and categories

### Notification to Priority
- Notifications are linked to priorities via `priorityId`
- Priorities define urgency levels

### Notification to Channels
- Notifications specify delivery channels via `channels` array
- Channels define delivery methods

### Notification Settings to User
- Settings are linked to users via `userId`
- Settings define user preferences

## Security Considerations

### Access Control
- Implement Row Level Security (RLS) based on user roles
- Users can only access their own notifications
- Admins can access all notifications

### Data Encryption
- All notification content encrypted at rest in DynamoDB
- Sensitive data (phone numbers, email addresses) encrypted
- Message content encrypted for privacy

### Audit Trail
- Track all notification operations (create, read, update, delete)
- Log notification delivery attempts
- Maintain notification history

## Performance Optimization

### Partition Key Design
- Use CUID for notification IDs to ensure even distribution
- Avoid hot partitions by using composite sort keys

### Query Optimization
- Use GSIs for common query patterns
- Implement pagination for large result sets
- Use projection expressions to limit returned attributes

### Caching Strategy
- Cache frequently accessed notification types
- Use Redis for notification counters
- Implement local caching for user settings

## Backup and Recovery

### Backup Strategy
- Enable point-in-time recovery for all tables
- Regular automated backups
- Cross-region replication for disaster recovery

### Data Retention
- Implement TTL for old notifications
- Archive old notifications after specified period
- Maintain audit logs for compliance

## Monitoring and Alerting

### Key Metrics
- Notification creation rates
- Delivery success rates
- Read rates by type and priority
- Error rates for notification operations

### Alerts
- High error rates
- Failed delivery attempts
- Unusual notification patterns
- System performance issues

## Real-time Features

### WebSocket Integration
- Real-time notification delivery
- Live notification counters
- Instant read status updates

### Push Notifications
- Mobile push notifications
- Browser push notifications
- LINE notifications

### Email Integration
- SMTP configuration
- Email templates
- Delivery tracking

## Notification Templates

### Template Variables
- User information: `{{user.name}}`, `{{user.email}}`
- Case information: `{{case.name}}`, `{{case.number}}`
- Document information: `{{document.title}}`, `{{document.type}}`
- Time information: `{{date}}`, `{{time}}`

### Template Processing
- Variable substitution
- Conditional content
- Multi-language support
- Formatting options
