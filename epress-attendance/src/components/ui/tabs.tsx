import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode; content: ReactNode }[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-1 p-1 bg-background dark:bg-gray-800 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              active === tab.id
                ? 'text-white'
                : 'text-text-secondary hover:text-text'
            )}
          >
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 bg-primary rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tabs.map((tab) =>
          tab.id === active ? (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab.content}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}
