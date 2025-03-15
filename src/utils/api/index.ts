// Export all API functions and utilities
import { fetchCodeforcesContests } from './codeforces';
import { fetchCodechefContests } from './codechef';
import { fetchLeetcodeContests } from './leetcode';
import { fetchYouTubeVideos, findProblemSolution } from './youtube';
import { addSolutionLink, getSavedSolutionLinks, removeSolutionLink } from './solutions';
import { Contest } from '../types';

// Re-export all functions
export {
  fetchCodeforcesContests,
  fetchCodechefContests,
  fetchLeetcodeContests,
  fetchYouTubeVideos,
  findProblemSolution,
  addSolutionLink,
  getSavedSolutionLinks,
  removeSolutionLink
};

// Fetch all contests
export async function fetchAllContests(): Promise<Contest[]> {
  const [codeforces, codechef, leetcode] = await Promise.all([
    fetchCodeforcesContests(),
    fetchCodechefContests(),
    fetchLeetcodeContests()
  ]);
  
  // Load saved solution links
  const solutionLinks = getSavedSolutionLinks();
  
  // Combine all contests and add solution links where available
  const allContests = [...codeforces, ...codechef, ...leetcode];
  
  // Add solution links to contests
  return allContests.map(contest => {
    if (solutionLinks[contest.id]) {
      return {
        ...contest,
        solutionLink: solutionLinks[contest.id]
      };
    }
    return contest;
  });
} 