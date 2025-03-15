import { Contest, ContestType, Platform } from '../types';
import { PLATFORMS } from '../constants';
import { FETCH_HEADERS, showErrorToast } from './common';

// Fetch Codeforces contests
export async function fetchCodeforcesContests(): Promise<Contest[]> {
  try {
    const codeforcesUrl = 'https://codeforces.com/api/contest.list';
    
    console.log(`Fetching Codeforces contests from: ${codeforcesUrl}`);
    const response = await fetch(codeforcesUrl, { headers: FETCH_HEADERS });
    const data = await response.json();
    
    console.log('Codeforces API response:', data);
    
    if (data.status !== 'OK') {
      throw new Error('Failed to fetch Codeforces contests');
    }
    
    return data.result
      .filter((contest: any) => {
        // Filter out contests without startTimeSeconds (some training contests might not have it)
        return contest.startTimeSeconds !== undefined;
      })
      .map((contest: any) => {
        const startTimeMs = (contest.startTimeSeconds) * 1000;
        const durationSeconds = contest.durationSeconds;
        const endTimeMs = startTimeMs + durationSeconds * 1000;
        
        const now = Date.now();
        let status: 'upcoming' | 'ongoing' | 'past';
        
        // Determine status based on phase or time
        if (contest.phase === 'BEFORE') {
          status = 'upcoming';
        } else if (contest.phase === 'CODING') {
          status = 'ongoing';
        } else if (contest.phase === 'FINISHED' || contest.phase === 'PENDING_SYSTEM_TEST' || contest.phase === 'SYSTEM_TEST') {
          status = 'past';
        } else {
          // Fallback to time-based status if phase is not recognized
          if (now < startTimeMs) {
            status = 'upcoming';
          } else if (now < endTimeMs) {
            status = 'ongoing';
          } else {
            status = 'past';
          }
        }
        
        // Determine contest type based on type and kind fields
        let contestType: ContestType = 'regular';
        if (contest.type === 'ICPC') {
          contestType = 'ICPC';
        } else if (contest.type === 'CF') {
          contestType = 'CF';
        } else if (contest.type === 'IOI') {
          contestType = 'IOI';
        }
        
        // Further refine contest type based on kind if available
        if (contest.kind) {
          const kind = contest.kind.toLowerCase();
          if (kind.includes('educational')) {
            contestType = 'regular';
          } else if (kind.includes('div. 1') || kind.includes('div1')) {
            contestType = 'regular';
          } else if (kind.includes('div. 2') || kind.includes('div2')) {
            contestType = 'regular';
          } else if (kind.includes('global')) {
            contestType = 'regular';
          }
        }
        
        // Create the contest object
        return {
          id: `codeforces-${contest.id}`,
          name: contest.name,
          platform: 'codeforces' as Platform,
          url: `${PLATFORMS.codeforces.baseUrl}/contest/${contest.id}`,
          startTime: new Date(startTimeMs).toISOString(),
          endTime: new Date(endTimeMs).toISOString(),
          duration: durationSeconds,
          status,
          contestType,
          // Add additional fields that might be useful for display
          additionalInfo: {
            type: contest.type,
            phase: contest.phase,
            kind: contest.kind,
            difficulty: contest.difficulty,
            country: contest.country,
            city: contest.city,
            season: contest.season
          }
        };
      });
  } catch (error) {
    console.error('Error fetching Codeforces contests:', error);
    showErrorToast('Failed to fetch Codeforces contests. Please try again later.');
    
    // Return empty array instead of mock data
    return [];
  }
} 