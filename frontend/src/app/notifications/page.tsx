// Notifications Page
"use client";

import React, { useState } from "react";
import { Bell, Settings, BarChart3, Filter } from "lucide-react";
import { NotificationList } from "../../components/notifications/NotificationList";
import { NotificationSettings } from "../../components/notifications/NotificationSettings";
import { NotificationStats } from "../../components/notifications/NotificationStats";
import { NotificationBell } from "../../components/notifications/NotificationBell";
import { useAuth } from "../../hooks/use-auth";
import { Notification } from "../../types/notification";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"list" | "settings" | "stats">(
    "list",
  );
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in
          </h1>
          <p className="text-gray-600">
            You need to be logged in to view notifications.
          </p>
        </div>
      </div>
    );
  }

  const handleNotificationSelect = (notification: Notification) => {
    setSelectedNotification(notification);
  };

  const handleMarkAllRead = () => {
    console.log("All notifications marked as read");
  };

  const handleArchiveAll = () => {
    console.log("All notifications archived");
  };

  const handleSettingsUpdate = (settings: any) => {
    console.log("Settings updated:", settings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Notifications
              </h1>
            </div>

            {/* Notification Bell */}
            <NotificationBell
              userId={user.id}
              onNotificationClick={handleNotificationSelect}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("list")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>All Notifications</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Statistics</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "list" && (
          <div className="space-y-6">
            <NotificationList
              userId={user.id}
              onNotificationSelect={handleNotificationSelect}
              onMarkAllRead={handleMarkAllRead}
              onArchiveAll={handleArchiveAll}
            />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <NotificationSettings
              userId={user.id}
              onSettingsUpdate={handleSettingsUpdate}
            />
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <NotificationStats userId={user.id} />
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedNotification.title}
                </h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">{selectedNotification.message}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    Priority: {selectedNotification.priority?.name || "Normal"}
                  </span>
                  <span>
                    Type: {selectedNotification.type?.name || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Channels:</span>
                  {selectedNotification.channels.map((channel) => (
                    <span
                      key={channel}
                      className="px-2 py-1 bg-gray-100 rounded"
                    >
                      {channel}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-gray-500">
                  Created:{" "}
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {!selectedNotification.isRead && (
                  <button
                    onClick={() => {
                      // Mark as read logic would go here
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
