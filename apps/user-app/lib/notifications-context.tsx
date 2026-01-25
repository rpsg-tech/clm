'use client';

/**
 * Notifications Context
 * 
 * Manages notification state and simulates real-time updates.
 * In production, this would use WebSocket for real-time notifications.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { api } from './api-client';

export interface Notification {
    id: string;
    type: 'CONTRACT_UPDATE' | 'APPROVAL_REQUEST' | 'APPROVAL_COMPLETE' | 'SYSTEM' | 'INFO';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

// Initial mock notifications
const initialNotifications: Notification[] = [
    {
        id: '1',
        type: 'APPROVAL_REQUEST',
        title: 'New Approval Request',
        message: 'Service Agreement with Vendor XYZ requires your approval',
        link: '/dashboard/approvals/legal',
        isRead: false,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    },
    {
        id: '2',
        type: 'CONTRACT_UPDATE',
        title: 'Contract Status Changed',
        message: 'NDA Agreement has been approved by Legal',
        link: '/dashboard/contracts',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
        id: '3',
        type: 'SYSTEM',
        title: 'Welcome to CLM Enterprise',
        message: 'Your account is now set up and ready to use.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications on auth
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            const data = await api.notifications.list();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchNotifications();

        // Poll every 30 seconds for updates
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // WebSocket implementation would go here

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
        // Optimistic update
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 9),
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await api.notifications.markRead(id);
        } catch (error) {
            // Revert on failure (optional, simplified here)
            console.error('Failed to mark read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await api.notifications.markAllRead();
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
