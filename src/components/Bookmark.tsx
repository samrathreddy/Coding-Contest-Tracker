import { useState } from 'react';
import { BookmarkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BookmarkProps {
  isBookmarked: boolean;
  onToggle: (e?: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function Bookmark({ isBookmarked, onToggle, size = 'md' }: BookmarkProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleToggle = (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    onToggle(e);
    
    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 300);
  };

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];
  
  const buttonSize = size === 'sm' ? 'size="sm"' : '';
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "p-1 hover:bg-transparent",
        isAnimating && "animate-pulse-light"
      )}
      onClick={handleToggle}
      type="button"
    >
      <BookmarkIcon
        className={cn(
          iconSize,
          "transition-all duration-300 ease-in-out transform",
          isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
          isAnimating && (isBookmarked ? "scale-110" : "scale-90")
        )}
      />
      <span className="sr-only">
        {isBookmarked ? "Remove bookmark" : "Add bookmark"}
      </span>
    </Button>
  );
}
