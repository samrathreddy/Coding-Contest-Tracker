import { YouTubeVideo } from '@/utils/types';
import { getEnvironmentConfig } from '@/utils/env';
import { Contest, Platform } from '@/utils/types';
import { YOUTUBE_PLAYLISTS } from '@/utils/constants';
import { getSavedSolutionLinks } from '@/utils/api/solutions';

/**
 * Extract the playlist ID from a YouTube playlist URL
 */
export function extractPlaylistId(playlistUrl: string): string | null {
  if (!playlistUrl) return null;
  
  // Match playlist ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/playlist\?list=)([^&]+)/i,
    /(?:youtube\.com\/watch\?v=[^&]+&list=)([^&]+)/i,
    /(?:youtu\.be\/[^&]+\?list=)([^&]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = playlistUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Fetch videos from a YouTube playlist using the YouTube Data API
 */
export async function fetchPlaylistVideos(
  playlistUrl: string,
  apiKey?: string
): Promise<YouTubeVideo[]> {
  // Use provided API key or get from environment config
  const config = getEnvironmentConfig();
  const youtubeApiKey = apiKey || config.youtubeApiKey;
  
  if (!playlistUrl) {
    throw new Error('No playlist URL provided');
  }
  
  if (!youtubeApiKey) {
    throw new Error('YouTube API key is required');
  }
  
  // Extract playlist ID from URL
  const playlistId = extractPlaylistId(playlistUrl);
  
  if (!playlistId) {
    throw new Error('Invalid playlist URL');
  }
  
  try {
    // Fetch videos from the YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${youtubeApiKey}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `API request failed with status ${response.status}`
      );
    }
    
    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return [];
    }
    
    // Process videos
    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnailUrl: 
        item.snippet.thumbnails?.high?.url || 
        item.snippet.thumbnails?.medium?.url || 
        item.snippet.thumbnails?.default?.url || 
        '',
      publishedAt: item.snippet.publishedAt,
      playlistId: playlistId, // Add the playlist ID
    }));
    
    return videos;
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    throw error;
  }
}

/**
 * Extract round number from contest title
 * For example: "Codeforces Round 1010 (Div. 1, Unrated)" -> "Round 1010"
 */
export function extractRoundNumber(contestTitle: string): string | null {
  if (!contestTitle) return null;
  
  const contestTitleLower = contestTitle.toLowerCase();
  
  // For Codeforces contests
  if (contestTitleLower.includes('codeforces')) {
    // Handle Educational rounds
    if (contestTitleLower.includes('educational')) {
      const eduMatch = contestTitle.match(/Educational\s+(?:Codeforces\s+)?Round\s+(\d+)/i);
      if (eduMatch && eduMatch[0]) {
        return eduMatch[0].trim();
      }
    }
    
    // Handle Global rounds
    if (contestTitleLower.includes('global')) {
      const globalMatch = contestTitle.match(/Global\s+Round\s+(\d+)/i);
      if (globalMatch && globalMatch[0]) {
        return globalMatch[0].trim();
      }
    }
    
    // Handle regular rounds
    const roundMatch = contestTitle.match(/Round\s+(\d+)/i);
    if (roundMatch && roundMatch[0]) {
      return roundMatch[0].trim();
    }
  }
  
  // For CodeChef contests
  if (contestTitleLower.includes('codechef')) {
    // Handle Cook-Off
    const cookOffMatch = contestTitle.match(/Cook[- ]Off\s+(\d+)/i);
    if (cookOffMatch && cookOffMatch[0]) {
      return cookOffMatch[0].trim();
    }
    
    // Handle Lunchtime
    const lunchtimeMatch = contestTitle.match(/Lunchtime\s+(\d+)/i);
    if (lunchtimeMatch && lunchtimeMatch[0]) {
      return lunchtimeMatch[0].trim();
    }
    
    // Handle Starters with improved pattern matching
    // This will match patterns like "Starters 177 (Rated till 5 star)" or "Starters 174 (Rated upto 2700)"
    const startersMatch = contestTitle.match(/Starters\s+(\d+)(?:\s*\([\w\s\d]+\))?/i);
    if (startersMatch && startersMatch[0]) {
      // Extract just "Starters X" part to make matching more reliable
      const cleanedMatch = startersMatch[0].replace(/\([\w\s\d]+\)/i, '').trim();
      return cleanedMatch;
    }
  }
  
  // For LeetCode contests
  if (contestTitleLower.includes('leetcode')) {
    // Handle Weekly contests
    const weeklyMatch = contestTitle.match(/Weekly\s+Contest\s+(\d+)/i);
    if (weeklyMatch && weeklyMatch[0]) {
      return weeklyMatch[0].trim();
    }
    
    // Handle Biweekly contests
    const biweeklyMatch = contestTitle.match(/Biweekly\s+Contest\s+(\d+)/i);
    if (biweeklyMatch && biweeklyMatch[0]) {
      return biweeklyMatch[0].trim();
    }
  }
  
  // CodeChef contest without platform in title
  if (contestTitleLower.includes('starters')) {
    const startersMatch = contestTitle.match(/Starters\s+(\d+)(?:\s*\([\w\s\d]+\))?/i);
    if (startersMatch && startersMatch[0]) {
      // Extract just "Starters X" part to make matching more reliable
      const cleanedMatch = startersMatch[0].replace(/\([\w\s\d]+\)/i, '').trim();
      return cleanedMatch;
    }
  }
  
  // Generic fallback - try to find any number pattern that could represent a round
  const numberMatch = contestTitle.match(/(?:round|contest)\s+(\d+)/i);
  if (numberMatch && numberMatch[0]) {
    return numberMatch[0].trim();
  }
  
  return null;
}

