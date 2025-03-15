import { useState, useEffect, useCallback } from 'react';
import { Contest, FilterOptions, Platform } from '@/utils/types';
import { fetchAllContests } from '@/utils/api';
import { REFRESH_INTERVAL, BOOKMARKS_STORAGE_KEY } from '@/utils/constants';
import { toast } from '@/components/ui/use-toast';

export function useContests(initialFilters?: Partial<FilterOptions>) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    platforms: ['codeforces', 'codechef', 'leetcode'],
    status: 'all',
    bookmarked: false,
    ...(initialFilters || {})
  });

  // Fetch contests
  const fetchContests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllContests();
      setContests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contests'));
      toast({
        title: 'Error',
        description: 'Failed to fetch contests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    if (!contests) return;

    let filtered = [...contests];

    // Filter by platform
    if (filters.platforms.length > 0 && filters.platforms.length < 3) {
      filtered = filtered.filter(contest => filters.platforms.includes(contest.platform));
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(contest => contest.status === filters.status);
    }

    // Filter by bookmarks if bookmarked filter is enabled
    if (filters.bookmarked) {
      try {
        const savedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (savedBookmarks) {
          const bookmarkedIds = JSON.parse(savedBookmarks);
          filtered = filtered.filter(contest => bookmarkedIds.includes(contest.id));
        } else {
          // If no bookmarks found, return empty array when bookmarked filter is on
          filtered = [];
        }
      } catch (error) {
        console.error('Error filtering bookmarked contests:', error);
        // In case of error, don't filter by bookmarks
      }
    }

    // Sort contests: upcoming first (by start time), then ongoing, then past (by end time, most recent first)
    filtered.sort((a, b) => {
      // Different status groups
      if (a.status !== b.status) {
        const statusOrder = { upcoming: 0, ongoing: 1, past: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // Within the same status group
      if (a.status === 'upcoming' || a.status === 'ongoing') {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      } else {
        // Past contests, most recent first
        return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
      }
    });

    setFilteredContests(filtered);
  }, [contests, filters]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchContests();
    
    const intervalId = setInterval(() => {
      fetchContests();
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchContests]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Toggle platform filter
  const togglePlatformFilter = useCallback((platform: Platform) => {
    setFilters(prev => {
      const currentPlatforms = [...prev.platforms];
      
      if (currentPlatforms.includes(platform)) {
        // Remove platform if it's already selected
        const filtered = currentPlatforms.filter(p => p !== platform);
        return {
          ...prev,
          platforms: filtered.length === 0 ? ['codeforces', 'codechef', 'leetcode'] : filtered
        };
      } else {
        // Add platform if it's not selected
        return {
          ...prev,
          platforms: [...currentPlatforms, platform]
        };
      }
    });
  }, []);

  // Set status filter
  const setStatusFilter = useCallback((status: FilterOptions['status']) => {
    setFilters(prev => ({
      ...prev,
      status
    }));
  }, []);

  return {
    contests: filteredContests,
    allContests: contests,
    isLoading,
    error,
    filters,
    updateFilters,
    togglePlatformFilter,
    setStatusFilter,
    refreshContests: fetchContests
  };
}
