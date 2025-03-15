import { useCallback, useEffect, useState } from 'react';
import { BookmarkedContest, Contest } from '@/utils/types';
import { BOOKMARKS_STORAGE_KEY } from '@/utils/constants';
import { toast } from '@/components/ui/use-toast';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (savedBookmarks) {
        setBookmarkedIds(JSON.parse(savedBookmarks));
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setIsInitialized(true);
    }
  }, []);
  
  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    // Only save after initial load to prevent overwriting
    if (isInitialized) {
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
      } catch (error) {
        console.error('Error saving bookmarks:', error);
      }
    }
  }, [bookmarkedIds, isInitialized]);
  
  // Toggle bookmark status of a contest
  const toggleBookmark = useCallback((contestId: string) => {
    setBookmarkedIds(prev => {
      // Create a new array to ensure state update
      const newBookmarks = prev.includes(contestId)
        ? prev.filter(id => id !== contestId) // Remove bookmark
        : [...prev, contestId]; // Add bookmark
      
      // Show toast notification
      toast({
        title: prev.includes(contestId) ? 'Removed from bookmarks' : 'Added to bookmarks',
        description: prev.includes(contestId) 
          ? 'Contest removed from your bookmarks' 
          : 'Contest added to your bookmarks',
        duration: 2000, // Shorter duration for better UX
      });
      
      return newBookmarks;
    });
  }, []);
  
  // Check if a contest is bookmarked
  const isBookmarked = useCallback((contestId: string) => {
    return bookmarkedIds.includes(contestId);
  }, [bookmarkedIds]);
  
  // Get all bookmarked contests
  const getBookmarkedContests = useCallback((contests: Contest[]): BookmarkedContest[] => {
    return contests
      .filter(contest => bookmarkedIds.includes(contest.id))
      .map(contest => ({
        ...contest,
        bookmarked: true
      }));
  }, [bookmarkedIds]);
  
  // Add bookmark status to all contests
  const addBookmarkStatus = useCallback((contests: Contest[]): BookmarkedContest[] => {
    return contests.map(contest => ({
      ...contest,
      bookmarked: bookmarkedIds.includes(contest.id)
    }));
  }, [bookmarkedIds]);
  
  return {
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    getBookmarkedContests,
    addBookmarkStatus,
    isInitialized
  };
}
