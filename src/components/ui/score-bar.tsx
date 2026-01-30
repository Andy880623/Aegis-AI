import { cn } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  className?: string;
}

export function ScoreBar({ label, score, maxScore = 5, className }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;
  
  const getColorClass = (score: number) => {
    if (score <= 1) return 'bg-risk-low';
    if (score <= 3) return 'bg-risk-medium';
    return 'bg-risk-high';
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{score}/{maxScore}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getColorClass(score))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
