import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Fingerprint, LogIn, Building2,
  CalendarCheck, BarChart3, Calendar, Bell, UserCircle, Settings,
  ChevronLeft, Menu, X, ShieldCheck, Clock, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const adminNavItems = [
  { section: 'Overview', items: [
    { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Analytics', icon: BarChart3, path: '/reports' },
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
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-xl bg-card dark:bg-gray-800 border border-border-light shadow-sm"
      >
        <Menu className="w-5 h-5 text-text" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-screen bg-card dark:bg-gray-950 border-r border-border-light dark:border-gray-800 flex flex-col transition-all duration-300 shadow-sm dark:shadow-none',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex items-center h-16 px-4 border-b border-border-light dark:border-gray-800', collapsed && 'justify-center')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold text-text font-heading">Epress</h1>
                <p className="text-[10px] text-text-secondary">Attendance System</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-1 rounded-lg hover:bg-primary/5 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={cn('px-4 py-3 border-b border-border-light dark:border-gray-800', collapsed && 'px-2')}>
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold font-heading shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-text truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-text-secondary capitalize">{user?.role || 'employee'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navItems.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-widest text-text-secondary/60 px-3 mb-2 font-semibold">
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
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                        active
                          ? 'bg-primary text-white shadow-sm shadow-primary/20'
                          : 'text-text-secondary hover:text-primary hover:bg-primary/5 dark:hover:bg-gray-800/50',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
                      <item.icon className="w-4.5 h-4.5 shrink-0" />
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
          className="hidden lg:flex items-center justify-center h-12 border-t border-border-light dark:border-gray-800 text-text-secondary/60 hover:text-text-secondary transition-colors"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  );
}
