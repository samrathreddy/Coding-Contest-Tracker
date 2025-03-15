// Export all API functions and utilities
import { fetchCodeforcesContests } from './codeforces';
import { fetchCodechefContests } from './codechef';
import { fetchLeetcodeContests } from './leetcode';
import { fetchYouTubeVideos, findProblemSolution } from './youtube';
import { addSolutionLink, getSavedSolutionLinks, removeSolutionLink, performSmartMatching } from './solutions';
import { Contest } from '../types';
import { YOUTUBE_PLAYLISTS } from '../constants';
import { smartMatchContestVideos } from '@/services/youtube';

// Re-export all functions
export {
  fetchCodeforcesContests,
  fetchCodechefContests,
  fetchLeetcodeContests,
  fetchYouTubeVideos,
  findProblemSolution,
  addSolutionLink,
  getSavedSolutionLinks,
  removeSolutionLink,
  performSmartMatching
};

// Fetch all contests
export async function fetchAllContests(): Promise<Contest[]> {
  const [codeforces, codechef, leetcode] = await Promise.all([
    fetchCodeforcesContests(),
    fetchCodechefContests(),
    fetchLeetcodeContests()
  ]);
  
  // Combine all contests
  const allContests = [...codeforces, ...codechef, ...leetcode];
  
  try {
    // Only load manually saved solution links, don't do smart matching here
    const solutionLinks = getSavedSolutionLinks();
    
    // Add solution links to contests
    return allContests.map(contest => {
      if (solutionLinks[contest.id]) {
        return {
          ...contest,
          solutionLink: solutionLinks[contest.id]
        };
      }
      
      // If no specific solution link found, assign the platform's general playlist URL
      // as a fallback for unmatched contests
      return {
        ...contest,
        solutionLink: YOUTUBE_PLAYLISTS[contest.platform] || null
      };
    });
  } catch (error) {
    console.error('Error applying solution links:', error);
    // If something goes wrong, just return contests without solution links
    return allContests;
  }
} 