'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationFilters } from '@/types/notification';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Archive,
  Trash2,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';

interface NotificationListProps {
  onNotificationSelect?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationList({
  onNotificationSelect,
  onMarkAllRead,
}: NotificationListProps) {
  const [filters, setFilters] = useState<NotificationFilters>({
    isArchived: false,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
  } = useNotifications(filters);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const newFilters = { ...filters, search: value, page: 1 };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  const handleFilterChange = (
    key: keyof NotificationFilters,
    value: string | boolean
  ) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('既読化エラー:', error);
      alert('既読化に失敗しました');
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await markAsUnread(notificationId);
    } catch (error) {
      console.error('未読化エラー:', error);
      alert('未読化に失敗しました');
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification(notificationId);
    } catch (error) {
      console.error('アーカイブエラー:', error);
      alert('アーカイブに失敗しました');
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (window.confirm('この通知を削除しますか？')) {
      try {
        await deleteNotification(notificationId);
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      onMarkAllRead?.();
    } catch (error) {
      console.error('一括既読化エラー:', error);
      alert('一括既読化に失敗しました');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高':
        return 'bg-red-100 text-red-800';
      case '中':
        return 'bg-yellow-100 text-yellow-800';
      case '低':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'line':
        return <MessageSquare className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      // 1分未満
      return 'たった今';
    } else if (diff < 3600000) {
      // 1時間未満
      return `${Math.floor(diff / 60000)}分前`;
    } else if (diff < 86400000) {
      // 1日未満
      return `${Math.floor(diff / 3600000)}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchNotifications()}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">通知</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}件の未読
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            すべて既読にする
          </Button>
        )}
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="タイトル、メッセージで検索..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ステータス</label>
              <select
                value={
                  filters.isRead === undefined ? '' : filters.isRead.toString()
                }
                onChange={e => {
                  const value = e.target.value;
                  handleFilterChange(
                    'isRead',
                    value === '' ? undefined : value === 'true'
                  );
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">すべて</option>
                <option value="false">未読</option>
                <option value="true">既読</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">アーカイブ</label>
              <select
                value={
                  filters.isArchived === undefined
                    ? ''
                    : filters.isArchived.toString()
                }
                onChange={e => {
                  const value = e.target.value;
                  handleFilterChange(
                    'isArchived',
                    value === '' ? undefined : value === 'true'
                  );
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">すべて</option>
                <option value="false">通常</option>
                <option value="true">アーカイブ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">並び順</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={e => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="createdAt-desc">作成日（新しい順）</option>
                <option value="createdAt-asc">作成日（古い順）</option>
                <option value="priority-desc">優先度（高い順）</option>
                <option value="priority-asc">優先度（低い順）</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知一覧 */}
      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">通知が見つかりませんでした</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notification => (
            <Card
              key={notification.id}
              className={`hover:shadow-md transition-shadow ${
                !notification.isRead
                  ? 'border-l-4 border-l-blue-500 bg-blue-50'
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Bell className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {notification.message}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getPriorityColor(
                        notification.priority?.name || ''
                      )}
                    >
                      {notification.priority?.name || '未設定'}
                    </Badge>
                    {!notification.isRead && (
                      <Badge variant="destructive" className="text-xs">
                        未読
                      </Badge>
                    )}
                    {notification.isArchived && (
                      <Badge variant="secondary" className="text-xs">
                        アーカイブ
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      {formatTime(notification.createdAt)}
                    </div>

                    {notification.channels.length > 0 && (
                      <div className="flex items-center gap-1">
                        {notification.channels.map((channel, index) => (
                          <div key={index} className="p-1 bg-gray-100 rounded">
                            {getChannelIcon(channel.type)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.isRead ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsUnread(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {!notification.isArchived && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(notification.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            前へ
          </Button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages} ページ
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
