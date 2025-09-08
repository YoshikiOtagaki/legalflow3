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
    deleteNotification(id: $id) {
      id
      userId
      typeId
      title
    }
  }
`;

export const markAsRead = gql`
  mutation MarkAsRead($id: ID!) {
    markAsRead(id: $id) {
      id
      isRead
      readAt
    }
  }
`;

export const markAsUnread = gql`
  mutation MarkAsUnread($id: ID!) {
    markAsUnread(id: $id) {
      id
      isRead
      readAt
    }
  }
`;

export const archiveNotification = gql`
  mutation ArchiveNotification($id: ID!) {
    archiveNotification(id: $id) {
      id
      isArchived
      archivedAt
    }
  }
`;

export const unarchiveNotification = gql`
  mutation UnarchiveNotification($id: ID!) {
    unarchiveNotification(id: $id) {
      id
      isArchived
      archivedAt
    }
  }
`;

export const markAllAsRead = gql`
  mutation MarkAllAsRead($userId: ID!) {
    markAllAsRead(userId: $userId)
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

// Dashboard mutations
export const createDashboardWidget = gql`
  mutation CreateDashboardWidget($input: CreateDashboardWidgetInput!) {
    createDashboardWidget(input: $input) {
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
  }
`;

export const updateDashboardWidget = gql`
  mutation UpdateDashboardWidget($input: UpdateDashboardWidgetInput!) {
    updateDashboardWidget(input: $input) {
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
  }
`;

export const deleteDashboardWidget = gql`
  mutation DeleteDashboardWidget($id: ID!) {
    deleteDashboardWidget(id: $id) {
      id
      userId
      widgetType
      title
    }
  }
`;

export const createDashboardLayout = gql`
  mutation CreateDashboardLayout($input: CreateDashboardLayoutInput!) {
    createDashboardLayout(input: $input) {
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

export const updateDashboardLayout = gql`
  mutation UpdateDashboardLayout($input: UpdateDashboardLayoutInput!) {
    updateDashboardLayout(input: $input) {
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

export const deleteDashboardLayout = gql`
  mutation DeleteDashboardLayout($id: ID!) {
    deleteDashboardLayout(id: $id) {
      id
      userId
      name
    }
  }
`;
