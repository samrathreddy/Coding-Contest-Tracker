import { useState, useEffect, useRef, useCallback } from 'react';
import { BookmarkedContest, FilterOptions, Platform } from '@/utils/types';
import { fetchAllContests } from '@/utils/api';
import { BOOKMARKS_STORAGE_KEY } from '@/utils/constants';

const ITEMS_PER_PAGE = 12; // Number of contests to load each time

// Status priority order for sorting
const STATUS_PRIORITY = {
  ongoing: 0,
  upcoming: 1,
  past: 2
};

// Helper function to sort contests within each status group
function sortContestsByDate(contests: BookmarkedContest[]): BookmarkedContest[] {
  // First, separate contests by status
  const ongoing = contests.filter(c => c.status === 'ongoing');
  const upcoming = contests.filter(c => c.status === 'upcoming');
  const past = contests.filter(c => c.status === 'past');
  
  // Sort ongoing by end time (ascending - soonest ending first)
  ongoing.sort((a, b) => 
    new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
  );
  
  // Sort upcoming by start time (ascending - soonest starting first)
  upcoming.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  // Sort past by start time (descending - newest first)
  past.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  
  // Combine all contests in the correct order
  return [...ongoing, ...upcoming, ...past];
}

export function useInfiniteContests(filterOptions: FilterOptions) {
  const [allContests, setAllContests] = useState<BookmarkedContest[]>([]);
  const [visibleContests, setVisibleContests] = useState<BookmarkedContest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const isFirstLoad = useRef(true);
  
  // Load all contests from the API
  const loadAllContests = useCallback(async () => {
    if (!isFirstLoad.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const contests = await fetchAllContests();
      
      // Get bookmarks from localStorage
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const bookmarkedIds = storedBookmarks ? JSON.parse(storedBookmarks) : [];
      
      // Add bookmark status to contests
      const bookmarkedContests = contests.map(contest => ({
        ...contest,
        bookmarked: bookmarkedIds.includes(contest.id)
      }));
      
      // Apply sorting by status priority and date within each status
      const sortedContests = sortContestsByDate(bookmarkedContests);
      
      setAllContests(sortedContests);
      isFirstLoad.current = false;
    } catch (err) {
      console.error('Failed to fetch contests:', err);
      setError('Failed to load contests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Apply filters and pagination to contests
  useEffect(() => {
    // Skip if contests haven't been loaded yet
    if (allContests.length === 0) return;
    
    // Apply filters
    let filtered = [...allContests];
    
    // Filter by platforms
    if (filterOptions.platforms.length > 0) {
      filtered = filtered.filter(contest => 
        filterOptions.platforms.includes(contest.platform as Platform)
      );
    }
    
    // Filter by status
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(contest => contest.status === filterOptions.status);
      
      // Sort by date within the selected status
      if (filterOptions.status === 'past') {
        // Sort past contests by start time (newest first)
        filtered.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      } else if (filterOptions.status === 'upcoming') {
        // Sort upcoming contests by start time (soonest first)
        filtered.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      } else if (filterOptions.status === 'ongoing') {
        // Sort ongoing contests by end time (soonest ending first)
        filtered.sort((a, b) => 
          new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
        );
      }
    } else {
      // For "all" status, use our helper function to sort properly
      filtered = sortContestsByDate(filtered);
    }
    
    // Filter bookmarked
    if (filterOptions.bookmarked) {
      filtered = filtered.filter(contest => contest.bookmarked);
    }
    
    // Calculate if there are more items to load
    const totalFilteredItems = filtered.length;
    const currentlyLoadedItems = ITEMS_PER_PAGE * page;
    setHasMore(currentlyLoadedItems < totalFilteredItems);
    
    // Apply pagination - only show items up to the current page
    const paginatedContests = filtered.slice(0, currentlyLoadedItems);
    setVisibleContests(paginatedContests);
    
  }, [allContests, filterOptions, page]);
  
  // Load initial contests
  useEffect(() => {
    loadAllContests();
  }, [loadAllContests]);
  
  // Function to toggle bookmark status
  const toggleBookmark = useCallback((contestId: string) => {
    setAllContests(prevContests => {
      const updated = prevContests.map(contest => {
        if (contest.id === contestId) {
          return { ...contest, bookmarked: !contest.bookmarked };
        }
        return contest;
      });
      
      // Update localStorage
      const bookmarkedIds = updated
        .filter(contest => contest.bookmarked)
        .map(contest => contest.id);
      
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
      
      // Apply sorting to maintain order
      return sortContestsByDate(updated);
    });
  }, []);
  
  // Function to load more contests
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [isLoading, hasMore]);
  
  return {
    contests: visibleContests,
    isLoading,
    error,
    hasMore,
    loadMore,
    toggleBookmark,
    refresh: loadAllContests
  };
} 