/**
 * Find a video in the playlist that matches a contest name
 */
export async function findVideoForContest(
  contestName: string,
  playlistUrl?: string
): Promise<string | null> {
  if (!contestName && !playlistUrl) {
    return null;
  }
  
  // If there's no contest name but a playlist URL, return the playlist URL
  if (!contestName && playlistUrl) {
    return playlistUrl;
  }
  
  const config = getEnvironmentConfig();
  const userPlaylistUrl = playlistUrl || config.youtubePlaylistUrl;
  const apiKey = config.youtubeApiKey;
  
  if (!userPlaylistUrl || !apiKey) {
    return null;
  }
  
  try {
    // Extract round number from contest name
    const roundNumber = extractRoundNumber(contestName);
    
    // Fetch all videos from the playlist
    const videos = await fetchPlaylistVideos(userPlaylistUrl, apiKey);
    
    // First try to match using the round number if available
    if (roundNumber) {
      const roundMatchingVideo = videos.find(video => {
        const videoTitle = video.title.toLowerCase();
        return videoTitle.includes(roundNumber.toLowerCase());
      });
      
      if (roundMatchingVideo) {
        return `https://www.youtube.com/watch?v=${roundMatchingVideo.videoId}`;
      }
    }
    
    // Fallback to the original matching logic
    const contestTerms = contestName.toLowerCase().split(' ');
    
    const matchingVideo = videos.find(video => {
      const videoTitle = video.title.toLowerCase();
      // Check if the video title contains all terms from the contest name
      return contestTerms.every(term => videoTitle.includes(term));
    });
    
    return matchingVideo 
      ? `https://www.youtube.com/watch?v=${matchingVideo.videoId}` 
      : userPlaylistUrl; // Return playlist URL as fallback
  } catch (error) {
    console.error('Error finding video for contest:', error);
    return playlistUrl || null; // Return playlist URL as fallback if there's an error
  }
}

/**
 * Smart match contests with YouTube videos from platform-specific playlists
 */
