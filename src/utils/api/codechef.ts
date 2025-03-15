import { Contest, ContestType, Platform } from '../types';
import { PLATFORMS } from '../constants';
import { FETCH_HEADERS, showErrorToast } from './common';

// Helper function to map CodeChef contest data to Contest interface
function mapCodeChefContest(contest: any, defaultStatus: 'upcoming' | 'ongoing' | 'past'): Contest {
  // Parse the ISO date strings
  const startTime = new Date(contest.contest_start_date_iso || contest.contest_start_date);
  const endTime = new Date(contest.contest_end_date_iso || contest.contest_end_date);
  const durationSeconds = parseInt(contest.contest_duration) * 60; // Convert minutes to seconds
  
  // Determine contest type based on name or code
  let contestType: ContestType = 'regular';
  const contestName = (contest.contest_name || '').toLowerCase();
  const contestCode = (contest.contest_code || '').toLowerCase();
  
  if (contestName.includes('lunchtime') || contestCode.includes('lunch')) {
    contestType = 'lunchtime';
  } else if (contestName.includes('cook-off') || contestCode.includes('cook')) {
    contestType = 'cookoff';
  } else if (contestName.includes('long') || contestCode.includes('long')) {
    contestType = 'long';
  } else if (contestName.includes('starters') || contestCode.includes('start')) {
    contestType = 'regular';
  }
  
  return {
    id: `codechef-${contest.contest_code}`,
    name: contest.contest_name,
    platform: 'codechef' as Platform,
    url: `${PLATFORMS.codechef.baseUrl}/${contest.contest_code}`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: durationSeconds,
    status: defaultStatus,
    contestType
  };
}

// Fetch CodeChef contests
export async function fetchCodechefContests(): Promise<Contest[]> {
  try {
    // Use api.allorigins.win directly for CodeChef
    const codechefUrl = 'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(codechefUrl)}`;
    
    console.log(`Fetching CodeChef contests from: ${proxyUrl}`);
    const response = await fetch(proxyUrl, { headers: FETCH_HEADERS });
    const data = await response.json();
    
    console.log('CodeChef API response:', data);
    
    // Check for the correct format of successful response
    if (data.status === "success") {
      console.log('Successfully received CodeChef contest data');
    } else if (!data.future_contests && !data.past_contests) {
      throw new Error('Failed to fetch CodeChef contests: Unexpected response format');
    }
    
    const contests: Contest[] = [];
    
    // Process present/ongoing contests
    if (data.present_contests && Array.isArray(data.present_contests)) {
      const ongoingContests = data.present_contests.map((contest: any) => mapCodeChefContest(contest, 'ongoing'));
      contests.push(...ongoingContests);
    }
    
    // Process upcoming contests
    if (data.future_contests && Array.isArray(data.future_contests)) {
      const upcomingContests = data.future_contests.map((contest: any) => mapCodeChefContest(contest, 'upcoming'));
      contests.push(...upcomingContests);
    }
    
    // Process past contests
    if (data.past_contests && Array.isArray(data.past_contests)) {
      const pastContests = data.past_contests.map((contest: any) => mapCodeChefContest(contest, 'past'));
      contests.push(...pastContests);
    }
    
    // Final check for ongoing contests (just in case API status is wrong)
    const now = Date.now();
    contests.forEach(contest => {
      const startTime = new Date(contest.startTime).getTime();
      const endTime = new Date(contest.endTime).getTime();
      
      if (now >= startTime && now < endTime) {
        contest.status = 'ongoing';
      }
    });
    
    return contests;
  } catch (error) {
    console.error('Error fetching CodeChef contests:', error);
    showErrorToast('Failed to fetch CodeChef contests. Please try again later.');
    
    // Return empty array instead of mock data
    return [];
  }
} 