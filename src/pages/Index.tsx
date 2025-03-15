import { useCallback, useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { FilterBar } from '@/components/FilterBar';
import { ContestCard } from '@/components/ContestCard';
import { EmptyState } from '@/components/EmptyState';
import { FilterOptions, Platform } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, BookmarkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useInfiniteContests } from '@/hooks/useInfiniteContests';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { LoadingIndicator } from '@/components/LoadingIndicator';

const Index = () => {
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    platforms: ['codeforces', 'codechef', 'leetcode'],
    status: 'all',
    bookmarked: false
  });
  
  // Get contests with infinite loading
  const {
    contests,
    isLoading,
    error,
    hasMore,
    loadMore,
    toggleBookmark,
    refresh: refreshContests
  } = useInfiniteContests(filters);
  
  // Local state for refreshing indicator and sidebar visibility
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Infinite scroll observation
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px', // Load more when user is 200px away from the bottom
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Load more contests when intersection observer triggers
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);
  
  // Toggle platform filter
  const togglePlatformFilter = useCallback((platform: Platform) => {
    setFilters(prev => {
      const currentPlatforms = [...prev.platforms];
      const index = currentPlatforms.indexOf(platform);
      
      if (index !== -1) {
        // Don't allow removing the last platform
        if (currentPlatforms.length === 1) {
          return prev;
        }
        currentPlatforms.splice(index, 1);
      } else {
        currentPlatforms.push(platform);
      }
      
      return { ...prev, platforms: currentPlatforms };
    });
  }, []);
  
  // Set status filter
  const setStatusFilter = useCallback((status: 'upcoming' | 'ongoing' | 'past' | 'all') => {
    setFilters(prev => ({ ...prev, status }));
  }, []);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Toggle bookmarked filter
  const toggleBookmarkedFilter = useCallback(() => {
    setFilters(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      platforms: ['codeforces', 'codechef', 'leetcode'],
      status: 'all',
      bookmarked: false
    });
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshContests();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [refreshContests]);
  
  // Get bookmarked contests count
  const bookmarkedCount = contests.filter(contest => contest.bookmarked).length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile filter toggle */}
          <div className="md:hidden mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {filters.bookmarked
                ? "Bookmarked Contests"
                : filters.status !== 'all'
                  ? `${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)} Contests`
                  : "All Contests"}
            </h1>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1" 
              onClick={() => setSidebarVisible(!sidebarVisible)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
          
          {/* Sidebar with filters */}
          <div className={`md:w-72 flex-shrink-0 ${sidebarVisible ? 'block' : 'hidden md:block'}`}>
            <div className="sticky top-24 space-y-4 bg-background p-4 rounded-lg border shadow-sm">
              <h2 className="font-semibold mb-4">Filter Contests</h2>
              <FilterBar
                filters={filters}
                updateFilters={updateFilters}
                togglePlatformFilter={togglePlatformFilter}
                setStatusFilter={setStatusFilter}
                toggleBookmarkedFilter={toggleBookmarkedFilter}
              />
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={clearFilters}
                  disabled={
                    filters.platforms.length === 3 && 
                    filters.status === 'all' && 
                    !filters.bookmarked
                  }
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold hidden md:block">
                {filters.bookmarked
                  ? "Bookmarked Contests"
                  : filters.status !== 'all'
                    ? `${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)} Contests`
                    : "All Contests"}
              </h1>
              
              {filters.bookmarked && (
                <div className="hidden md:flex items-center gap-2">
                  <BookmarkIcon className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{bookmarkedCount} bookmarked {bookmarkedCount === 1 ? 'contest' : 'contests'}</span>
                </div>
              )}
            </div>
            
            {isLoading && contests.length === 0 ? (
              <EmptyState type="loading" />
            ) : contests.length === 0 ? (
              <EmptyState 
                type={
                  filters.bookmarked 
                    ? "no-bookmarks" 
                    : filters.platforms.length < 3 || filters.status !== 'all'
                      ? "no-results"
                      : "no-contests"
                }
                onClearFilters={
                  filters.platforms.length < 3 || filters.status !== 'all' || filters.bookmarked
                    ? clearFilters
                    : undefined
                }
              />
            ) : (
              <div className="space-y-8">
                {/* Group and order contests by status: ongoing → upcoming → past */}
                {/* 1. Ongoing contests (if present) */}
                {contests.some(c => c.status === 'ongoing') && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold capitalize">Ongoing Contests</h2>
                      <Badge>
                        {contests.filter(contest => contest.status === 'ongoing').length}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contests
                        .filter(contest => contest.status === 'ongoing')
                        .map((contest) => (
                          <div 
                            key={contest.id}
                            className="fade-in"
                          >
                            <ContestCard
                              contest={contest}
                              onToggleBookmark={() => toggleBookmark(contest.id)}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* 2. Upcoming contests */}
                {contests.some(c => c.status === 'upcoming') && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold capitalize">Upcoming Contests</h2>
                      <Badge>
                        {contests.filter(contest => contest.status === 'upcoming').length}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contests
                        .filter(contest => contest.status === 'upcoming')
                        .map((contest) => (
                          <div 
                            key={contest.id}
                            className="fade-in"
                          >
                            <ContestCard
                              contest={contest}
                              onToggleBookmark={() => toggleBookmark(contest.id)}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* 3. Past contests (sorted by date, newest first) */}
                {contests.some(c => c.status === 'past') && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold capitalize">Past Contests</h2>
                      <Badge>
                        {contests.filter(contest => contest.status === 'past').length}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contests
                        .filter(contest => contest.status === 'past')
                        .map((contest) => (
                          <div 
                            key={contest.id}
                            className="fade-in"
                          >
                            <ContestCard
                              contest={contest}
                              onToggleBookmark={() => toggleBookmark(contest.id)}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Load more indicator */}
                {hasMore && (
                  <div ref={loadMoreRef} className="mt-4 w-full">
                    {isLoading ? (
                      <LoadingIndicator />
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={loadMore}
                      >
                        Load More Contests
                      </Button>
                    )}
                  </div>
                )}
                
                {!hasMore && contests.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No more contests to load
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="rounded-md bg-red-50 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
