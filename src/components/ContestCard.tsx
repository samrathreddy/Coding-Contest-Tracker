import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { BookmarkedContest, Platform } from '@/utils/types';
import { PLATFORMS, CONTEST_TYPE_LABELS, IST_TIMEZONE } from '@/utils/constants';
import { CountdownTimer } from './CountdownTimer';
import { Bookmark } from './Bookmark';
import { YouTubeLink } from './YouTubeLink';
import { ExternalLink, Clock, Calendar, Trophy, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { findProblemSolution } from '@/utils/api';
import { generateGoogleCalendarUrl, createCalendarEventDescription } from '@/utils/calendar';

interface ContestCardProps {
  contest: BookmarkedContest;
  onToggleBookmark: (e?: React.MouseEvent) => void;
}

export function ContestCard({ contest, onToggleBookmark }: ContestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  
  const {
    id,
    name,
    platform,
    url,
    startTime,
    endTime,
    status,
    bookmarked,
    solutionLink,
    contestType
  } = contest;
  
  // Fetch solution URL if not already available
  useEffect(() => {
    // If a specific solution link is already provided, use that
    if (solutionLink) {
      setSolutionUrl(solutionLink);
    } 
    // Otherwise, try to find a general solution from the playlist
    else {
      const fetchSolution = async () => {
        const foundSolution = await findProblemSolution(platform as Platform, name);
        if (foundSolution) {
          setSolutionUrl(foundSolution);
        }
      };
      
      fetchSolution();
    }
  }, [name, platform, solutionLink]);
  
  const platformInfo = PLATFORMS[platform as Platform];
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  // Format date for display in IST timezone
  const formatDateInIST = (date: Date) => {
    try {
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid date';
      }
      
      // Use formatInTimeZone but create a clean format without the timestamp
      const day = formatInTimeZone(date, IST_TIMEZONE, 'EEE');
      const dateNum = formatInTimeZone(date, IST_TIMEZONE, 'd');
      const month = formatInTimeZone(date, IST_TIMEZONE, 'MMM');
      const time = formatInTimeZone(date, IST_TIMEZONE, 'h:mm a');
      
      // Return a clean string without any timestamp
      return `${day}, ${dateNum} ${month}, ${time} (IST)`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return format(date, 'EEE, d MMM, h:mm a');
    }
  };
  
  // Calculate duration in hours and minutes
  const durationHours = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)) % 60;
  
  // Format duration string
  const durationString = durationHours > 0 
    ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`
    : `${durationMinutes}m`;
  
  const statusColors = {
    upcoming: 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800',
    ongoing: 'bg-green-500/10 text-green-500 border-green-200 dark:border-green-800',
    past: 'bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-800'
  };
  
  const platformColors = {
    codeforces: 'bg-[#1195F5]/10 text-[#1195F5] border-[#1195F5]/20',
    codechef: 'bg-[#9D5D07]/10 text-[#9D5D07] border-[#9D5D07]/20',
    leetcode: 'bg-[#FFA116]/10 text-[#FFA116] border-[#FFA116]/20'
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 contest-card-hover border shadow-sm h-full",
        status === 'ongoing' && 'ring-2 ring-green-500/30 dark:ring-green-400/30',
        expanded && 'shadow-md'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="p-4 pb-2 flex-row justify-between items-start gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge 
              variant="outline" 
              className={cn(platformColors[platform], "capitalize")}
            >
              {platformInfo.name}
            </Badge>
            
            <Badge 
              variant="outline" 
              className={cn(statusColors[status], "capitalize")}
            >
              {status}
            </Badge>

            {contestType && (
              <Badge variant="secondary" className="capitalize">
                {CONTEST_TYPE_LABELS[contestType] || contestType}
              </Badge>
            )}
          </div>
          
          <h3 className="text-base font-bold line-clamp-2">
            {name}
          </h3>
        </div>
        
        <Bookmark 
          isBookmarked={bookmarked}
          onToggle={(e) => {
            if (e) {
              e.stopPropagation();
            }
            onToggleBookmark();
          }}
          size="sm"
        />
      </CardHeader>
      
      <CardContent className="p-4 pt-2 pb-2">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">{formatDateInIST(startDate)}</span>
            </div>
          </div>
          
          {status === 'upcoming' && (
            <div className="flex items-center justify-between gap-2 mt-1 bg-primary/5 p-2 rounded-md">
              <span className="text-primary font-medium">Starts in</span>
              <CountdownTimer targetDate={startTime} />
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{durationString}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex justify-between items-center gap-2 mt-auto">
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Trophy className="h-3.5 w-3.5" />
            Join Contest
          </a>
          
          {/* Only show "Add to Reminder" for upcoming contests */}
          {status === 'upcoming' && (
            <a
              href={generateGoogleCalendarUrl(
                name,
                createCalendarEventDescription(name, platform, url),
                url,
                startTime,
                endTime,
                30 // 30 minutes reminder
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
              onClick={e => e.stopPropagation()}
              title="Add to Google Calendar with 30 min reminder"
            >
              <Bell className="h-3.5 w-3.5" />
              Remind Me
            </a>
          )}
        </div>
        
        {status === 'past' && solutionUrl && (
          <YouTubeLink url={solutionUrl} />
        )}
      </CardFooter>
    </Card>
  );
}
