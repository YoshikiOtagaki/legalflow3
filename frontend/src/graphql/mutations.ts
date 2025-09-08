// GraphQL Mutations for Notifications
import { generateClient } from "aws-amplify/api";

// Create GraphQL client
const client = generateClient();

// Helper function to create GraphQL operations (Gen2 compatible)
const gql = (query: string) => query;

// Notification Mutations
export const createNotification = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
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
    }
  }
`;

export const updateNotification = gql`
  mutation UpdateNotification($input: UpdateNotificationInput!) {
    updateNotification(input: $input) {
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
    }
  }
`;

export const deleteNotification = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;

export const markNotificationAsRead = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
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
    }
  }
`;

export const markNotificationAsUnread = gql`
  mutation MarkNotificationAsUnread($id: ID!) {
    markNotificationAsUnread(id: $id) {
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
    }
  }
`;

export const markAllNotificationsAsRead = gql`
  mutation MarkAllNotificationsAsRead($userId: ID!) {
    markAllNotificationsAsRead(userId: $userId)
  }
`;

export const archiveNotification = gql`
  mutation ArchiveNotification($id: ID!) {
    archiveNotification(id: $id) {
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
    }
  }
`;

export const unarchiveNotification = gql`
  mutation UnarchiveNotification($id: ID!) {
    unarchiveNotification(id: $id) {
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
    }
  }
`;

export const archiveAllNotifications = gql`
  mutation ArchiveAllNotifications($userId: ID!) {
    archiveAllNotifications(userId: $userId)
  }
`;

export const sendNotification = gql`
  mutation SendNotification($input: CreateNotificationInput!) {
    sendNotification(input: $input) {
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
    }
  }
`;

export const scheduleNotification = gql`
  mutation ScheduleNotification($input: CreateNotificationInput!) {
    scheduleNotification(input: $input) {
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
    }
  }
`;

// Notification Type Mutations
export const createNotificationType = gql`
  mutation CreateNotificationType($input: CreateNotificationTypeInput!) {
    createNotificationType(input: $input) {
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

export const updateNotificationType = gql`
  mutation UpdateNotificationType($input: UpdateNotificationTypeInput!) {
    updateNotificationType(input: $input) {
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

export const deleteNotificationType = gql`
  mutation DeleteNotificationType($id: ID!) {
    deleteNotificationType(id: $id)
  }
`;

export const activateNotificationType = gql`
  mutation ActivateNotificationType($id: ID!) {
    activateNotificationType(id: $id) {
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

export const deactivateNotificationType = gql`
  mutation DeactivateNotificationType($id: ID!) {
    deactivateNotificationType(id: $id) {
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

// Notification Priority Mutations
export const createNotificationPriority = gql`
  mutation CreateNotificationPriority(
    $input: CreateNotificationPriorityInput!
  ) {
    createNotificationPriority(input: $input) {
      id
      name
      level
      color
      createdAt
      updatedAt
    }
  }
`;

export const updateNotificationPriority = gql`
  mutation UpdateNotificationPriority(
    $input: UpdateNotificationPriorityInput!
  ) {
    updateNotificationPriority(input: $input) {
      id
      name
      level
      color
      createdAt
      updatedAt
    }
  }
`;

export const deleteNotificationPriority = gql`
  mutation DeleteNotificationPriority($id: ID!) {
    deleteNotificationPriority(id: $id)
  }
`;

// Notification Channel Mutations
export const createNotificationChannel = gql`
  mutation CreateNotificationChannel($input: CreateNotificationChannelInput!) {
    createNotificationChannel(input: $input) {
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

export const updateNotificationChannel = gql`
  mutation UpdateNotificationChannel($input: UpdateNotificationChannelInput!) {
    updateNotificationChannel(input: $input) {
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

export const deleteNotificationChannel = gql`
  mutation DeleteNotificationChannel($id: ID!) {
    deleteNotificationChannel(id: $id)
  }
`;

export const enableNotificationChannel = gql`
  mutation EnableNotificationChannel($id: ID!) {
    enableNotificationChannel(id: $id) {
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

export const disableNotificationChannel = gql`
  mutation DisableNotificationChannel($id: ID!) {
    disableNotificationChannel(id: $id) {
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

// Notification Settings Mutations
export const createNotificationSettings = gql`
  mutation CreateNotificationSettings(
    $input: CreateNotificationSettingsInput!
  ) {
    createNotificationSettings(input: $input) {
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
    }
  }
`;

export const updateNotificationSettings = gql`
  mutation UpdateNotificationSettings(
    $input: UpdateNotificationSettingsInput!
  ) {
    updateNotificationSettings(input: $input) {
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
    }
  }
`;

export const deleteNotificationSettings = gql`
  mutation DeleteNotificationSettings($id: ID!) {
    deleteNotificationSettings(id: $id)
  }
`;

export const updateUserNotificationSettings = gql`
  mutation UpdateUserNotificationSettings(
    $userId: ID!
    $input: UpdateNotificationSettingsInput!
  ) {
    updateUserNotificationSettings(userId: $userId, input: $input) {
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
    }
  }
`;
