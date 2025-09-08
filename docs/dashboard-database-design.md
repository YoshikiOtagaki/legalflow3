# Dashboard Database Design

## Overview
This document outlines the DynamoDB database design for the Dashboard feature in LegalFlow3, based on the local Prisma schema and existing statistics services.

## Database Tables

### 1. DashboardMetrics Table
**Primary Key**: `PK` (Metric ID), `SK` (Metric ID)
**Purpose**: Store aggregated metrics and statistics

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Metric ID (CUID) |
| SK | String | Metric ID (CUID) |
| GSI1PK | String | User ID |
| GSI1SK | String | Metric Type + Date |
| GSI2PK | String | Case ID |
| GSI2SK | String | Metric Type + Date |
| GSI3PK | String | Metric Type |
| GSI3SK | String | Date |
| id | String | Metric ID (CUID) |
| userId | String | User ID (optional) |
| caseId | String | Case ID (optional) |
| metricType | String | Type of metric (timesheet, cases, documents, notifications) |
| metricName | String | Name of the metric |
| value | Number | Metric value |
| unit | String | Unit of measurement (hours, count, percentage) |
| period | String | Time period (daily, weekly, monthly, yearly) |
| date | String | Date of the metric (ISO 8601) |
| metadata | Map | Additional metric data |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 2. Reports Table
**Primary Key**: `PK` (Report ID), `SK` (Report ID)
**Purpose**: Store generated reports and their metadata

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Report ID (CUID) |
| SK | String | Report ID (CUID) |
| GSI1PK | String | User ID |
| GSI1SK | String | Created At |
| GSI2PK | String | Report Type |
| GSI2SK | String | Created At |
| id | String | Report ID (CUID) |
| userId | String | User ID |
| reportType | String | Type of report (timesheet, case, document, notification) |
| reportName | String | Name of the report |
| reportFormat | String | Format (pdf, csv, json, html) |
| status | String | Status (generating, completed, failed) |
| parameters | Map | Report parameters |
| filePath | String | S3 file path (if applicable) |
| fileSize | Number | File size in bytes |
| generatedAt | String | Generation timestamp (ISO 8601) |
| expiresAt | String | Expiration timestamp (ISO 8601) |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 3. DashboardWidgets Table
**Primary Key**: `PK` (Widget ID), `SK` (Widget ID)
**Purpose**: Store user dashboard widget configurations

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Widget ID (CUID) |
| SK | String | Widget ID (CUID) |
| GSI1PK | String | User ID |
| GSI1SK | String | Widget Order |
| id | String | Widget ID (CUID) |
| userId | String | User ID |
| widgetType | String | Type of widget (chart, table, card, list) |
| widgetName | String | Name of the widget |
| widgetConfig | Map | Widget configuration |
| position | Number | Widget position on dashboard |
| size | String | Widget size (small, medium, large) |
| isVisible | Boolean | Is widget visible |
| refreshInterval | Number | Refresh interval in seconds |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 4. DashboardLayouts Table
**Primary Key**: `PK` (Layout ID), `SK` (Layout ID)
**Purpose**: Store user dashboard layouts

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Layout ID (CUID) |
| SK | String | Layout ID (CUID) |
| GSI1PK | String | User ID |
| GSI1SK | String | Layout Name |
| id | String | Layout ID (CUID) |
| userId | String | User ID |
| layoutName | String | Name of the layout |
| layoutConfig | Map | Layout configuration |
| isDefault | Boolean | Is default layout |
| isActive | Boolean | Is active layout |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 5. SystemMetrics Table
**Primary Key**: `PK` (Metric ID), `SK` (Metric ID)
**Purpose**: Store system-wide metrics and performance data

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Metric ID (CUID) |
| SK | String | Metric ID (CUID) |
| GSI1PK | String | Metric Type |
| GSI1SK | String | Date |
| GSI2PK | String | Service Name |
| GSI2SK | String | Date |
| id | String | Metric ID (CUID) |
| serviceName | String | Service name |
| metricType | String | Type of metric (performance, error, usage) |
| metricName | String | Name of the metric |
| value | Number | Metric value |
| unit | String | Unit of measurement |
| tags | Map | Metric tags |
| timestamp | String | Metric timestamp (ISO 8601) |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

## Global Secondary Indexes (GSI)

### DashboardMetrics Table GSIs

#### GSI1: User Metrics
- **PK**: User ID
- **SK**: Metric Type + Date
- **Purpose**: Query metrics by user, sorted by type and date

#### GSI2: Case Metrics
- **PK**: Case ID
- **SK**: Metric Type + Date
- **Purpose**: Query metrics by case, sorted by type and date

#### GSI3: Metric Type
- **PK**: Metric Type
- **SK**: Date
- **Purpose**: Query metrics by type, sorted by date

### Reports Table GSIs

#### GSI1: User Reports
- **PK**: User ID
- **SK**: Created At
- **Purpose**: Query reports by user, sorted by creation date

