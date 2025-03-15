import { YouTubeVideo } from '@/utils/types';
import { getEnvironmentConfig } from '@/utils/env';

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
    // Fetch all videos from the playlist
    const videos = await fetchPlaylistVideos(userPlaylistUrl, apiKey);
    
    // Search for a video that mentions the contest name
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