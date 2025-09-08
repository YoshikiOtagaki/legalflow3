// Notification Management Hooks
import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/api";
import {
  listNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  archiveNotification,
  unarchiveNotification,
  archiveAllNotifications,
  getNotificationStats,
} from "../graphql/mutations";
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationSettings,
  NotificationFilters,
  NotificationStats,
} from "../types/notification";

const client = generateClient();

// Hook for managing notifications
export function useNotifications(filters: NotificationFilters = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: listNotifications,
          variables: { filters },
        });

        const data = result.data.listNotifications;

        if (reset) {
          setNotifications(data.items || []);
        } else {
          setNotifications((prev) => [...prev, ...(data.items || [])]);
        }

        setHasMore(data.hasMore || false);
        setTotalCount(data.totalCount || 0);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch notifications",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  }, [loading, hasMore, fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Create notification
  const create = useCallback(async (input: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: createNotification,
        variables: { input },
      });

      const notification = result.data.createNotification;
      setNotifications((prev) => [notification, ...prev]);
      setTotalCount((prev) => prev + 1);

      return notification;
    } catch (err) {
      console.error("Error creating notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create notification",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update notification
  const update = useCallback(async (id: string, input: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: updateNotification,
        variables: { input: { id, ...input } },
      });

      const notification = result.data.updateNotification;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? notification : n)),
      );

      return notification;
    } catch (err) {
      console.error("Error updating notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update notification",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete notification
  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await client.graphql({
        query: deleteNotification,
        variables: { id },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => prev - 1);

      return true;
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete notification",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: markNotificationAsRead,
        variables: { id },
      });

      const notification = result.data.markNotificationAsRead;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? notification : n)),
      );

      return notification;
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as unread
  const markAsUnread = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: markNotificationAsUnread,
        variables: { id },
      });

      const notification = result.data.markNotificationAsUnread;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? notification : n)),
      );

      return notification;
    } catch (err) {
      console.error("Error marking notification as unread:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as unread",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      await client.graphql({
        query: markAllNotificationsAsRead,
        variables: { userId },
      });

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );

      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Archive notification
  const archive = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: archiveNotification,
        variables: { id },
      });

      const notification = result.data.archiveNotification;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? notification : n)),
      );

      return notification;
    } catch (err) {
      console.error("Error archiving notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to archive notification",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unarchive notification
  const unarchive = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: unarchiveNotification,
        variables: { id },
      });

      const notification = result.data.unarchiveNotification;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? notification : n)),
      );

      return notification;
    } catch (err) {
      console.error("Error unarchiving notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to unarchive notification",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Archive all notifications
  const archiveAll = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      await client.graphql({
        query: archiveAllNotifications,
        variables: { userId },
      });

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isArchived: true,
          archivedAt: new Date().toISOString(),
        })),
      );

      return true;
    } catch (err) {
      console.error("Error archiving all notifications:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to archive all notifications",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    totalCount,
    fetchNotifications,
    loadMore,
    refresh,
    create,
    update,
    remove,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archive,
    unarchive,
    archiveAll,
  };
}

// Hook for managing a single notification
export function useNotification(id: string) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notification
  const fetchNotification = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: getNotification,
        variables: { id },
      });

      setNotification(result.data.getNotification);
    } catch (err) {
      console.error("Error fetching notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch notification",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load notification on mount
  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);

  return {
    notification,
    loading,
    error,
    fetchNotification,
  };
}

// Hook for notification statistics
export function useNotificationStats(userId: string) {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: getNotificationStats,
        variables: { userId },
      });

      setStats(result.data.getNotificationStats);
    } catch (err) {
      console.error("Error fetching notification stats:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch notification stats",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
}

// Hook for notification settings
export function useNotificationSettings(userId: string) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await client.graphql({
        query: getNotificationSettings,
        variables: { userId },
      });

      setSettings(result.data.getNotificationSettings);
    } catch (err) {
      console.error("Error fetching notification settings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch notification settings",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update settings
  const updateSettings = useCallback(
    async (input: any) => {
      try {
        setLoading(true);
        setError(null);

        const result = await client.graphql({
          query: updateNotificationSettings,
          variables: { input: { userId, ...input } },
        });

        setSettings(result.data.updateNotificationSettings);
        return result.data.updateNotificationSettings;
      } catch (err) {
        console.error("Error updating notification settings:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update notification settings",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
  };
}
