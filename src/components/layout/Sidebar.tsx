// @ts-nocheck
﻿// @ts-nocheck
'use client';

// ============================================
// Sidebar Component (Dashboard)
// ============================================

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Map as MapIcon,
  Calendar,
  Star,
  Bell,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/providers/AuthProvider';

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), href: '/dashboard' },
    { icon: Briefcase, label: t('services'), href: '/dashboard/services' },
    { icon: Calendar, label: t('bookings'), href: '/dashboard/bookings' },
    { icon: MapIcon, label: t('map'), href: '/map' },
    { icon: Users, label: 'Workers', href: '/dashboard/workers' },
    { icon: Star, label: 'Reviews', href: '/dashboard/reviews' },
    { icon: Bell, label: t('notifications'), href: '/dashboard/notifications' },
    { icon: Settings, label: t('settings'), href: '/dashboard/settings' },
  ];

  return (
    <motion.aside
      className="hidden md:flex flex-col bg-dark-950 border-r border-dark-800 sticky top-0 h-screen z-40 rtl:border-r-0 rtl:border-l shrink-0"
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-dark-800">
        <Link href="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow shrink-0">
            <span className="text-white font-display font-bold text-lg">RS</span>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, w: 0 }}
                animate={{ opacity: 1, w: 'auto' }}
                exit={{ opacity: 0, w: 0 }}
                className="text-xl font-display font-bold text-dark-50 tracking-tight"
              >
                RozgarSync
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Collapse Toggle Button (Floating) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-4 rtl:-right-auto rtl:-left-4 w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-brand-400 hover:border-brand-500/50 transition-colors z-50 shadow-sm"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 rtl:hidden" /> : <ChevronLeft className="w-4 h-4 rtl:hidden" />}
        {isCollapsed ? <ChevronLeft className="w-4 h-4 hidden rtl:block" /> : <ChevronRight className="w-4 h-4 hidden rtl:block" />}
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors relative group whitespace-nowrap overflow-hidden',
                  isActive ? 'bg-brand-500/10 text-brand-400' : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 rtl:left-auto rtl:right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full rtl:rounded-r-none rtl:rounded-l-full"
                  />
                )}
                <item.icon className={cn('w-5 h-5 shrink-0 transition-colors', isActive ? 'text-brand-500' : 'text-dark-400 group-hover:text-dark-300')} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-dark-800">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
          <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-dark-400" />
            )}
          </div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-medium text-dark-100 truncate">
                  {user?.displayName || 'Guest User'}
                </p>
                <p className="text-xs text-dark-400 truncate">
                  {user?.email || 'Not signed in'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isCollapsed && user && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => signOut()}
                className="p-2 text-dark-400 hover:text-red-400 transition-colors shrink-0"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

