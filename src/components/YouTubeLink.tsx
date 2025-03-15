import { ExternalLink, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface YouTubeLinkProps {
  url?: string;
  label?: string;
}

export function YouTubeLink({ url, label = 'View Solution' }: YouTubeLinkProps) {
  if (!url) return null;
  
  // Determine if this is a specific video or a playlist
  const isPlaylist = url.includes('playlist');
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
        >
          <Youtube className="h-3 w-3 text-red-500" />
          {label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-2">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Problem Solution</p>
          {isPlaylist ? (
            <p className="text-xs text-muted-foreground">
              Click to browse solution videos for this contest platform in our YouTube playlist.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Click to watch the specific video solution for this contest.
            </p>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open in YouTube
          </a>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
