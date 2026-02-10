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
const CACHE_KEY = 'clm_notifications_cache';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// LocalStorage helpers
function getStoredNotifications(): { notifications: Notification[]; unreadCount: number; timestamp: number } | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return undefined;
        return JSON.parse(cached);
    } catch (error) {
        console.error('Failed to parse cached notifications:', error);
        return undefined;
    }
}

function setStoredNotifications(data: { notifications: Notification[]; unreadCount: number }) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ...data, timestamp: Date.now() })
        );
    } catch (error) {
        console.error('Failed to cache notifications:', error);
    }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Load initial data from storage
    const cachedData = getStoredNotifications();

    // Use React Query to fetch notifications with automatic polling
    const { data } = useQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: async () => {
            try {
                const result = await api.notifications.list();
                // Cache successful result
                setStoredNotifications(result);
                return result;
            } catch (error: any) {
                // Silently handle auth errors
                if (error?.statusCode === 401 || error?.status === 401) {
                    return { notifications: [], unreadCount: 0 };
                }
                console.error('Failed to fetch notifications:', error);
                // Return empty if no cache, else throw to let React Query handle it (or use placeholder data)
                return { notifications: [], unreadCount: 0 };
            }
        },
        // Use cached data as initial data
        initialData: cachedData ? { notifications: cachedData.notifications, unreadCount: cachedData.unreadCount } : undefined,
        initialDataUpdatedAt: cachedData?.timestamp,
        staleTime: CACHE_TTL, // Considered fresh for 2 minutes
        refetchInterval: 60 * 1000, // Poll every 60 seconds
        enabled: isAuthenticated, // Only fetch when authenticated
        retry: false,
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    // Client-side adding
    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
            const newNotification: Notification = {
                ...notification,
                id: Math.random().toString(36).substring(2, 9),
                isRead: false,
                createdAt: new Date().toISOString(),
            };

            const newData = (old: any) => {
                const updated = {
                    notifications: [newNotification, ...(old?.notifications || [])],
                    unreadCount: (old?.unreadCount || 0) + 1,
                };
                // Update cache immediately
                setStoredNotifications(updated);
                return updated;
            };

            // Optimistically update cache
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, newData);
        },
        [queryClient]
    );

    const markAsRead = useCallback(
        async (id: string) => {
            // Optimistic update
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                const updated = {
                    notifications: old?.notifications?.map((n: Notification) =>
                        n.id === id ? { ...n, isRead: true } : n
                    ) || [],
                    unreadCount: Math.max(0, (old?.unreadCount || 0) - 1),
                };
                setStoredNotifications(updated);
                return updated;
            });

            try {
                await api.notifications.markRead(id);
                // No refetch needed if successful, cache is already updated optimistically
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
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
            const updated = {
                notifications: old?.notifications?.map((n: Notification) => ({ ...n, isRead: true })) || [],
                unreadCount: 0,
            };
            setStoredNotifications(updated);
            return updated;
        });

        try {
            await api.notifications.markAllRead();
        } catch (error) {
            console.error('Failed to mark all read:', error);
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        }
    }, [queryClient]);

    const clearAll = useCallback(() => {
        const empty = {
            notifications: [],
            unreadCount: 0,
        };
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, empty);
        setStoredNotifications(empty);
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
