import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Calendar,
  MessageSquare,
  CreditCard,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type NotificationItem,
  type NotificationType,
} from '../services/api';

interface NotificationBellProps {
  onNavigate?: (route: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.debug('Notification load error:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, linkUrl?: string) => {
    await markNotificationReadApi(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (linkUrl && onNavigate) {
      setIsOpen(false);
      if (linkUrl === '/my-space') onNavigate('myspace');
      else if (linkUrl === '/dashboard') onNavigate('dashboard');
      else if (linkUrl === '/discover') onNavigate('discover');
      else if (linkUrl.startsWith('/course/')) onNavigate('course');
      else if (linkUrl.startsWith('/creator/')) onNavigate('creator');
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsReadApi();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_NEW':
        return <Calendar className="w-4 h-4 text-[#6E8B6F]" />;
      case 'MESSAGE_RECEIVED':
        return <MessageSquare className="w-4 h-4 text-[#B8703F]" />;
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'COURSE_PUBLISHED':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'VERIFICATION_APPROVED':
        return <ShieldCheck className="w-4 h-4 text-[#6E8B6F]" />;
      case 'VERIFICATION_REJECTED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#B8703F]" />;
    }
  };

  const filteredList =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#F7F4EF]/80 hover:text-white transition-all cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F]"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4 text-[#F7F4EF]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#B8703F] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#16171A] border border-white/15 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/[0.08] bg-[#121315] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B8703F]/20 text-[#B8703F] border border-[#B8703F]/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-[#B8703F] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-white/[0.06] bg-[#121315]/50 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-[#B8703F]/20 text-[#B8703F] font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification List Body */}
            <div className="overflow-y-auto divide-y divide-white/[0.04] max-h-[380px]">
              {filteredList.length > 0 ? (
                filteredList.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.linkUrl)}
                    className={`p-4 transition-colors cursor-pointer flex items-start gap-3 hover:bg-white/[0.04] ${
                      !notif.isRead ? 'bg-[#B8703F]/[0.04]' : ''
                    }`}
                  >
                    {/* Icon Column */}
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content Column */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs font-semibold leading-tight line-clamp-1 ${
                            !notif.isRead ? 'text-white font-bold' : 'text-[#F7F4EF]/80'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#B8703F] shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-[11px] text-[#F7F4EF]/60 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 font-mono">
                        <span>{notif.createdAt}</span>
                        {notif.emailSent && (
                          <span className="text-[#6E8B6F] text-[9px]">✓ Email sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 px-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] text-white/40 mx-auto flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-white/60">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
