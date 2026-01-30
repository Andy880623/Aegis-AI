import { cn } from '@/lib/utils';
import type { FeatureStage } from '@/types/governance';

interface StageBadgeProps {
  stage: FeatureStage;
  size?: 'sm' | 'default';
  className?: string;
}

export function StageBadge({ stage, size = 'default', className }: StageBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-0.5 text-sm',
  };

  const stageClasses = {
    'Idea': 'bg-purple-100 text-stage-idea border-purple-200',
    'In Development': 'bg-blue-100 text-stage-dev border-blue-200',
    'Beta': 'bg-amber-100 text-stage-beta border-amber-200',
    'Live': 'bg-green-100 text-stage-live border-green-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        sizeClasses[size],
        stageClasses[stage],
        className
      )}
    >
      {stage}
    </span>
  );
}
