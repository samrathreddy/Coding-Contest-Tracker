import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingIndicator({ 
  size = 'md', 
  text = 'Loading more contests...' 
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
} 