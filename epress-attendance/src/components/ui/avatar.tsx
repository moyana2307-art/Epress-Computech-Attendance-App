import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-full flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden bg-linear-to-br from-primary to-primary-dark ring-2 ring-white/20 dark:ring-white/5',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-heading">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
);
Avatar.displayName = 'Avatar';

export { Avatar };
