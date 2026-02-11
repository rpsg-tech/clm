'use client';

import { useState } from 'react';
import { useNotifications, Notification } from '@/lib/notifications-context';
import { Card, Button, Badge } from '@repo/ui';
import {
    Bell,
    CheckCircle,
    Filter,
    Search,
    MailOpen,
    Trash2,
    Inbox
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const typeIcons: Record<string, string> = {
    APPROVAL_REQUEST: '📋',
    APPROVAL_COMPLETE: '✅',
    CONTRACT_UPDATE: '📄',
    SYSTEM: '⚙️',
    INFO: 'ℹ️',
};

const typeColors: Record<string, string> = {
    APPROVAL_REQUEST: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    APPROVAL_COMPLETE: 'bg-green-100 text-green-600 border-green-200',
    CONTRACT_UPDATE: 'bg-blue-100 text-blue-600 border-blue-200',
    SYSTEM: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    INFO: 'bg-purple-100 text-purple-600 border-purple-200',
};

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'SYSTEM' | 'APPROVAL'>('ALL');

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'UNREAD') return !n.isRead;
        if (filter === 'SYSTEM') return n.type === 'SYSTEM' || n.type === 'INFO';
        if (filter === 'APPROVAL') return n.type.includes('APPROVAL');
        return true;
    });

    const groupedNotifications = groupNotificationsByDate(filteredNotifications);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary-600" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="error" className="ml-2 px-2.5 py-1 text-sm rounded-full">
                                {unreadCount} new
                            </Badge>
                        )}
                    </h1>
                    <p className="text-neutral-500 mt-2">
                        Stay updated with important activities and alerts across your contracts.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="gap-2"
                    >
                        <MailOpen className="w-4 h-4" />
                        Mark all read
                    </Button>
                    {/* Optional: Clear all button for demo/cleanup */}
                    {/* <Button variant="ghost" className="text-red-500 hover:text-red-600 gap-2" onClick={clearAll}>
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </Button> */}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200">
                <FilterButton
                    active={filter === 'ALL'}
                    onClick={() => setFilter('ALL')}
                    label="All Notifications"
                    count={notifications.length}
                />
                <FilterButton
                    active={filter === 'UNREAD'}
                    onClick={() => setFilter('UNREAD')}
                    label="Unread"
                    count={notifications.filter(n => !n.isRead).length}
                />
                <FilterButton
                    active={filter === 'APPROVAL'}
                    onClick={() => setFilter('APPROVAL')}
                    label="Approvals"
                />
                <FilterButton
                    active={filter === 'SYSTEM'}
                    onClick={() => setFilter('SYSTEM')}
                    label="System"
                />
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {filteredNotifications.length === 0 ? (
                    <EmptyState filter={filter} />
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedNotifications).map(([dateGroup, items]) => (
                            <section key={dateGroup} className="space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 pl-1">
                                    {dateGroup}
                                </h3>
                                <div className="space-y-3">
                                    <AnimatePresence initial={false}>
                                        {items.map((notification) => (
                                            <NotificationCard
                                                key={notification.id}
                                                notification={notification}
                                                onRead={() => markAsRead(notification.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${active
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent'
                }
            `}
        >
            {label}
            {count !== undefined && (
                <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${active ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function NotificationCard({ notification, onRead }: { notification: Notification, onRead: () => void }) {
    const isUnread = !notification.isRead;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                group relative bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200
                ${isUnread ? 'border-primary-200 bg-primary-50/10' : 'border-neutral-200'}
            `}
            onClick={() => isUnread && onRead()}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border 
                    ${typeColors[notification.type] || 'bg-gray-100 text-gray-500'}
                `}>
                    {typeIcons[notification.type] || 'ℹ️'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className={`text-base font-semibold ${isUnread ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                {notification.title}
                            </h4>
                            <p className="text-neutral-600 mt-1 leading-relaxed">
                                {notification.message}
                            </p>
                        </div>
                        {isUnread && (
                            <span className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-2 ring-4 ring-primary-100 animate-pulse" />
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                            {formatTime(notification.createdAt)}
                        </span>

                        {notification.link && (
                            <Link href={notification.link} className="z-10">
                                <Button variant="link" size="sm" className="h-auto p-0 text-primary-600 hover:text-primary-700">
                                    View Details
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState({ filter }: { filter: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Inbox className="w-10 h-10 text-neutral-300" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
                {filter === 'ALL' ? 'No notifications yet' : 'No notifications found'}
            </h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
                {filter === 'UNREAD'
                    ? "You're all caught up! No unread messages."
                    : "We'll notify you when something important happens."
                }
            </p>
        </div>
    );
}

// Helpers

function groupNotificationsByDate(notifications: Notification[]) {
    const groups: Record<string, Notification[]> = {};

    notifications.forEach(notification => {
        const date = new Date(notification.createdAt);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        if (date.toDateString() === today.toDateString()) {
            key = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(notification);
    });

    return groups;
}

function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
