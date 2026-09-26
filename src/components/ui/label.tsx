import * as React from 'react';
import { cn } from '../../lib/utils';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('grid gap-1.5 text-[13px] font-semibold text-muted', className)} {...props} />
  )
);
Label.displayName = 'Label';

export { Label };
