import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-primary-soft text-primary-deep',
        pending: 'bg-warn-bg text-warn',
        approved: 'bg-ok-bg text-ok',
        rejected: 'bg-bad-bg text-bad',
        violet: 'bg-violet-bg text-violet',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
