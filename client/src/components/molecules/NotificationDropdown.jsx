import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../services/index';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Bell } from 'lucide-react';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user } = useAuth();
    const socket = useSocket();

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Optional: Play sound or show toast
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, { body: notification.message });
                }
            });

            return () => {
                socket.off('new_notification');
            };
        }
    }, [socket]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                notificationAPI.getNotifications(),
                notificationAPI.getUnreadCount()
            ]);
            setNotifications(listRes.data.notifications);
            setUnreadCount(countRes.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleOpenDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="relative p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleOpenDropdown}
                title="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background ring-1 ring-background"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        className={`p-3 text-sm hover:bg-accent/50 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                                        onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-destructive shadow-sm shadow-destructive/50' : 'bg-transparent'}`}></div>
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium leading-none">{notif.title}</p>
                                                <p className="text-muted-foreground line-clamp-2">{notif.message}</p>
                                                <p className="text-xs text-muted-foreground pt-1">
                                                    {format(new Date(notif.createdAt), 'MMM d, p')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
