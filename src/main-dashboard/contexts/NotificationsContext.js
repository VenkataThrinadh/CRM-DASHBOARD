import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    // Only fetch if user is authenticated and is admin
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }
    
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll(params);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching notifications:', error);
      // Don't throw error to prevent app crashes
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if user is authenticated and is admin
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }
    
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching unread count:', error);
      // Don't throw error to prevent app crashes
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    // Only proceed if user is authenticated and is admin
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }
    
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Only proceed if user is authenticated and is admin
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }
    
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    // Only proceed if user is authenticated and is admin
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }
    
    try {
      await notificationsAPI.delete(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting notification:', error);
    }
  };

  // Auto-refresh unread count every 30 seconds - only when authenticated as admin
  useEffect(() => {
    // Only fetch notifications if user is authenticated and is an admin
    if (isAuthenticated && user && user.role === 'admin') {
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};