// Notification Settings Component
import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Wifi,
  MessageCircle,
  Clock,
  Globe,
  Languages,
} from "lucide-react";
import { useNotificationSettings } from "../../hooks/use-notifications";
import { NotificationSettings as NotificationSettingsType } from "../../types/notification";

interface NotificationSettingsProps {
  userId: string;
  onSettingsUpdate?: (settings: NotificationSettingsType) => void;
  className?: string;
}

export function NotificationSettings({
  userId,
  onSettingsUpdate,
  className = "",
}: NotificationSettingsProps) {
  const { settings, loading, error, updateSettings } =
    useNotificationSettings(userId);
  const [formData, setFormData] = useState<Partial<NotificationSettingsType>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        pushEnabled: settings.pushEnabled,
        lineEnabled: settings.lineEnabled,
        inAppEnabled: settings.inAppEnabled,
        emailAddress: settings.emailAddress || "",
        phoneNumber: settings.phoneNumber || "",
        lineUserId: settings.lineUserId || "",
        quietHoursStart: settings.quietHoursStart || "",
        quietHoursEnd: settings.quietHoursEnd || "",
        timezone: settings.timezone || "UTC",
        language: settings.language || "en",
      });
    }
  }, [settings]);

  // Handle form field changes
  const handleFieldChange = (
    field: keyof NotificationSettingsType,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle toggle changes
  const handleToggleChange = (field: keyof NotificationSettingsType) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSaveError(null);

      const updatedSettings = await updateSettings(formData);
      onSettingsUpdate?.(updatedSettings);

      // Show success message
      console.log("Settings updated successfully");
    } catch (err) {
      console.error("Error updating settings:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to update settings",
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    if (settings) {
      setFormData({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        pushEnabled: settings.pushEnabled,
        lineEnabled: settings.lineEnabled,
        inAppEnabled: settings.inAppEnabled,
        emailAddress: settings.emailAddress || "",
        phoneNumber: settings.phoneNumber || "",
        lineUserId: settings.lineUserId || "",
        quietHoursStart: settings.quietHoursStart || "",
        quietHoursEnd: settings.quietHoursEnd || "",
        timezone: settings.timezone || "UTC",
        language: settings.language || "en",
      });
    }
  };

  if (loading) {
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
          <p className="text-red-600 mb-4">Error loading settings</p>
          <button
            onClick={() => window.location.reload()}
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
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Notification Settings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Notification Channels
            </h3>
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailEnabled || false}
                    onChange={() => handleToggleChange("emailEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      SMS Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Receive notifications via SMS
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.smsEnabled || false}
                    onChange={() => handleToggleChange("smsEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Push Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Receive push notifications
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pushEnabled || false}
                    onChange={() => handleToggleChange("pushEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* LINE Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      LINE Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Receive notifications via LINE
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lineEnabled || false}
                    onChange={() => handleToggleChange("lineEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* In-App Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wifi className="w-5 h-5 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      In-App Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Receive notifications within the app
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inAppEnabled || false}
                    onChange={() => handleToggleChange("inAppEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.emailAddress || ""}
                  onChange={(e) =>
                    handleFieldChange("emailAddress", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={(e) =>
                    handleFieldChange("phoneNumber", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* LINE User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LINE User ID
                </label>
                <input
                  type="text"
                  value={formData.lineUserId || ""}
                  onChange={(e) =>
                    handleFieldChange("lineUserId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your LINE user ID"
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Quiet Hours
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.quietHoursStart || ""}
                    onChange={(e) =>
                      handleFieldChange("quietHoursStart", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.quietHoursEnd || ""}
                    onChange={(e) =>
                      handleFieldChange("quietHoursEnd", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Notifications will be paused during these hours
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Preferences
            </h3>
            <div className="space-y-4">
              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={formData.timezone || "UTC"}
                  onChange={(e) =>
                    handleFieldChange("timezone", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={formData.language || "en"}
                  onChange={(e) =>
                    handleFieldChange("language", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{saveError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
