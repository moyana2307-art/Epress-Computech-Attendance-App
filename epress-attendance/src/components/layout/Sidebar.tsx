import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Fingerprint, LogIn, Building2,
  CalendarCheck, BarChart3, Calendar, Bell, UserCircle, Settings,
  ChevronLeft, Menu, X, ShieldCheck, Clock, Briefcase, MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const adminNavItems = [
  { section: 'Overview', items: [
    { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Analytics', icon: BarChart3, path: '/reports' },
    { label: 'Team Chat', icon: MessageCircle, path: '/chat' },
  ]},
  { section: 'Management', items: [
    { label: 'Employees', icon: Users, path: '/employees' },
    { label: 'Departments', icon: Building2, path: '/departments' },
    { label: 'Attendance', icon: Fingerprint, path: '/attendance' },
    { label: 'Leave Requests', icon: CalendarCheck, path: '/leaves' },
    { label: 'Shifts', icon: Clock, path: '/shifts' },
  ]},
  { section: 'Account', items: [
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Profile', icon: UserCircle, path: '/profile' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]},
];

const workerNavItems = [
  { section: 'Overview', items: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Calendar', icon: Calendar, path: '/calendar' },
    { label: 'Team Chat', icon: MessageCircle, path: '/chat' },
  ]},
  { section: 'Attendance', items: [
    { label: 'Check In / Out', icon: LogIn, path: '/check-in-out' },
    { label: 'My Attendance', icon: Fingerprint, path: '/attendance' },
    { label: 'Leave Requests', icon: CalendarCheck, path: '/leaves' },
    { label: 'My Shifts', icon: Clock, path: '/shifts' },
  ]},
  { section: 'Account', items: [
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Profile', icon: UserCircle, path: '/profile' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]},
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : workerNavItems;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm"
      >
        <Menu className="w-5 h-5 text-slate-700 dark:text-text" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-screen bg-white dark:bg-[#0A0F1D] border-r border-slate-200 dark:border-[#162240] flex flex-col transition-all duration-300 shadow-[0_0_1px_rgba(0,0,0,0.06),1px_0_2px_rgba(0,0,0,0.03)] dark:shadow-none',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex items-center h-16 px-4 border-b border-slate-200 dark:border-[#162240]', collapsed && 'justify-center')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-text font-heading">Epress</h1>
                <p className="text-[10px] text-slate-500 dark:text-text-secondary">Attendance System</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-card-hover"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-text" />
          </button>
        </div>

        <div className={cn('px-4 py-4 border-b border-slate-200 dark:border-[#162240]', collapsed && 'px-2')}>
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold font-heading shrink-0 ring-2 ring-blue-100 dark:ring-white/10">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-text truncate leading-tight">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-text-secondary capitalize">{user?.role || 'employee'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navItems.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-text-secondary/60 px-3 mb-2.5 font-semibold">
                  {section.section}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group',
                        active
                          ? 'bg-blue-50 dark:bg-primary text-blue-700 dark:text-white'
                          : 'text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-card-hover hover:text-slate-900 dark:hover:text-primary-light',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-secondary rounded-r-full" />
                      )}
                      <item.icon className={cn(
                        'w-4.5 h-4.5 shrink-0 transition-all duration-200',
                        active ? 'text-blue-600 dark:text-white' : 'text-slate-400 dark:text-text-secondary group-hover:text-slate-600 dark:group-hover:text-primary-light'
                      )} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-11 border-t border-slate-200 dark:border-[#162240] text-slate-400 dark:text-text-secondary/60 hover:text-slate-600 dark:hover:text-text-secondary hover:bg-slate-50 dark:hover:bg-card-hover transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  );
}