#### GSI2: Report Type
- **PK**: Report Type
- **SK**: Created At
- **Purpose**: Query reports by type, sorted by creation date

### DashboardWidgets Table GSIs

#### GSI1: User Widgets
- **PK**: User ID
- **SK**: Widget Order
- **Purpose**: Query widgets by user, sorted by position

### DashboardLayouts Table GSIs

#### GSI1: User Layouts
- **PK**: User ID
- **SK**: Layout Name
- **Purpose**: Query layouts by user

### SystemMetrics Table GSIs

#### GSI1: Metric Type
- **PK**: Metric Type
- **SK**: Date
- **Purpose**: Query system metrics by type, sorted by date

#### GSI2: Service Metrics
- **PK**: Service Name
- **SK**: Date
- **Purpose**: Query metrics by service, sorted by date

## Access Patterns

### 1. Dashboard Metrics
- **Get User Metrics**: GSI1PK = User ID, GSI1SK begins_with "timesheet-"
- **Get Case Metrics**: GSI2PK = Case ID, GSI2SK begins_with "timesheet-"
- **Get Metric by Type**: GSI3PK = Metric Type, GSI3SK begins_with "2024-"
- **Get Recent Metrics**: GSI3PK = Metric Type, GSI3SK >= "2024-01-01"

### 2. Reports
- **Get User Reports**: GSI1PK = User ID, GSI1SK begins_with "2024-"
- **Get Reports by Type**: GSI2PK = Report Type, GSI2SK begins_with "2024-"
- **Get Recent Reports**: GSI1PK = User ID, GSI1SK >= "2024-01-01"

### 3. Dashboard Widgets
- **Get User Widgets**: GSI1PK = User ID, GSI1SK begins_with "1"
- **Get Visible Widgets**: GSI1PK = User ID, FilterExpression = "isVisible = true"

### 4. Dashboard Layouts
- **Get User Layouts**: GSI1PK = User ID, GSI1SK begins_with "layout-"
- **Get Active Layout**: GSI1PK = User ID, FilterExpression = "isActive = true"

### 5. System Metrics
- **Get Service Metrics**: GSI2PK = Service Name, GSI2SK begins_with "2024-"
- **Get Metric by Type**: GSI1PK = Metric Type, GSI1SK begins_with "2024-"

## Data Relationships

### Metrics to User
- Metrics are linked to users via `userId`
- Use GSI1 to query metrics by user

### Metrics to Case
- Metrics are linked to cases via `caseId`
- Use GSI2 to query metrics by case

### Reports to User
- Reports are linked to users via `userId`
- Use GSI1 to query reports by user

### Widgets to User
- Widgets are linked to users via `userId`
- Use GSI1 to query widgets by user

### Layouts to User
- Layouts are linked to users via `userId`
- Use GSI1 to query layouts by user

## Security Considerations

### Access Control
- Implement Row Level Security (RLS) based on user roles
- Users can only access their own metrics and reports
- Admins can access system metrics

### Data Encryption
- All metric data encrypted at rest in DynamoDB
- Sensitive data in reports encrypted
- File paths in S3 encrypted

### Audit Trail
- Track all metric collection operations
- Log report generation attempts
- Maintain metric history

## Performance Optimization

### Partition Key Design
- Use CUID for metric IDs to ensure even distribution
- Avoid hot partitions by using composite sort keys

### Query Optimization
- Use GSIs for common query patterns
- Implement pagination for large result sets
- Use projection expressions to limit returned attributes

### Caching Strategy
- Cache frequently accessed metrics
- Use Redis for real-time metrics
- Implement local caching for dashboard data

## Backup and Recovery

### Backup Strategy
- Enable point-in-time recovery for all tables
- Regular automated backups
- Cross-region replication for disaster recovery

### Data Retention
- Implement TTL for old metrics
- Archive old reports after specified period
- Maintain audit logs for compliance

## Monitoring and Alerting

### Key Metrics
- Dashboard load times
- Metric collection rates
- Report generation success rates
- Widget performance

### Alerts
- High error rates in metric collection
- Failed report generations
- Unusual metric patterns
- System performance issues

## Real-time Features

### WebSocket Integration
- Real-time metric updates
- Live dashboard refresh
- Instant widget updates

### Push Notifications
- Metric threshold alerts
- Report completion notifications
- Dashboard updates

## Metric Types

### Timesheet Metrics
- Total hours worked
- Daily/weekly/monthly hours
- Case hours breakdown
- Task hours breakdown
- Average session length
- Productivity trends

### Case Metrics
- Total cases
- Active cases
- Completed cases
- Case duration
- Case status distribution
- Case priority distribution

### Document Metrics
- Total documents
- Documents by type
- Document generation rates
- Document access patterns
- Storage usage

### Notification Metrics
- Total notifications
- Notification delivery rates
- Channel usage statistics
- User engagement rates

### System Metrics
- API response times
- Error rates
- User activity
- Resource utilization
- Performance indicators
