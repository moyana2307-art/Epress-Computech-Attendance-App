import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Moon, Sun, LogOut, UserCircle, Settings as SettingsIcon,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-[#0A0F1D]/80 border-b border-slate-200 dark:border-[#162240]">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center gap-2 bg-white dark:bg-card rounded-xl px-4 py-2 border border-slate-300 dark:border-border shadow-sm animate-fade-in">
              <Search className="w-4 h-4 text-slate-500 dark:text-text-secondary/60" />
              <input
                autoFocus
                placeholder="Search and navigate..."
                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-text w-64 placeholder:text-slate-500 dark:placeholder:text-text-secondary"
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-card border border-slate-300 dark:border-border text-slate-600 dark:text-text-secondary text-sm hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-card-hover dark:hover:border-primary/30 transition-all duration-200 shadow-sm"
            >
              <Search className="w-4 h-4 text-slate-500 dark:text-text-secondary" />
              <span className="hidden sm:inline text-slate-600 dark:text-text-secondary">Search and navigate...</span>
              <kbd className="hidden sm:inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-text-secondary/60 font-mono">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        <div ref={ref} className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-card-hover text-slate-500 dark:text-text-secondary hover:text-slate-700 dark:hover:text-secondary transition-all duration-200"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-card-hover text-slate-500 dark:text-text-secondary hover:text-slate-700 dark:hover:text-secondary transition-all duration-200"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0A0F1D] animate-pulse-soft" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 top-12 w-80 bg-white dark:bg-[#0D1425] border border-slate-200 dark:border-[#162240] rounded-xl dropdown-shadow overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-[#162240] flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-text text-sm font-heading">Notifications</h3>
                    <Link to="/notifications" className="text-xs font-medium text-blue-600 dark:text-secondary hover:text-blue-700 dark:hover:text-secondary transition-colors">
                      View all
                    </Link>
                  </div>
                  <div className="p-4 text-center text-sm text-slate-500 dark:text-text-secondary">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-300 dark:text-text-secondary" />
                    <p>No new notifications</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5 pl-1.5 ml-1.5 border-l border-slate-200 dark:border-[#162240]">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-card-hover transition-all duration-200"
              >
                <Avatar name={user?.name || 'Admin'} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-text leading-tight">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-text-secondary capitalize">{user?.role || 'admin'}</p>
                </div>
                <ChevronDown className={cn('hidden md:block w-4 h-4 text-slate-400 dark:text-text-secondary/60 transition-transform duration-200', profileOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 top-12 w-56 bg-white dark:bg-[#0D1425] border border-slate-200 dark:border-[#162240] rounded-xl dropdown-shadow overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-[#162240]">
                      <p className="text-sm font-medium text-slate-900 dark:text-text">{user?.name || 'Admin User'}</p>
                      <p className="text-xs text-slate-500 dark:text-text-secondary">{user?.email || 'admin@epress.com'}</p>
                    </div>
                    <div className="p-2">
                      {[
                        { label: 'Profile', icon: UserCircle, path: '/profile' },
                        { label: 'Settings', icon: SettingsIcon, path: '/settings' },
                      ].map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-secondary hover:bg-slate-100 dark:hover:bg-card-hover transition-all duration-200"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-danger hover:bg-red-50 dark:hover:bg-danger/10 transition-all duration-200 mt-0.5"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
