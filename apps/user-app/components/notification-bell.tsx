'use client';

/**
 * Notification Bell Component
 * 
 * Displays notification count and dropdown with recent notifications.
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications, Notification } from '@/lib/notifications-context';
import { Badge } from '@repo/ui';

const typeIcons: Record<string, string> = {
    APPROVAL_REQUEST: '📋',
    APPROVAL_COMPLETE: '✅',
    CONTRACT_UPDATE: '📄',
    SYSTEM: '⚙️',
    INFO: 'ℹ️',
};

const typeColors: Record<string, string> = {
    APPROVAL_REQUEST: 'bg-yellow-500',
    APPROVAL_COMPLETE: 'bg-green-500',
    CONTRACT_UPDATE: 'bg-blue-500',
    SYSTEM: 'bg-gray-500',
    INFO: 'bg-purple-500',
};

function timeSince(dateString: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Notifications"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-neutral-600"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <h3 className="font-semibold text-neutral-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-neutral-500">
                                No notifications
                            </div>
                        ) : (
                            <div>
                                {notifications.slice(0, 5).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-primary-50/50' : ''
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {notification.link ? (
                                            <Link href={notification.link} className="block">
                                                <NotificationContent notification={notification} />
                                            </Link>
                                        ) : (
                                            <NotificationContent notification={notification} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 5 && (
                        <div className="px-4 py-3 text-center border-t border-neutral-100 bg-neutral-50">
                            <div className="px-4 py-3 text-center border-t border-neutral-100 bg-neutral-50">
                                <Link
                                    href="/dashboard/notifications"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium block w-full h-full"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View all notifications
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function NotificationContent({ notification }: { notification: Notification }) {
    return (
        <div className="flex items-start gap-3">
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeColors[notification.type] || 'bg-gray-500'
                    }`}
            >
                <span className="text-white text-sm">
                    {typeIcons[notification.type] || 'ℹ️'}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-900 text-sm truncate">
                        {notification.title}
                    </p>
                    {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500" />
                    )}
                </div>
                <p className="text-sm text-neutral-500 truncate">{notification.message}</p>
                <p className="text-xs text-neutral-400 mt-1">{timeSince(notification.createdAt)}</p>
            </div>
        </div>
    );
}
