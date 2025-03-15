export type Platform = 'codeforces' | 'codechef' | 'leetcode';

export type ContestType = 'regular' | 'weekly' | 'biweekly' | 'long' | 'lunchtime' | 'cookoff' | 'ICPC' | 'CF' | 'IOI';

export interface Contest {
  id: string;
  name: string;
  platform: Platform;
  url: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in seconds
  status: 'upcoming' | 'ongoing' | 'past';
  contestType?: ContestType;
  solutionLink?: string; // YouTube link for solutions
  additionalInfo?: Record<string, any>; // Platform-specific additional information
}

export interface BookmarkedContest extends Contest {
  bookmarked: boolean;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  playlistId?: string; // ID of the playlist the video belongs to
}

export interface FilterOptions {
  platforms: Platform[];
  status: 'upcoming' | 'ongoing' | 'past' | 'all';
  bookmarked: boolean;
}
