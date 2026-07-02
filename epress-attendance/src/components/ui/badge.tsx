import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary-lighter text-text-secondary dark:bg-card-hover dark:text-text-secondary dark:border dark:border-border/50',
  success: 'bg-success/10 text-success border border-success/15 dark:border-success/20 dark:bg-success/8',
  warning: 'bg-warning/10 text-warning border border-warning/15 dark:border-warning/20 dark:bg-warning/8',
  danger: 'bg-danger/10 text-danger border border-danger/15 dark:border-danger/20 dark:bg-danger/8',
  primary: 'bg-primary/10 text-primary border border-primary/15 dark:border-primary/25 dark:bg-primary/15',
  secondary: 'bg-secondary/10 text-primary border border-secondary/20 dark:text-primary-light dark:border-secondary/25 dark:bg-secondary/10',
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };
