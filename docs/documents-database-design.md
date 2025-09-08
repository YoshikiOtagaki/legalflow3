# Document Management Database Design

## Overview
This document outlines the DynamoDB database design for the Document Management feature in LegalFlow3, based on the local Prisma schema and existing document management services.

## Database Tables

### 1. Documents Table
**Primary Key**: `PK` (Document ID), `SK` (Document ID)
**Purpose**: Store document metadata and file information

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Document ID (CUID) |
| SK | String | Document ID (CUID) |
| GSI1PK | String | Case ID |
| GSI1SK | String | Created At (ISO 8601) |
| GSI2PK | String | Created By User ID |
| GSI2SK | String | Created At (ISO 8601) |
| GSI3PK | String | Document Type ID |
| GSI3SK | String | Created At (ISO 8601) |
| GSI4PK | String | Document Status ID |
| GSI4SK | String | Created At (ISO 8601) |
| title | String | Document title |
| description | String | Document description |
| typeId | String | Document type ID |
| statusId | String | Document status ID |
| caseId | String | Associated case ID |
| templateId | String | Template ID (if generated) |
| filePath | String | S3 file path |
| fileSize | Number | File size in bytes |
| mimeType | String | MIME type |
| version | Number | Document version |
| isLatest | Boolean | Is latest version |
| parentDocumentId | String | Parent document ID (for versions) |
| tags | List<String> | Document tags |
| metadata | Map | Additional metadata |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| createdById | String | Creator user ID |
| updatedById | String | Last updater user ID |
| ttl | Number | TTL for soft delete |

### 2. DocumentVersions Table
**Primary Key**: `PK` (Document ID), `SK` (Version Number)
**Purpose**: Track document version history

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Document ID (CUID) |
| SK | String | Version number (padded) |
| GSI1PK | String | Document ID |
| GSI1SK | String | Version number (padded) |
| documentId | String | Document ID |
| version | Number | Version number |
| filePath | String | S3 file path for this version |
| fileSize | Number | File size in bytes |
| mimeType | String | MIME type |
| changeDescription | String | Description of changes |
| createdAt | String | Version creation timestamp (ISO 8601) |
| createdById | String | Creator user ID |
| ttl | Number | TTL for soft delete |

### 3. DocumentTemplates Table
**Primary Key**: `PK` (Template ID), `SK` (Template ID)
**Purpose**: Store document templates for generation

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Template ID (CUID) |
| SK | String | Template ID (CUID) |
| GSI1PK | String | Document Type ID |
| GSI1SK | String | Template Name |
| GSI2PK | String | Category |
| GSI2SK | String | Template Name |
| name | String | Template name |
| description | String | Template description |
| typeId | String | Document type ID |
| category | String | Template category |
| content | String | Template content (base64 encoded) |
| placeholders | List<String> | Available placeholders |
| isActive | Boolean | Is template active |
| version | Number | Template version |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| createdById | String | Creator user ID |
| ttl | Number | TTL for soft delete |

### 4. DocumentTypes Table
**Primary Key**: `PK` (Type ID), `SK` (Type ID)
**Purpose**: Define document types and their constraints

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Type ID (CUID) |
| SK | String | Type ID (CUID) |
| GSI1PK | String | Category |
| GSI1SK | String | Type Name |
| name | String | Type name |
| description | String | Type description |
| category | String | Type category |
| mimeTypes | List<String> | Allowed MIME types |
| maxFileSize | Number | Maximum file size in bytes |
| isActive | Boolean | Is type active |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

### 5. DocumentStatuses Table
**Primary Key**: `PK` (Status ID), `SK` (Status ID)
**Purpose**: Define document statuses and their properties

| Attribute | Type | Description |
|-----------|------|-------------|
| PK | String | Status ID (CUID) |
| SK | String | Status ID (CUID) |
| GSI1PK | String | Category |
| GSI1SK | String | Status Name |
| name | String | Status name |
| description | String | Status description |
| category | String | Status category |
| color | String | Status color (hex) |
| isActive | Boolean | Is status active |
| createdAt | String | Creation timestamp (ISO 8601) |
| updatedAt | String | Update timestamp (ISO 8601) |
| ttl | Number | TTL for soft delete |

## Global Secondary Indexes (GSI)

### Documents Table GSIs