export async function smartMatchContestVideos(contests: Contest[]): Promise<{ resultMap: Record<string, string>, stats: Record<string, any> }> {
  const config = getEnvironmentConfig();
  const apiKey = config.youtubeApiKey;
  
  if (!apiKey) {
    console.error('YouTube API key is missing, cannot perform smart matching');
    return { resultMap: {}, stats: { error: 'YouTube API key is missing' } };
  }
  
  console.log('Starting smart matching for contests with YouTube videos...');
  
  // Group contests by platform
  const platformContests: Record<Platform, Contest[]> = {
    codeforces: [],
    codechef: [],
    leetcode: []
  };
  
  contests.forEach(contest => {
    if (contest.platform in platformContests) {
      platformContests[contest.platform].push(contest);
    }
  });
  
  // Sort each platform's contests by time (past contests sorted by newest first)
  for (const platform of Object.keys(platformContests) as Platform[]) {
    platformContests[platform].sort((a, b) => {
      // Sort past contests by most recent first
      if (a.status === 'past' && b.status === 'past') {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }
      
      // Different status groups
      if (a.status !== b.status) {
        const statusOrder = { ongoing: 0, upcoming: 1, past: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // Within the same status group
      if (a.status === 'upcoming' || a.status === 'ongoing') {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      } else {
        // Past contests, most recent first
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }
    });
  }
  
  // Result map to store contest ID -> YouTube URL
  const resultMap: Record<string, string> = {};
  
  // Get existing manual links to avoid overriding them
  const existingLinks = getSavedSolutionLinks();
  
  // Statistics for each platform
  const stats: Record<string, any> = {
    total: 0,
    matched: 0,
    skipped: 0,
    platforms: {}
  };
  
  // Process each platform with its respective playlist
  for (const platform of Object.keys(platformContests) as Platform[]) {
    const playlistUrl = YOUTUBE_PLAYLISTS[platform];
    console.log(`Processing ${platform} contests with playlist: ${playlistUrl}`);
    
    // Initialize platform stats
    stats.platforms[platform] = {
      total: platformContests[platform].length,
      matched: 0,
      skipped: 0,
      matchedVideos: []
    };
    
    stats.total += platformContests[platform].length;
    
    try {
      // Skip if no contests for this platform or no playlist URL
      if (platformContests[platform].length === 0 || !playlistUrl) {
        console.log(`Skipping ${platform}: No contests or no playlist URL available`);
        continue;
      }
      
      // Filter out contests that already have manual links
      const contestsToProcess = platformContests[platform].filter(contest => !existingLinks[contest.id]);
      
      // Count skipped contests (ones that already have manual links)
      const skippedCount = platformContests[platform].length - contestsToProcess.length;
      stats.skipped += skippedCount;
      stats.platforms[platform].skipped = skippedCount;
      
      // If no contests need processing after filtering, skip the API call entirely
      if (contestsToProcess.length === 0) {
        console.log(`Skipping ${platform}: All contests already have manual links`);
        continue;
      }
      
      const contestCount = contestsToProcess.length;
      console.log(`Found ${contestCount} ${platform} contests to process`);
      
      // Fetch all videos from this platform's playlist - ONLY API CALL in this function
      console.log(`Fetching videos from ${platform} playlist...`);
      const videos = await fetchPlaylistVideos(playlistUrl, apiKey);
      console.log(`Fetched ${videos.length} videos from ${platform} playlist`);
      
      let matchCount = 0;
      
      // Process each contest for this platform
      for (const contest of contestsToProcess) {
        // First try to match using round number extraction
        const roundNumber = extractRoundNumber(contest.name);
        
        if (roundNumber) {
          console.log(`Contest "${contest.name}" has round number: "${roundNumber}"`);
          
          // Try to find exact match first
          let matchingVideo = videos.find(video => {
            const videoTitle = video.title.toLowerCase();
            return videoTitle.includes(roundNumber.toLowerCase());
          });
          
          if (matchingVideo) {
            console.log(`🎯 Exact match found: "${contest.name}" -> "${matchingVideo.title}"`);
            resultMap[contest.id] = `https://www.youtube.com/watch?v=${matchingVideo.videoId}`;
            matchCount++;
            stats.matched++;
            stats.platforms[platform].matched++;
            stats.platforms[platform].matchedVideos.push({
              contestName: contest.name,
              videoTitle: matchingVideo.title,
              matchType: 'exact'
            });
            continue; // Skip to next contest since we found a match
          } else {
            console.log(`No exact match found for "${contest.name}" with round number "${roundNumber}"`);
            
            // Try to extract just the number from the round for a more flexible match
            const justNumberMatch = roundNumber.match(/\d+/);
            if (justNumberMatch && justNumberMatch[0]) {
              const roundNumberValue = justNumberMatch[0];
              console.log(`Trying flexible match with just the number: ${roundNumberValue}`);
              
              // Look for flexible match with just the number
              matchingVideo = videos.find(video => {
                const videoTitle = video.title.toLowerCase();
                
                // Match pattern depends on the platform
                if (platform === 'codeforces') {
                  return videoTitle.includes('round') && videoTitle.includes(roundNumberValue);
                } else if (platform === 'leetcode') {
                  return (videoTitle.includes('weekly') || videoTitle.includes('biweekly')) && 
                         videoTitle.includes('contest') && 
                         videoTitle.includes(roundNumberValue);
                } else if (platform === 'codechef') {
                  const contestTitleLower = contest.name.toLowerCase();
                  if (contestTitleLower.includes('starters')) {
                    // For Starters contests, first try exact "Starters X" match
                    if (videoTitle.includes('starters') && videoTitle.includes(roundNumberValue)) {
                      return true;
                    }
                    
                    // For titles like "CodeChef Starters X Solutions"
                    return (videoTitle.includes('codechef') && 
                            videoTitle.includes('starters') && 
                            videoTitle.includes(roundNumberValue));
                  } else if (contestTitleLower.includes('cook')) {
                    return videoTitle.includes('cook') && videoTitle.includes(roundNumberValue);
                  } else if (contestTitleLower.includes('lunchtime')) {
                    return videoTitle.includes('lunchtime') && videoTitle.includes(roundNumberValue);
                  } else {
                    // Generic CodeChef contest
                    return (videoTitle.includes('codechef') || 
                           videoTitle.includes('chef')) && 
                           videoTitle.includes(roundNumberValue);
                  }
                }
                
                return false;
              });
              
              if (matchingVideo) {
                console.log(`🎯 Flexible match found: "${contest.name}" -> "${matchingVideo.title}"`);
                resultMap[contest.id] = `https://www.youtube.com/watch?v=${matchingVideo.videoId}`;
                matchCount++;
                stats.matched++;
                stats.platforms[platform].matched++;
                stats.platforms[platform].matchedVideos.push({
                  contestName: contest.name,
                  videoTitle: matchingVideo.title,
                  matchType: 'flexible'
                });
                continue; // Skip to next contest since we found a match
              } else {
                console.log(`No flexible match found for "${contest.name}" with number "${roundNumberValue}"`);
              }
            }
          }
        } else {
          console.log(`No round number extracted for contest: "${contest.name}"`);
          
          // Try matching based on significant words in the contest title
          const titleWords = contest.name.toLowerCase().split(/\s+/);
          const significantWords = titleWords.filter(word => 
            word.length > 3 && // Skip short words
            !['round', 'contest', 'the', 'and', 'div'].includes(word) // Skip common words
          );
          
          if (significantWords.length > 0) {
            console.log(`Trying word-based match with: ${significantWords.join(', ')}`);
            
            const matchingVideo = videos.find(video => {
              const videoTitle = video.title.toLowerCase();
              // Consider it a match if at least 2/3 of significant words are found
              const minMatches = Math.ceil(significantWords.length * 0.66);
              const matchedWords = significantWords.filter(word => videoTitle.includes(word));
              return matchedWords.length >= minMatches;
            });
            
            if (matchingVideo) {
              console.log(`🎯 Word-based match found: "${contest.name}" -> "${matchingVideo.title}"`);
              resultMap[contest.id] = `https://www.youtube.com/watch?v=${matchingVideo.videoId}`;
              matchCount++;
              stats.matched++;
              stats.platforms[platform].matched++;
              stats.platforms[platform].matchedVideos.push({
                contestName: contest.name,
                videoTitle: matchingVideo.title,
                matchType: 'word-based'
              });
            } else {
              console.log(`No word-based match found for "${contest.name}"`);
            }
          }
        }
        
        // If no match found for this contest, use the platform's general playlist
        if (!resultMap[contest.id]) {
          // For CodeChef contests, we'll add a specific fallback pattern
          if (platform === 'codechef') {
            // Get the specific contest type
            const contestTitleLower = contest.name.toLowerCase();
            if (contestTitleLower.includes('starters')) {
              // For Starters, try to match more videos from the playlist with "starters" in the title
              const anyStartersVideo = videos.find(video => 
                video.title.toLowerCase().includes('starters')
              );
              
              if (anyStartersVideo) {
                resultMap[contest.id] = `https://www.youtube.com/watch?v=${anyStartersVideo.videoId}`;
                console.log(`Using a generic Starters video for: "${contest.name}"`);
                continue;
              }
            }
          }
          
          // If all else fails, use the platform's general playlist URL
          resultMap[contest.id] = playlistUrl;
        }
      }
      
      console.log(`Matched ${matchCount} out of ${contestCount} ${platform} contests`);
    } catch (error) {
      console.error(`Error processing ${platform} contests:`, error);
      stats.platforms[platform].error = `Error: ${error.message}`;
    }
  }
  
  stats.matchRate = stats.total > 0 ? ((stats.matched / (stats.total - stats.skipped)) * 100).toFixed(1) : '0';
  console.log(`Smart matching completed with ${Object.keys(resultMap).length} total matches (${stats.matchRate}%)`);
  
  return { resultMap, stats };
}

/**
 * Generate mock YouTube videos for testing
 */
export function generateMockVideos(count: number = 10): YouTubeVideo[] {
  return Array.from({ length: count }, (_, i) => ({
    videoId: `mock-video-${i + 1}`,
    title: `Mock LeetCode Contest ${350 + i} Solution`,
    description: `Comprehensive solution for LeetCode Weekly Contest ${350 + i}`,
    thumbnailUrl: 'https://via.placeholder.com/480x360.png?text=Video+Thumbnail',
    publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
    playlistId: 'mock-playlist',
  }));
}

/**
 * Test function for the improved extraction patterns
 * This function is for development purposes only and should be removed in production
 */
export function testExtraction(): void {
  const testCases = [
    "CodeChef Starters 177 (Rated till 5 star)",
    "Starters 174 (Rated upto 2700)",
    "CodeChef Starters 80",
    "CodeChef Lunchtime 110",
    "CodeChef Cook-Off 162",
    "Codeforces Round 930 (Div. 1)",
    "LeetCode Weekly Contest 390"
  ];
  
  console.log("Testing extraction patterns:");
  testCases.forEach(title => {
    const extracted = extractRoundNumber(title);
    console.log(`[${title}] -> [${extracted}]`);
  });
} 