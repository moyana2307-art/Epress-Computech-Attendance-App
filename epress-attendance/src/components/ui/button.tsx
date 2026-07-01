import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25',
  secondary: 'bg-secondary text-primary hover:bg-secondary-dark shadow-sm shadow-secondary/20 hover:shadow-md hover:shadow-secondary/25',
  outline: 'border-2 border-border bg-white dark:bg-gray-800 hover:bg-background text-text hover:border-primary/30',
  ghost: 'hover:bg-primary/5 dark:hover:bg-gray-800 text-text-secondary hover:text-text',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/20 hover:shadow-md hover:shadow-danger/25',
  success: 'bg-success text-white hover:bg-success/90 shadow-sm shadow-success/20 hover:shadow-md hover:shadow-success/25',
  warning: 'bg-warning text-white hover:bg-warning/90 shadow-sm shadow-warning/20 hover:shadow-md hover:shadow-warning/25',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
  xl: 'h-14 px-8 text-lg rounded-xl',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
