import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  color: string;
  delay?: number;
  subtitle?: string;
}

export function StatsCard({ icon, label, value, trend, color, delay = 0, subtitle }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-border-light p-5 hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl', color)}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend.positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-text mt-0.5 font-heading">{value}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