#### GSI1: Case Documents
- **PK**: Case ID
- **SK**: Created At
- **Purpose**: Query documents by case, sorted by creation date

#### GSI2: User Documents
- **PK**: Created By User ID
- **SK**: Created At
- **Purpose**: Query documents by creator, sorted by creation date

#### GSI3: Type Documents
- **PK**: Document Type ID
- **SK**: Created At
- **Purpose**: Query documents by type, sorted by creation date

#### GSI4: Status Documents
- **PK**: Document Status ID
- **SK**: Created At
- **Purpose**: Query documents by status, sorted by creation date

### DocumentVersions Table GSIs

#### GSI1: Document Versions
- **PK**: Document ID
- **SK**: Version Number
- **Purpose**: Query all versions of a document, sorted by version

## Access Patterns

### 1. Document Management
- **Get Document**: PK = Document ID, SK = Document ID
- **List Documents by Case**: GSI1PK = Case ID, GSI1SK begins_with "2024-"
- **List Documents by User**: GSI2PK = User ID, GSI2SK begins_with "2024-"
- **List Documents by Type**: GSI3PK = Type ID, GSI3SK begins_with "2024-"
- **List Documents by Status**: GSI4PK = Status ID, GSI4SK begins_with "2024-"

### 2. Version Management
- **Get Document Versions**: PK = Document ID, SK begins_with "v"
- **Get Latest Version**: PK = Document ID, SK = "v" + highest version number
- **Get Specific Version**: PK = Document ID, SK = "v" + version number

### 3. Template Management
- **Get Template**: PK = Template ID, SK = Template ID
- **List Templates by Type**: GSI1PK = Type ID, GSI1SK begins_with "template-"
- **List Templates by Category**: GSI2PK = Category, GSI2SK begins_with "template-"

### 4. Type and Status Management
- **Get Type**: PK = Type ID, SK = Type ID
- **List Types by Category**: GSI1PK = Category, GSI1SK begins_with "type-"
- **Get Status**: PK = Status ID, SK = Status ID
- **List Statuses by Category**: GSI1PK = Category, GSI1SK begins_with "status-"

### 5. Search and Filter
- **Search by Title**: Scan with filter on title attribute
- **Search by Tags**: Scan with filter on tags attribute
- **Filter by Date Range**: Use GSI SK with begins_with for date range
- **Filter by Multiple Criteria**: Use multiple GSIs or scan with filters

## Data Relationships

### Document to Case
- Documents are linked to cases via `caseId`
- Use GSI1 to query documents by case

### Document to User
- Documents are linked to users via `createdById` and `updatedById`
- Use GSI2 to query documents by creator

### Document to Template
- Documents can be generated from templates via `templateId`
- Templates define the structure and placeholders

### Document to Type/Status
- Documents are linked to types and statuses via `typeId` and `statusId`
- Use GSI3 and GSI4 to query by type and status

### Document Versioning
- Document versions are stored in separate table
- Use `parentDocumentId` to link versions to parent document
- Use GSI1 to query all versions of a document

## Security Considerations

### Access Control
- Implement Row Level Security (RLS) based on user roles
- Users can only access documents from their assigned cases
- Document creators have full access to their documents

### Data Encryption
- All file content stored in S3 with server-side encryption
- Metadata encrypted at rest in DynamoDB
- File paths and sensitive data encrypted

### Audit Trail
- Track all document operations (create, read, update, delete)
- Log file access and downloads
- Maintain version history with change descriptions

## Performance Optimization

### Partition Key Design
- Use CUID for document IDs to ensure even distribution
- Avoid hot partitions by using composite sort keys

### Query Optimization
- Use GSIs for common query patterns
- Implement pagination for large result sets
- Use projection expressions to limit returned attributes

### Caching Strategy
- Cache frequently accessed documents
- Use CloudFront for file delivery
- Implement Redis for metadata caching

## Backup and Recovery

### Backup Strategy
- Enable point-in-time recovery for all tables
- Regular automated backups
- Cross-region replication for disaster recovery

### Data Retention
- Implement TTL for soft-deleted documents
- Archive old versions after specified period
- Maintain audit logs for compliance

## Monitoring and Alerting

### Key Metrics
- Document creation/update rates
- File upload/download volumes
- Error rates for document operations
- Storage usage and costs

### Alerts
- High error rates
- Unusual access patterns
- Storage quota approaching limits
- Failed document generation attempts
