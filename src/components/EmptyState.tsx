import { Button } from '@/components/ui/button';
import { BookmarkIcon, Filter, RefreshCw, Search } from 'lucide-react';

type EmptyStateType = 'loading' | 'no-contests' | 'no-results' | 'no-bookmarks';

interface EmptyStateProps {
  type: EmptyStateType;
  onClearFilters?: () => void;
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="animate-spin mb-4">
          <RefreshCw className="h-10 w-10 text-primary/70" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Loading contests...</h3>
        <p className="text-muted-foreground max-w-md">
          We're fetching the latest contest information from all platforms.
        </p>
      </div>
    );
  }

  if (type === 'no-bookmarks') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 p-4 rounded-full bg-muted">
          <BookmarkIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No bookmarked contests</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't bookmarked any contests yet. Click the bookmark icon on contests you're interested in to save them here.
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Show All Contests
          </Button>
        )}
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 p-4 rounded-full bg-muted">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No contests found</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          No contests match your current filters. Try adjusting your filter criteria to see more contests.
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  // Default: no-contests
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 p-4 rounded-full bg-muted">
        <Search className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No contests available</h3>
      <p className="text-muted-foreground max-w-md">
        There are currently no contests available. Check back later for upcoming contests.
      </p>
    </div>
  );
}
