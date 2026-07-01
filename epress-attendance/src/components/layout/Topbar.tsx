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
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border-light">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center gap-2 bg-background rounded-xl px-4 py-2 border border-border-light animate-fade-in">
              <Search className="w-4 h-4 text-text-secondary" />
              <input
                autoFocus
                placeholder="Search employees, attendance..."
                className="bg-transparent border-none outline-none text-sm text-text w-64 placeholder:text-muted/60"
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border-light text-text-secondary text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-text-secondary">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        <div ref={ref} className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-white dark:ring-gray-800" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-border-light rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border-light flex items-center justify-between">
                    <h3 className="font-semibold text-text text-sm font-heading">Notifications</h3>
                    <Link to="/notifications" className="text-xs text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="p-4 text-center text-sm text-text-secondary">
                    <p>No new notifications</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Avatar name={user?.name || 'Admin'} size="sm" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-text-secondary capitalize">{user?.role || 'admin'}</p>
              </div>
              <ChevronDown className="hidden md:block w-4 h-4 text-text-secondary" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 border border-border-light rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border-light">
                    <p className="text-sm font-medium text-text">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-text-secondary">{user?.email || 'admin@epress.com'}</p>
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/5 dark:hover:bg-danger/10 transition-colors"
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
    </header>
  );
}
