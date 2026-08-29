import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-800 text-zinc-200',
        revenge: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
        sl: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
        news: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
        leverage: 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
