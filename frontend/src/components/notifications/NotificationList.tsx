// Notification List Component
import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  ArchiveRestore,
  Filter,
  Search,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "../../hooks/use-notifications";
import { Notification, NotificationFilters } from "../../types/notification";

interface NotificationListProps {
  userId: string;
  onNotificationSelect?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
  onArchiveAll?: () => void;
  className?: string;
}

export function NotificationList({
  userId,
  onNotificationSelect,
  onMarkAllRead,
  onArchiveAll,
  className = "",
}: NotificationListProps) {
  const [filters, setFilters] = useState<NotificationFilters>({
    userId,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    notifications,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archive,
    unarchive,
    archiveAll,
  } = useNotifications(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<NotificationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    handleFilterChange({ searchTerm: term || undefined });
  };

  // Handle mark as read
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
      onNotificationSelect?.(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle mark as unread
  const handleMarkAsUnread = async (notification: Notification) => {
    try {
      await markAsUnread(notification.id);
    } catch (error) {
      console.error("Error marking notification as unread:", error);
    }
  };

  // Handle archive
  const handleArchive = async (notification: Notification) => {
    try {
      await archive(notification.id);
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  // Handle unarchive
  const handleUnarchive = async (notification: Notification) => {
    try {
      await unarchive(notification.id);
    } catch (error) {
      console.error("Error unarchiving notification:", error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      onMarkAllRead?.();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle archive all
  const handleArchiveAll = async () => {
    try {
      await archiveAll(userId);
      onArchiveAll?.();
    } catch (error) {
      console.error("Error archiving all notifications:", error);
    }
  };

  // Get notification priority color
  const getPriorityColor = (priorityId: string) => {
    const priorityColors: { [key: string]: string } = {
      high: "text-red-600 bg-red-50",
      medium: "text-yellow-600 bg-yellow-50",
      low: "text-green-600 bg-green-50",
      urgent: "text-purple-600 bg-purple-50",
    };
    return priorityColors[priorityId] || "text-gray-600 bg-gray-50";
  };

  // Get notification type icon
  const getTypeIcon = (typeId: string) => {
    const typeIcons: { [key: string]: React.ReactNode } = {
      case_update: <Bell className="w-4 h-4" />,
      document_ready: <Bell className="w-4 h-4" />,
      hearing_reminder: <Bell className="w-4 h-4" />,
      system_alert: <Bell className="w-4 h-4" />,
    };
    return typeIcons[typeId] || <Bell className="w-4 h-4" />;
  };

  if (loading && notifications.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading notifications</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications ({totalCount})
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={refresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-4">
              <select
                value={
                  filters.isRead === undefined
                    ? ""
                    : filters.isRead
                      ? "read"
                      : "unread"
                }
                onChange={(e) =>
                  handleFilterChange({
                    isRead:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "read",
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              <select
                value={
                  filters.isArchived === undefined
                    ? ""
                    : filters.isArchived
                      ? "archived"
                      : "active"
                }
                onChange={(e) =>
                  handleFilterChange({
                    isArchived:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "archived",
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Mark All Read
          </button>
          <button
            onClick={handleArchiveAll}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Archive All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                !notification.isRead
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
              onClick={() => handleMarkAsRead(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getTypeIcon(notification.typeId)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priorityId)}`}
                      >
                        {notification.priority?.name || "Normal"}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.isRead
                              ? handleMarkAsUnread(notification)
                              : handleMarkAsRead(notification);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {notification.isRead ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <CheckCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.isArchived
                              ? handleUnarchive(notification)
                              : handleArchive(notification);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {notification.isArchived ? (
                            <ArchiveRestore className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <div className="flex items-center space-x-2">
                      {notification.channels.map((channel) => (
                        <span
                          key={channel}
                          className="px-2 py-1 bg-gray-100 rounded"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
