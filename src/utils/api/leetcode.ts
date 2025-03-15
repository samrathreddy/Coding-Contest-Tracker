import { Contest, ContestType, Platform } from '../types';
import { PLATFORMS } from '../constants';
import { BROWSER_FETCH_HEADERS, showErrorToast } from './common';

//  Testing :  mock LeetCode contests when API fails
function generateMockLeetcodeContests(): Contest[] {
  const mockContests: Contest[] = [];
  
  // Find the most recent Sunday for weekly contests
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  const daysToLastSunday = currentDay === 0 ? 7 : currentDay;
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - daysToLastSunday);
  
  // Set time to 8:00 AM IST (UTC+5:30)
  // Converting 8:00 AM IST to UTC: 8:00 - 5:30 = 2:30 AM UTC
  lastSunday.setUTCHours(2, 30, 0, 0); // 8AM IST = 2:30AM UTC
  
  // Set up biweekly contest dates - Biweekly 151 was on March 1st
  // Biweekly 151 was on March 1st at 8 PM IST
  const biweekly151Date = new Date(2024, 2, 1); // Month is 0-indexed, so 2 = March
  biweekly151Date.setUTCHours(14, 30, 0, 0); // 8 PM IST
  
  // Past weekly contests (10 contests, one per week going backwards)
  for (let i = 0; i < 10; i++) {
    const weekNum = 440 - i; // Starting from recent contest numbers
    const contestDate = new Date(lastSunday);
    contestDate.setDate(lastSunday.getDate() - (i * 7)); // i weeks ago Sunday
    const durationSeconds = 1.5 * 3600;
    const endTime = new Date(contestDate.getTime() + durationSeconds * 1000);
    
    mockContests.push({
      id: `leetcode-weekly-contest-${weekNum}`,
      name: `Weekly Contest ${weekNum}`,
      platform: 'leetcode',
      url: `https://leetcode.com/contest/weekly-contest-${weekNum}`,
      startTime: contestDate.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationSeconds,
      status: 'past',
      contestType: 'weekly'
    });
  }
  
  // Past biweekly contests
  const biweeklyContestNumbers = [151, 150, 149, 148, 147];
  
  for (let i = 0; i < biweeklyContestNumbers.length; i++) {
    const biweeklyNum = biweeklyContestNumbers[i];
    let contestDate;
    
    if (i === 0) {
      // For Biweekly 151, use March 1st date
      contestDate = new Date(biweekly151Date);
    } else {
      // For others, subtract 2 weeks from the previous contest
      contestDate = new Date(biweekly151Date);
      contestDate.setDate(biweekly151Date.getDate() - (i * 14));
    }
    
    const durationSeconds = 1.5 * 3600;
    const endTime = new Date(contestDate.getTime() + durationSeconds * 1000);
    
    mockContests.push({
      id: `leetcode-biweekly-contest-${biweeklyNum}`,
      name: `Biweekly Contest ${biweeklyNum}`,
      platform: 'leetcode',
      url: `https://leetcode.com/contest/biweekly-contest-${biweeklyNum}`,
      startTime: contestDate.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationSeconds,
      status: 'past',
      contestType: 'biweekly'
    });
  }
  
  // Sort past contests by time (ascending order)
  mockContests.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeA - timeB;
  });
  
  return mockContests;
}

