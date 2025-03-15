
import { useCallback } from 'react';
import { Platform, FilterOptions } from '@/utils/types';
import { PLATFORMS } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: FilterOptions;
  updateFilters: (filters: Partial<FilterOptions>) => void;
  togglePlatformFilter: (platform: Platform) => void;
  setStatusFilter: (status: FilterOptions['status']) => void;
  toggleBookmarkedFilter: () => void;
}

export function FilterBar({
  filters,
  updateFilters,
  togglePlatformFilter,
  setStatusFilter,
  toggleBookmarkedFilter
}: FilterBarProps) {
  // Clear all filters
  const clearFilters = useCallback(() => {
    updateFilters({
      platforms: ['codeforces', 'codechef', 'leetcode'],
      status: 'all',
      bookmarked: false
    });
  }, [updateFilters]);
  
  const platformsList: Platform[] = ['codeforces', 'codechef', 'leetcode'];
  const statusOptions: { value: FilterOptions['status']; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'past', label: 'Past' }
  ];
  
  const hasActiveFilters = 
    filters.platforms.length < 3 || 
    filters.status !== 'all' || 
    filters.bookmarked;
  
  return (
    <div className="w-full space-y-4 rounded-lg p-4 bg-secondary/50 backdrop-blur-xs border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Filters</h3>
        </div>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Platform filters */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Platforms</h4>
          <div className="flex flex-wrap gap-2">
            {platformsList.map(platform => (
              <Badge
                key={platform}
                variant={filters.platforms.includes(platform) ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer capitalize transition-all",
                  filters.platforms.includes(platform) && (
                    platform === 'codeforces' ? 'bg-codeforces hover:bg-codeforces/90' :
                    platform === 'codechef' ? 'bg-codechef hover:bg-codechef/90' :
                    'bg-leetcode hover:bg-leetcode/90'
                  )
                )}
                onClick={() => togglePlatformFilter(platform)}
              >
                {PLATFORMS[platform].name}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Status filters */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Status</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <Badge
                key={option.value}
                variant={filters.status === option.value ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Bookmarked filter */}
        <div className="pt-1">
          <Button
            variant={filters.bookmarked ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={toggleBookmarkedFilter}
          >
            <BookmarkIcon className={cn(
              "h-4 w-4",
              filters.bookmarked && "fill-primary-foreground"
            )} />
            Bookmarked Only
          </Button>
        </div>
      </div>
    </div>
  );
}
