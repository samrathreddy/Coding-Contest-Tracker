import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Search, Clipboard, CheckCircle, Youtube, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { YouTubeVideo } from '@/utils/types';
import { fetchPlaylistVideos } from '@/services/youtube';

interface YouTubeVideoListProps {
  playlistUrl?: string;
  apiKey?: string;
  onSelectVideo?: (videoUrl: string) => void;
  showSelectButton?: boolean;
}

export function YouTubeVideoList({
  playlistUrl,
  apiKey,
  onSelectVideo,
  showSelectButton = false,
}: YouTubeVideoListProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeVideo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVideoIds, setCopiedVideoIds] = useState<Record<string, boolean>>({});

  // Fetch videos when playlistUrl or apiKey changes
  useEffect(() => {
    async function loadVideos() {
      if (!playlistUrl) {
        setError('No playlist URL provided');
        return;
      }
      
      if (!apiKey) {
        setError('YouTube API key is required');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const fetchedVideos = await fetchPlaylistVideos(playlistUrl, apiKey);
        setVideos(fetchedVideos);
        setFilteredVideos(fetchedVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError('Failed to fetch videos. Please check your API key and playlist URL.');
      } finally {
        setLoading(false);
      }
    }
    
    loadVideos();
  }, [playlistUrl, apiKey]);

  // Filter videos when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVideos(videos);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = videos.filter((video) => 
      video.title.toLowerCase().includes(term) || 
      video.description.toLowerCase().includes(term)
    );
    
    setFilteredVideos(filtered);
  }, [searchTerm, videos]);

  // Copy video URL to clipboard
  const copyToClipboard = async (video: YouTubeVideo) => {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
      await navigator.clipboard.writeText(videoUrl);
      
      // Update the copied state for this video
      setCopiedVideoIds(prev => ({
        ...prev,
        [video.videoId]: true
      }));
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedVideoIds(prev => ({
          ...prev,
          [video.videoId]: false
        }));
      }, 2000);
      
      toast({
        title: 'Copied!',
        description: 'Video URL copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Handle selecting a video
  const handleSelectVideo = (video: YouTubeVideo) => {
    if (onSelectVideo) {
      const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
      onSelectVideo(videoUrl);
    }
  };

  // Open video in a new tab
  const openVideo = (video: YouTubeVideo) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
        <h3 className="text-amber-800 font-medium">Configuration Required</h3>
        <p className="text-amber-700 mt-1">{error}</p>
        <p className="text-amber-600 mt-2 text-sm">
          {!apiKey && 'Please add your YouTube API key in the API Settings tab.'}
          {!playlistUrl && 'Please add a YouTube playlist URL in the API Settings tab.'}
        </p>
      </div>
    );
  }

  // Render empty state
  if (videos.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-md">
        <Youtube className="h-10 w-10 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No Videos Found</h3>
        <p className="text-muted-foreground mt-1">
          No videos were found in the playlist. Check your playlist URL or API key.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Video count */}
      <div className="text-sm text-muted-foreground">
        Found {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
        {searchTerm && filteredVideos.length !== videos.length && 
          ` matching "${searchTerm}" out of ${videos.length} total videos`}
      </div>
      
      {/* Video grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center p-8 bg-muted/30 rounded-md">
          <p className="text-muted-foreground">No videos match your search</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {filteredVideos.map((video) => (
              <Card key={video.videoId} className="overflow-hidden hover:bg-accent/5 transition-colors">
                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr]">
                  {/* Thumbnail */}
                  <div 
                    className="cursor-pointer" 
                    onClick={() => openVideo(video)}
                  >
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-3 flex flex-col justify-between">
                    <div>
                      <h3 
                        className="font-medium line-clamp-2 hover:text-primary cursor-pointer"
                        onClick={() => openVideo(video)}
                      >
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {video.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 sm:flex-none gap-1"
                        onClick={() => copyToClipboard(video)}
                      >
                        {copiedVideoIds[video.videoId] ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-4 w-4" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-none"
                        onClick={() => openVideo(video)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open Video</span>
                      </Button>
                      
                      {showSelectButton && onSelectVideo && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => handleSelectVideo(video)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
} 