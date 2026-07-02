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
      className="relative overflow-hidden rounded-xl bg-card border border-border-light/60 dark:border-border/50 card-shadow card-shadow-hover transition-all duration-300 group dark:hover:border-primary/20 dark:hover:shadow-primary/5"
    >
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] dark:opacity-[0.05] rounded-full -translate-y-1/2 translate-x-1/2 bg-primary" />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2.5 rounded-xl', color)}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend.positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            )}>
              <span className="text-[10px]">{trend.positive ? '▲' : '▼'}</span> {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-text-secondary tracking-wide">{label}</p>
          <p className="text-xl font-bold text-text mt-0.5 font-heading tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}
