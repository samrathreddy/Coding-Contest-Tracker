import { delay, SOLUTION_LINKS_KEY, showErrorToast } from './common';
import { Contest } from '../types';
import { smartMatchContestVideos } from '@/services/youtube';

// Add solution link to a contest
export async function addSolutionLink(contestId: string, solutionLink: string): Promise<boolean> {
  try {
    // In a real app, this would be a POST request to your backend API
    await delay(500);
    
    // Store solution links in localStorage
    const storedLinksJson = localStorage.getItem(SOLUTION_LINKS_KEY);
    const storedLinks = storedLinksJson ? JSON.parse(storedLinksJson) : {};
    
    // Add or update the solution link for this contest
    storedLinks[contestId] = solutionLink;
    
    // Save back to localStorage
    localStorage.setItem(SOLUTION_LINKS_KEY, JSON.stringify(storedLinks));
    
    console.log(`Solution link saved for contest ${contestId}: ${solutionLink}`);
    return true;
  } catch (error) {
    console.error('Error adding solution link:', error);
    showErrorToast('Failed to add solution link. Please try again later.');
    return false;
  }
}

// Get all saved solution links
export function getSavedSolutionLinks(): Record<string, string> {
  try {
    const storedLinksJson = localStorage.getItem(SOLUTION_LINKS_KEY);
    return storedLinksJson ? JSON.parse(storedLinksJson) : {};
  } catch (error) {
    console.error('Error getting saved solution links:', error);
    return {};
  }
}

// Remove a solution link
export async function removeSolutionLink(contestId: string): Promise<boolean> {
  try {
    // In a real app, this would be a DELETE request to your backend API
    await delay(300);
    
    // Get existing solution links
    const storedLinksJson = localStorage.getItem(SOLUTION_LINKS_KEY);
    const storedLinks = storedLinksJson ? JSON.parse(storedLinksJson) : {};
    
    // Remove the solution link for this contest if it exists
    if (storedLinks[contestId]) {
      delete storedLinks[contestId];
      
      // Save back to localStorage
      localStorage.setItem(SOLUTION_LINKS_KEY, JSON.stringify(storedLinks));
      console.log(`Solution link removed for contest ${contestId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing solution link:', error);
    showErrorToast('Failed to remove solution link. Please try again later.');
    return false;
  }
}

// Perform smart matching and save the results
export async function performSmartMatching(contests: Contest[]): Promise<{
  stats: Record<string, any>;
  totalMatched: number;
  totalContests: number;
  totalSkipped: number;
}> {
  try {
    // Get existing manual links
    const manualLinks = getSavedSolutionLinks();
    
    // Execute smart matching
    const { resultMap: smartMatchedLinks, stats } = await smartMatchContestVideos(contests);
    
    // Combine links, prioritizing manual links
    // This way we don't overwrite user's manual associations
    const combinedLinks = { ...smartMatchedLinks, ...manualLinks };
    
    // Save to localStorage
    localStorage.setItem(SOLUTION_LINKS_KEY, JSON.stringify(combinedLinks));
    
    // Reload contests to show new matches
    // This is important since we need to refresh the UI state
    
    return {
      stats,
      totalMatched: stats.matched,
      totalContests: stats.total,
      totalSkipped: stats.skipped || 0
    };
  } catch (error) {
    console.error('Error performing smart matching:', error);
    return {
      stats: { error: error.message },
      totalMatched: 0,
      totalContests: contests.length,
      totalSkipped: 0
    };
  }
} 