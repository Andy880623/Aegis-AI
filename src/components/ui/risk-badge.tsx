import { cn } from '@/lib/utils';
import type { RiskTier } from '@/types/governance';

interface RiskBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function RiskBadge({ tier, size = 'default', className }: RiskBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base font-semibold',
  };

  const tierClasses = {
    Low: 'bg-risk-low-bg text-risk-low border-risk-low-border',
    Medium: 'bg-risk-medium-bg text-risk-medium border-risk-medium-border',
    High: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeClasses[size],
        tierClasses[tier],
        className
      )}
    >
      {tier}
    </span>
  );
}
