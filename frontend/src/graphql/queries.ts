// GraphQL Queries for Notifications
import { generateClient } from "aws-amplify/api";

// Create GraphQL client
const client = generateClient();

// Helper function to create GraphQL operations
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
      totalCount
      hasMore
    }
  }
`;

export const listUserNotifications = gql`
  query ListUserNotifications($userId: ID!, $filters: NotificationFilters) {
    listUserNotifications(userId: $userId, filters: $filters) {
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
      totalCount
      hasMore
    }
  }
`;

export const listUnreadNotifications = gql`
  query ListUnreadNotifications($userId: ID!, $filters: NotificationFilters) {
    listUnreadNotifications(userId: $userId, filters: $filters) {
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
      totalCount
      hasMore
    }
  }
`;

export const listArchivedNotifications = gql`
  query ListArchivedNotifications($userId: ID!, $filters: NotificationFilters) {
    listArchivedNotifications(userId: $userId, filters: $filters) {
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
      totalCount
      hasMore
    }
  }
`;

export const searchNotifications = gql`
  query SearchNotifications(
    $searchTerm: String!
    $filters: NotificationFilters
  ) {
    searchNotifications(searchTerm: $searchTerm, filters: $filters) {
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
      totalCount
      hasMore
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
      byType {
        typeId
        typeName
        count
      }
      byPriority {
        priorityId
        priorityName
        count
      }
      byChannel {
        channel
        count
      }
    }
  }
`;

// Notification Type Queries
export const getNotificationType = gql`
  query GetNotificationType($id: ID!) {
    getNotificationType(id: $id) {
      id
      name
      description
      category
      template
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const listNotificationTypes = gql`
  query ListNotificationTypes($filters: NotificationTypeFilters) {
    listNotificationTypes(filters: $filters) {
      items {
        id
        name
        description
        category
        template
        isActive
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const listNotificationTypesByCategory = gql`
  query ListNotificationTypesByCategory(
    $category: String!
    $filters: NotificationTypeFilters
  ) {
    listNotificationTypesByCategory(category: $category, filters: $filters) {
      items {
        id
        name
        description
        category
        template
        isActive
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const searchNotificationTypes = gql`
  query SearchNotificationTypes(
    $searchTerm: String!
    $filters: NotificationTypeFilters
  ) {
    searchNotificationTypes(searchTerm: $searchTerm, filters: $filters) {
      items {
        id
        name
        description
        category
        template
        isActive
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

// Notification Priority Queries
export const getNotificationPriority = gql`
  query GetNotificationPriority($id: ID!) {
    getNotificationPriority(id: $id) {
      id
      name
      level
      color
      createdAt
      updatedAt
    }
  }
`;

export const listNotificationPriorities = gql`
  query ListNotificationPriorities($filters: NotificationPriorityFilters) {
    listNotificationPriorities(filters: $filters) {
      items {
        id
        name
        level
        color
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const listNotificationPrioritiesByLevel = gql`
  query ListNotificationPrioritiesByLevel(
    $level: Int!
    $filters: NotificationPriorityFilters
  ) {
    listNotificationPrioritiesByLevel(level: $level, filters: $filters) {
      items {
        id
        name
        level
        color
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const searchNotificationPriorities = gql`
  query SearchNotificationPriorities(
    $searchTerm: String!
    $filters: NotificationPriorityFilters
  ) {
    searchNotificationPriorities(searchTerm: $searchTerm, filters: $filters) {
      items {
        id
        name
        level
        color
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

// Notification Channel Queries
export const getNotificationChannel = gql`
  query GetNotificationChannel($id: ID!) {
    getNotificationChannel(id: $id) {
      id
      name
      type
      isEnabled
      config
      createdAt
      updatedAt
    }
  }
`;

export const listNotificationChannels = gql`
  query ListNotificationChannels($filters: NotificationChannelFilters) {
    listNotificationChannels(filters: $filters) {
      items {
        id
        name
        type
        isEnabled
        config
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const listNotificationChannelsByType = gql`
  query ListNotificationChannelsByType(
    $type: String!
    $filters: NotificationChannelFilters
  ) {
    listNotificationChannelsByType(type: $type, filters: $filters) {
      items {
        id
        name
        type
        isEnabled
        config
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const searchNotificationChannels = gql`
  query SearchNotificationChannels(
    $searchTerm: String!
    $filters: NotificationChannelFilters
  ) {
    searchNotificationChannels(searchTerm: $searchTerm, filters: $filters) {
      items {
        id
        name
        type
        isEnabled
        config
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

// Notification Settings Queries
export const getNotificationSettings = gql`
  query GetNotificationSettings($userId: ID!) {
    getNotificationSettings(userId: $userId) {
      id
      userId
      emailEnabled
      smsEnabled
      pushEnabled
      lineEnabled
      inAppEnabled
      emailAddress
      phoneNumber
      lineUserId
      quietHoursStart
      quietHoursEnd
      timezone
      language
      createdAt
      updatedAt
      user {
        id
        name
        email
      }
    }
  }
`;

export const getUserNotificationSettings = gql`
  query GetUserNotificationSettings($userId: ID!) {
    getUserNotificationSettings(userId: $userId) {
      id
      userId
      emailEnabled
      smsEnabled
      pushEnabled
      lineEnabled
      inAppEnabled
      emailAddress
      phoneNumber
      lineUserId
      quietHoursStart
      quietHoursEnd
      timezone
      language
      createdAt
      updatedAt
      user {
        id
        name
        email
      }
    }
  }
`;
