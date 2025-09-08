// GraphQL Queries for Notifications
import { generateClient } from "aws-amplify/api";

// Create GraphQL client
const client = generateClient();

// Helper function to create GraphQL operations (Gen2 compatible)
const gql = (query: string) => query;

// Notification Queries
export const getNotification = gql`
  query GetNotification($id: ID!) {
    getNotification(id: $id) {
      id
      userId
      typeId
      title
      message
      data
      isRead
      isArchived
      priorityId
      channels
      scheduledAt
      sentAt
      readAt
      archivedAt
      createdAt
      updatedAt
      type {
        id
        name
        description
        category
        template
        isActive
      }
      priority {
        id
        name
        level
        color
      }
      user {
        id
        name
        email
      }
    }
  }
`;

// Dashboard queries
export const getDashboardStats = gql`
  query GetDashboardStats($userId: ID!) {
    getDashboardStats(userId: $userId) {
      totalCases
      activeCases
      completedCases
      totalTimeSpent
      totalRevenue
      averageCaseDuration
      casesThisMonth
      casesLastMonth
      timeSpentThisMonth
      timeSpentLastMonth
    }
  }
`;

export const listDashboardMetrics = gql`
  query ListDashboardMetrics($userId: ID!, $filters: MetricFilters) {
    listDashboardMetrics(userId: $userId, filters: $filters) {
      items {
        id
        userId
        caseId
        metricType
        metricName
        value
        unit
        period
        date
        metadata
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const listReports = gql`
  query ListReports($userId: ID!, $filters: ReportFilters) {
    listReports(userId: $userId, filters: $filters) {
      items {
        id
        userId
        reportType
        title
        description
        parameters
        status
        generatedAt
        filePath
        fileSize
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const listDashboardWidgets = gql`
  query ListDashboardWidgets($userId: ID!) {
    listDashboardWidgets(userId: $userId) {
      items {
        id
        userId
        widgetType
        title
        position
        size
        configuration
        isVisible
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const listDashboardLayouts = gql`
  query ListDashboardLayouts($userId: ID!) {
    listDashboardLayouts(userId: $userId) {
      items {
        id
        userId
        name
        layout
        isDefault
        isActive
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const getActiveLayout = gql`
  query GetActiveLayout($userId: ID!) {
    getActiveLayout(userId: $userId) {
      id
      userId
      name
      layout
      isDefault
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const getNotificationStats = gql`
  query GetNotificationStats($userId: ID!) {
    getNotificationStats(userId: $userId) {
      total
      unread
      read
      archived
      byType
      byPriority
      recentActivity
    }
  }
`;

export const listNotifications = gql`
  query ListNotifications($filters: NotificationFilters) {
    listNotifications(filters: $filters) {
      items {
        id
        userId
        typeId
        title
        message
        data
        isRead
        isArchived
        priorityId
        channels
        scheduledAt
        sentAt
        readAt
        archivedAt
        createdAt
        updatedAt
        type {
          id
          name
          description
          category
          template
          isActive
        }
        priority {
          id
          name
          level
          color
        }
        user {
          id
          name
          email
        }
      }
      nextToken
      totalCount
      hasMore
    }
  }
`;
