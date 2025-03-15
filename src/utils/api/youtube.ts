import { YouTubeVideo, Platform } from '../types';
import { getEnvironmentConfig } from '../env';
import { delay, showErrorToast } from './common';

// Mock function to fetch YouTube videos
export async function fetchYouTubeVideos(platform: Platform): Promise<YouTubeVideo[]> {
  try {
    // In a real app, you would use the YouTube API to fetch videos from the playlists
    await delay(1000);
    
    // Mock data
    const mockVideos: Record<Platform, YouTubeVideo[]> = {
      codeforces: [
        {
          videoId: 'codeforces1',
          title: 'Codeforces Round #799 (Div. 4) | Problem A-F Explained',
          description: 'Detailed explanation of solutions for Codeforces Round #799 problems',
          publishedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
          thumbnailUrl: 'https://i.ytimg.com/vi/example1/maxresdefault.jpg'
        },
        {
          videoId: 'codeforces2',
          title: 'Codeforces Round #800 (Div. 2) | Problem A-D Explained',
          description: 'Walkthrough of Codeforces Round #800 contest problems with optimal approaches',
          publishedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
          thumbnailUrl: 'https://i.ytimg.com/vi/example2/maxresdefault.jpg'
        }
      ],
      codechef: [
        {
          videoId: 'codechef1',
          title: 'CodeChef Long Challenge June 2023 | Problems 1-3 Explained',
          description: 'Solutions for the first three problems from CodeChef Long Challenge June 2023',
          publishedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
          thumbnailUrl: 'https://i.ytimg.com/vi/example3/maxresdefault.jpg'
        }
      ],
      leetcode: [
        {
          videoId: 'leetcode1',
          title: 'LeetCode Weekly Contest 349 Solutions',
          description: 'Complete solutions and explanations for LeetCode Weekly Contest 349',
          publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          thumbnailUrl: 'https://i.ytimg.com/vi/example4/maxresdefault.jpg'
        },
        {
          videoId: 'leetcode2',
          title: 'LeetCode Biweekly Contest 105 Solutions',
          description: 'Step-by-step solutions for all problems in LeetCode Biweekly Contest 105',
          publishedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          thumbnailUrl: 'https://i.ytimg.com/vi/example5/maxresdefault.jpg'
        }
      ]
    };
    
    return mockVideos[platform];
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    showErrorToast('Failed to fetch YouTube videos. Please try again later.');
    return [];
  }
}

// Function to check if a problem has a matching solution in the YouTube playlists
export async function findProblemSolution(platform: Platform, problemName: string): Promise<string | null> {
  try {
    const config = getEnvironmentConfig();
    const playlistUrl = config.youtubePlaylistUrl;
    
    // If we have a playlist URL in config, use it
    if (playlistUrl) {
      return playlistUrl;
    }
    
    // Otherwise fall back to platform-specific mock URLs
    const mockUrls = {
      leetcode: 'https://www.youtube.com/playlist?list=PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr',
      codeforces: 'https://www.youtube.com/playlist?list=PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB',
      codechef: 'https://www.youtube.com/playlist?list=PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr'
    };
    
    return mockUrls[platform] || null;
  } catch (error) {
    console.error('Error finding problem solution:', error);
    return null;
  }
} 