// Process LeetCode contest data from HTML
function processLeetcodeJsonData(jsonData: any): Contest[] {
  const contests: Contest[] = [];
  const now = Date.now();
  
  // Extract past contests data from the queries section
  if (jsonData.props?.pageProps?.dehydratedState?.queries) {
    const queries = jsonData.props.pageProps.dehydratedState.queries;
    
    // Find the query containing pastContests data
    for (const query of queries) {
      if (query.state?.data?.pastContests) {
        const pastContests = query.state.data.pastContests.data || [];
        console.log(`Found ${pastContests.length} LeetCode past contests`);
        
        // Process past contests
        pastContests.forEach((contest: any) => {
          // Extract start time and duration
          const startTimeMs = contest.startTime * 1000;
          const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
          const endTimeMs = startTimeMs + durationSeconds * 1000;
          
          // Determine contest type based on title
          let contestType: ContestType = 'weekly';
          if (contest.title.toLowerCase().includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Create contest object
          contests.push({
            id: `leetcode-${contest.titleSlug}`,
            name: contest.title,
            platform: 'leetcode',
            url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            duration: durationSeconds,
            status: 'past',
            contestType,
            additionalInfo: {
              cardImg: contest.cardImg
            }
          });
        });
      }
    }
    
    // Find upcoming contests data
    for (const query of queries) {
      if (query.state?.data?.topTwoContests) {
        const upcomingContests = query.state.data.topTwoContests || [];
        console.log(`Found ${upcomingContests.length} LeetCode upcoming contests`);
        
        // Process upcoming contests
        upcomingContests.forEach((contest: any) => {
          // Extract start time and duration
          const startTimeMs = contest.startTime * 1000;
          const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
          const endTimeMs = startTimeMs + durationSeconds * 1000;
          
          // Determine contest status
          let status: 'upcoming' | 'ongoing' = 'upcoming';
          if (now >= startTimeMs && now < endTimeMs) {
            status = 'ongoing';
          }
          
          // Determine contest type based on title
          let contestType: ContestType = 'weekly';
          if (contest.titleSlug.toLowerCase().includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Create contest object
          contests.push({
            id: `leetcode-${contest.titleSlug}`,
            name: contest.title,
            platform: 'leetcode',
            url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            duration: durationSeconds,
            status,
            contestType,
            additionalInfo: {
              cardImg: contest.cardImg
            }
          });
        });
      }
    }
    
    // Find featured contests data for additional past contests
    for (const query of queries) {
      if (query.state?.data?.featuredContests) {
        const featuredContests = query.state.data.featuredContests || [];
        console.log(`Found ${featuredContests.length} LeetCode featured contests`);
        
        // Process featured contests (likely past contests)
        featuredContests.forEach((contest: any) => {
          // Skip contests that we've already processed
          if (contests.some(c => c.id === `leetcode-${contest.titleSlug}`)) {
            return;
          }
          
          // Extract start time and duration
          const startTimeMs = contest.startTime * 1000;
          const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
          const endTimeMs = startTimeMs + durationSeconds * 1000;
          
          // Determine contest type based on title
          let contestType: ContestType = 'weekly';
          if (contest.titleSlug.toLowerCase().includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Create contest object
          contests.push({
            id: `leetcode-${contest.titleSlug}`,
            name: contest.title,
            platform: 'leetcode',
            url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            duration: durationSeconds,
            status: 'past', // Featured contests are typically past contests
            contestType,
            additionalInfo: {
              cardImg: contest.cardImg
            }
          });
        });
      }
    }
  }

  // Sort all contests by time (ascending order)
  contests.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeA - timeB;
  });

  return contests;
}


// Fetch LeetCode contests
export async function fetchLeetcodeContests(): Promise<Contest[]> {
  try {
    // Use LeetCode's GraphQL API to get upcoming contests via CORS proxy
    const leetcodeGraphQLUrl = 'https://leetcode.com/graphql?operationName=upcomingContests&query=query upcomingContests { upcomingContests{ title titleSlug startTime duration __typename }}';
    const proxyGraphQLUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(leetcodeGraphQLUrl)}`;
    
    console.log(`Fetching LeetCode contests from GraphQL API via proxy: ${proxyGraphQLUrl}`);
    const response = await fetch(proxyGraphQLUrl, { headers: BROWSER_FETCH_HEADERS });
    const data = await response.json();
    
    // Log the response for debugging
    console.log('LeetCode GraphQL API response:', data);
    
    // Process upcoming contests from GraphQL
    let upcomingContests: Contest[] = [];
    
    // If we have valid data from the GraphQL API
    if (data.data?.upcomingContests && Array.isArray(data.data.upcomingContests)) {
      const graphqlContests = data.data.upcomingContests;
      console.log(`Found ${graphqlContests.length} upcoming LeetCode contests via GraphQL`);
      
      const now = Date.now();
      
      // Process upcoming contests from GraphQL
      graphqlContests.forEach((contest: any) => {
        // Extract start time and duration
        const startTimeMs = contest.startTime * 1000;
        const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
        const endTimeMs = startTimeMs + durationSeconds * 1000;
        
        // Determine contest status
        let status: 'upcoming' | 'ongoing' = 'upcoming';
        if (now >= startTimeMs && now < endTimeMs) {
          status = 'ongoing';
        }
        
        // Determine contest type based on title
        let contestType: ContestType = 'weekly';
        if (contest.title.toLowerCase().includes('biweekly')) {
          contestType = 'biweekly';
        }
        
        // Create contest object
        upcomingContests.push({
          id: `leetcode-${contest.titleSlug}`,
          name: contest.title,
          platform: 'leetcode',
          url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
          startTime: new Date(startTimeMs).toISOString(),
          endTime: new Date(endTimeMs).toISOString(),
          duration: durationSeconds,
          status,
          contestType,
        });
      });
    }
    
    // Get mock data for past contests since GraphQL API is not working
    const pastContests = generateMockLeetcodeContests();
    console.log(`Generated ${pastContests.length} mock past contests`);
    
    // Combine upcoming and past contests
    const allContests = [...pastContests, ...upcomingContests];
    
    // Sort all contests by time
    allContests.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });
    
    console.log(`Total LeetCode contests: ${allContests.length}`);
    return allContests;
  } catch (error) {
    console.error('Error fetching LeetCode contests:', error);
    showErrorToast('Failed to fetch LeetCode contests. Please try again later.');
    
    // Return only past mock contests if GraphQL fails
    return generateMockLeetcodeContests();
  }
} 