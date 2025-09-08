// Notification Bell Component (Real-time notification indicator)
import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../../hooks/use-notifications";
import { Notification } from "../../types/notification";

interface NotificationBellProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export function NotificationBell({
  userId,
  onNotificationClick,
  className = "",
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { notifications, loading, markAsRead } = useNotifications({
    userId,
    isRead: false,
    limit: 10,
  });

  // Update unread count when notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
      onNotificationClick?.(notification);
      setIsOpen(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle bell click
  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  // Handle close dropdown
  const handleClose = () => {
    setIsOpen(false);
  };

  // Get notification priority color
  const getPriorityColor = (priorityId: string) => {
    const priorityColors: { [key: string]: string } = {
      high: "text-red-600",
      medium: "text-yellow-600",
      low: "text-green-600",
      urgent: "text-purple-600",
    };
    return priorityColors[priorityId] || "text-gray-600";
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          !notification.isRead ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <span
                          className={`text-xs ${getPriorityColor(notification.priorityId)}`}
                        >
                          {notification.priority?.name || "Normal"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(
                            notification.createdAt,
                          ).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          {notification.channels.map((channel) => (
                            <span
                              key={channel}
                              className="px-1 py-0.5 bg-gray-100 rounded text-xs"
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

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Navigate to full notifications page
                window.location.href = "/notifications";
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={handleClose} />}
    </div>
  );
}
