import React, { createContext, useContext, useState, useCallback } from 'react';
import { DEFAULT_TOAST_DURATION } from './notificationUtils';


const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  const clearToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((title, description, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newToast = { id, title, description, type };
    setToasts(prev => [...prev, newToast]);

    // Automatically remove after the configured duration
    setTimeout(() => {
      clearToast(id);
    }, DEFAULT_TOAST_DURATION);
  }, [clearToast]);

  const addNotification = useCallback((text, type, senderId, metadata = null) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      text,
      timestamp: new Date().toISOString(),
      read: false,
      senderId,
      metadata
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(type === 'friend_request' ? "Contact Request" : "New Notification", text, "info");
  }, [showToast]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast("Success", "All notifications marked as read", "success");
  }, [showToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        showToast,
        clearToast,
        addNotification,
        markAsRead,
        deleteNotification,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
