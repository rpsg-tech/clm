'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Use React Query to fetch notifications with automatic polling
    const { data } = useQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: async () => {
            try {
                return await api.notifications.list();
            } catch (error: any) {
                // Silently handle auth errors (401) - user is logging out or not authenticated
                if (error?.statusCode === 401 || error?.status === 401) {
                    return { notifications: [], unreadCount: 0 };
                }
                console.error('Failed to fetch notifications:', error);
                return { notifications: [], unreadCount: 0 };
            }
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 60 * 1000, // Poll every 60 seconds (reduced from 30s)
        enabled: isAuthenticated, // Only fetch when authenticated
        retry: false, // Don't retry on auth failures
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    // Client-side add notification (e.g., for optimistic updates or testing)
    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
            const newNotification: Notification = {
                ...notification,
                id: Math.random().toString(36).substring(2, 9),
                isRead: false,
                createdAt: new Date().toISOString(),
            };

            // Optimistically update cache
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => ({
                notifications: [newNotification, ...(old?.notifications || [])],
                unreadCount: (old?.unreadCount || 0) + 1,
            }));
        },
        [queryClient]
    );

    const markAsRead = useCallback(
        async (id: string) => {
            // Optimistic update
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => ({
                notifications: old?.notifications?.map((n: Notification) =>
                    n.id === id ? { ...n, isRead: true } : n
                ) || [],
                unreadCount: Math.max(0, (old?.unreadCount || 0) - 1),
            }));

            try {
                await api.notifications.markRead(id);
                // Refetch to stay in sync with server
                queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
            } catch (error) {
                console.error('Failed to mark read:', error);
                // Refetch to revert on failure
                queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
            }
        },
        [queryClient]
    );

    const markAllAsRead = useCallback(async () => {
        // Optimistic update
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => ({
            notifications: old?.notifications?.map((n: Notification) => ({ ...n, isRead: true })) || [],
            unreadCount: 0,
        }));

        try {
            await api.notifications.markAllRead();
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        } catch (error) {
            console.error('Failed to mark all read:', error);
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        }
    }, [queryClient]);

    const clearAll = useCallback(() => {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, {
            notifications: [],
            unreadCount: 0,
        });
    }, [queryClient]);

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
