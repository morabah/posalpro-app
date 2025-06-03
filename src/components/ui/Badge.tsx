/**
 * Badge Component
 * 
 * A simple badge component that follows our component composition pattern.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
        success: "bg-green-500 text-white hover:bg-green-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Optional visual indicator that the badge is active
   */
  active?: boolean;
  /**
   * The visual style of the badge
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

/**
 * Badge component for displaying status indicators or labels
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, active, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant }),
          active && "ring-2 ring-ring ring-offset-1",
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
