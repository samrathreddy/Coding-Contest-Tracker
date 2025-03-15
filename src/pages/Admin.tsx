import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, Youtube, Save, Search, Clipboard, CheckCircle, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getEnvironmentConfig, setEnvironmentConfig } from '@/utils/env';
import { fetchAllContests } from '@/utils/api';
import { performSmartMatching } from '@/utils/api/solutions';
import { BookmarkedContest, YouTubeVideo, Platform } from '@/utils/types';
import { PLATFORMS, YOUTUBE_PLAYLISTS } from '@/utils/constants';
import { fetchPlaylistVideos } from '@/services/youtube';

const Admin = () => {
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [copiedVideoIds, setCopiedVideoIds] = useState<Record<string, boolean>>({});
  const [contests, setContests] = useState<BookmarkedContest[]>([]);
  const [fetchingContests, setFetchingContests] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [solutionLink, setSolutionLink] = useState('');
  const [savingSolution, setSavingSolution] = useState(false);
  const [smartMatchStats, setSmartMatchStats] = useState<Record<string, any> | null>(null);
  const [runningSmartMatch, setRunningSmartMatch] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const config = getEnvironmentConfig();
    if (config) {
      setYoutubeApiKey(config.youtubeApiKey || '');
      
      // If no playlist URL is set, we'll use the default ones from constants
      if (!config.youtubePlaylistUrl) {
        // Use default playlist for leetcode initially
        setYoutubePlaylistUrl(YOUTUBE_PLAYLISTS.leetcode);
      } else {
        setYoutubePlaylistUrl(config.youtubePlaylistUrl);
      }
    } else {
      // If no config exists yet, set default leetcode playlist
      setYoutubePlaylistUrl(YOUTUBE_PLAYLISTS.leetcode);
    }
    
    fetchRealContests();
  }, []);

  // Update playlist URL when platform filter changes
  useEffect(() => {
    if (filterPlatform && filterPlatform !== 'all') {
      // Update the playlist URL based on selected platform
      const platformKey = filterPlatform as Platform;
      if (YOUTUBE_PLAYLISTS[platformKey]) {
        setYoutubePlaylistUrl(YOUTUBE_PLAYLISTS[platformKey]);
        // Auto-fetch videos when platform changes
        if (youtubeApiKey) {
          fetchVideos(YOUTUBE_PLAYLISTS[platformKey]);
        }
      }
    }
  }, [filterPlatform, youtubeApiKey]);

  // Fetch real contests from API
  async function fetchRealContests() {
    try {
      setFetchingContests(true);
      
      // Use the real API to fetch all contests
      const allContests = await fetchAllContests();
      
      // Sort contests: ongoing first, then upcoming, then past
      const sorted = [...allContests].sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'ongoing') return -1;
          if (b.status === 'ongoing') return 1;
          if (a.status === 'upcoming') return -1;
          if (b.status === 'upcoming') return 1;
        }
        
        // For same status, sort by start time (newest first)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
      
      setContests(sorted.map(contest => ({
        ...contest,
        bookmarked: false // We don't need bookmarked state for this view
      })));
      
      toast({
        title: 'Contests loaded',
        description: `Loaded ${sorted.length} contests from all platforms`,
      });
    } catch (error) {
      console.error('Error fetching contests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contests. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setFetchingContests(false);
    }
  }

  // Save YouTube API settings
  const saveYoutubeSettings = async () => {
    try {
      setLoading(true);
      
      // Update configuration in localStorage
      setEnvironmentConfig({
        youtubeApiKey,
        youtubePlaylistUrl
      });
      
      toast({
        title: 'Settings saved',
        description: 'YouTube API settings have been saved successfully.',
      });
      
      // Fetch videos with the new settings
      fetchVideos();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch videos from YouTube
  const fetchVideos = async (playlistUrl?: string) => {
    const urlToUse = playlistUrl || youtubePlaylistUrl;
    
    if (!youtubeApiKey || !urlToUse) {
      toast({
        title: "Missing settings",
        description: "Please add your YouTube API key in the API Settings tab.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoadingVideos(true);
      setVideos([]); // Clear previous videos
      
      const fetchedVideos = await fetchPlaylistVideos(urlToUse, youtubeApiKey);
      setVideos(fetchedVideos);
      
      toast({
        title: 'Videos loaded',
        description: `Loaded ${fetchedVideos.length} videos from YouTube playlist`,
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch videos. Please check your API key and playlist URL.',
        variant: 'destructive'
      });
    } finally {
      setLoadingVideos(false);
    }
  };
  
  // Filter videos by search term
  const filteredVideos = useMemo(() => {
    if (!searchTerm.trim()) return videos;
    
    const term = searchTerm.toLowerCase();
    return videos.filter(video => 
      video.title.toLowerCase().includes(term) || 
      video.description.toLowerCase().includes(term)
    );
  }, [videos, searchTerm]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Filter contests by platform
  const filteredContests = useMemo(() => {
    let filtered = contests;
    
    // Filter by platform
    if (filterPlatform && filterPlatform !== 'all') {
      filtered = filtered.filter(contest => contest.platform === filterPlatform);
    }
    
    // Only show past contests for adding solutions
    filtered = filtered.filter(contest => contest.status === 'past');
    
    return filtered;
  }, [contests, filterPlatform]);
  
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
      
      // If a contest is selected, automatically set the solution link
      if (selectedContest) {
        setSolutionLink(videoUrl);
        toast({
          title: 'Link applied',
          description: `Link has been applied to ${filteredContests.find(c => c.id === selectedContest)?.name}. Click Save to confirm.`,
        });
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };
  
  // Save solution link
  const saveSolutionLink = async () => {
    if (!selectedContest || !solutionLink) {
      toast({
        title: 'Error',
        description: 'Please select a contest and enter a solution link.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSavingSolution(true);
      
      // Save solution link to localStorage
      const savedLinks = localStorage.getItem('contest-tracker-solution-links');
      const linkMap = savedLinks ? JSON.parse(savedLinks) : {};
      
      // Update link map
      linkMap[selectedContest] = solutionLink;
      
      // Save back to localStorage
      localStorage.setItem('contest-tracker-solution-links', JSON.stringify(linkMap));
      
      // Update the contest in the list
      setContests(prevContests => 
        prevContests.map(contest => 
          contest.id === selectedContest 
            ? { ...contest, solutionLink } 
            : contest
        )
      );
      
      toast({
        title: 'Success',
        description: 'Solution link added successfully!',
      });
      
      // Reset selection
      setSelectedContest('');
      setSolutionLink('');
    } catch (error) {
      console.error('Error adding solution link:', error);
      toast({
        title: 'Error',
        description: 'Failed to add solution link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingSolution(false);
    }
  };

  // Run smart matching
  const runSmartMatching = async () => {
    if (!youtubeApiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please set your YouTube API key in the API Settings tab before running Smart Match.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setRunningSmartMatch(true);
      setSmartMatchStats(null);
      
      toast({
        title: 'Smart Match Started',
        description: 'Finding solution videos for contests. This may take a moment...',
      });
      
      // Run smart matching on all contests
      const result = await performSmartMatching(contests);
      
      setSmartMatchStats(result.stats);
      
      const toastMessage = result.totalSkipped > 0 
        ? `Found solutions for ${result.totalMatched} out of ${result.totalContests - result.totalSkipped} processed contests. (${result.totalSkipped} already had manual links)`
        : `Found solutions for ${result.totalMatched} out of ${result.totalContests} contests.`;
        
      toast({
        title: 'Smart Match Complete',
        description: toastMessage,
      });
      
      // Reload contests to show the newly linked solutions
      await fetchRealContests();
      
    } catch (error) {
      console.error('Error running smart match:', error);
      toast({
        title: 'Smart Match Failed',
        description: 'An error occurred while matching contests with videos.',
        variant: 'destructive'
      });
    } finally {
      setRunningSmartMatch(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <Tabs defaultValue="solutions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solutions">Solution Links</TabsTrigger>
            <TabsTrigger value="settings">API Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="solutions" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - Contest Browser */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    Contest Solution Links
                  </CardTitle>
                  <CardDescription>
                    Manage contest solution video links for your contests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Smart Match Button */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Smart Match</h3>
                      <p className="text-xs text-muted-foreground">
                        Automatically match contests with solution videos
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      disabled={runningSmartMatch || !youtubeApiKey}
                      onClick={runSmartMatching}
                    >
                      {runningSmartMatch ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 text-yellow-500" />
                      )}
                      Smart Match
                    </Button>
                  </div>
                  
                  {/* Smart Match Stats */}
                  {smartMatchStats && (
                    <Alert className="mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">Match Results</h4>
                          <Badge variant="outline" className="px-2 py-0">
                            {smartMatchStats.matchRate}% matched
                          </Badge>
                        </div>
                        <div className="text-xs">
                          <p className="text-muted-foreground">
                            Found {smartMatchStats.matched} solutions out of {smartMatchStats.total} contests
                            {smartMatchStats.skipped > 0 && 
                              ` (${smartMatchStats.skipped} already had manual links)`}
                          </p>
                          {Object.entries(smartMatchStats.platforms).map(([platform, data]: [string, any]) => (
                            <div key={platform} className="mt-1">
                              <span className="font-medium">{PLATFORMS[platform as Platform]?.name}:</span>{' '}
                              <span>
                                {data.matched}/{data.total} 
                                {data.skipped > 0 && ` (${data.skipped} skipped)`}
                                {data.total > 0 && data.skipped < data.total ? 
                                  ` (${((data.matched / (data.total - data.skipped)) * 100).toFixed(0)}%)` : 
                                  ' (0%)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="platform">Filter by Platform</Label>
                    <Select 
                      value={filterPlatform} 
                      onValueChange={setFilterPlatform}
                    >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="All Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        {Object.entries(PLATFORMS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contest">Select Past Contest</Label>
                    {fetchingContests ? (
                      <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading contests...</span>
                      </div>
                    ) : (
                      <>
                        <Select
                          value={selectedContest}
                          onValueChange={(value) => {
                            setSelectedContest(value);
                            // Pre-fill solution link if exists
                            const contest = contests.find(c => c.id === value);
                            if (contest?.solutionLink) {
                              setSolutionLink(contest.solutionLink);
                            } else {
                              setSolutionLink('');
                            }
                          }}
                          disabled={filteredContests.length === 0}
                        >
                          <SelectTrigger id="contest">
                            <SelectValue placeholder="Select Contest" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredContests.map(contest => (
                              <SelectItem key={contest.id} value={contest.id} className="py-2 pr-2">
                                <div className="flex flex-col">
                                  <span className="font-medium">{contest.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(contest.startTime)}
                                    {contest.solutionLink && (
                                      <span className="ml-2 inline-flex items-center text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">
                                        Has Solution
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {filteredContests.length === 0 && (
                          <Alert variant="warning" className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No past contests found</AlertTitle>
                            <AlertDescription>
                              {filterPlatform === 'all' 
                                ? 'There are no past contests available to add solutions to.'
                                : `There are no past contests for ${PLATFORMS[filterPlatform as Platform]?.name}.`
                              }
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                  
                  {selectedContest && (
                    <div className="space-y-2">
                      <Label htmlFor="solutionLink">YouTube Solution Link</Label>
                      <div className="flex gap-2">
                        <Input
                          id="solutionLink"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={solutionLink}
                          onChange={(e) => setSolutionLink(e.target.value)}
                          disabled={!selectedContest || savingSolution}
                          className="flex-1"
                        />
                        <Button 
                          onClick={saveSolutionLink}
                          disabled={savingSolution || !selectedContest || !solutionLink}
                        >
                          {savingSolution ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="sr-only">Save</span>
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Select a video from the list on the right and click "Copy URL" to use it as a solution link
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Right side - YouTube Video Browser */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Youtube className="h-5 w-5 mr-2" />
                    YouTube Videos
                  </CardTitle>
                  <CardDescription>
                    Browse videos from {filterPlatform !== 'all' 
                      ? `the ${PLATFORMS[filterPlatform as Platform]?.name} playlist` 
                      : 'the playlist'
                    }. Click "Copy URL" to use as solution link.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!youtubeApiKey ? (
                    <Alert variant="warning">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>API Key Required</AlertTitle>
                      <AlertDescription>
                        Please add your YouTube API key in the API Settings tab to load videos.
                      </AlertDescription>
                    </Alert>
                  ) : loadingVideos ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <Youtube className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No videos loaded</p>
                      <Button onClick={() => fetchVideos()}>Load Videos</Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search videos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Found {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
                        {searchTerm && filteredVideos.length !== videos.length && 
                          ` matching "${searchTerm}" out of ${videos.length} total videos`}
                      </div>
                      
                      {filteredVideos.length === 0 ? (
                        <div className="text-center p-8 bg-muted/30 rounded-md">
                          <p className="text-muted-foreground">No videos match your search</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {filteredVideos.map((video) => (
                              <div 
                                key={video.videoId} 
                                className="p-3 rounded-md border hover:bg-accent/5 transition-colors"
                              >
                                <div className="flex gap-3">
                                  <img 
                                    src={video.thumbnailUrl} 
                                    alt={video.title} 
                                    className="w-24 h-16 object-cover rounded"
                                  />
                                  <div className="flex-1 flex flex-col justify-between">
                                    <h3 className="font-medium text-sm line-clamp-2">
                                      {video.title}
                                    </h3>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-1 gap-1 justify-self-end self-start"
                                      onClick={() => copyToClipboard(video)}
                                    >
                                      {copiedVideoIds[video.videoId] ? (
                                        <>
                                          <CheckCircle className="h-3 w-3" />
                                          <span>Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clipboard className="h-3 w-3" />
                                          <span>Copy URL</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* API Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  YouTube API Settings
                </CardTitle>
                <CardDescription>
                  Set up your YouTube API for contest solution integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  saveYoutubeSettings();
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtubeApiKey">YouTube API Key</Label>
                    <Input
                      id="youtubeApiKey"
                      type="password"
                      placeholder="Enter your YouTube API key"
                      value={youtubeApiKey}
                      onChange={(e) => setYoutubeApiKey(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Create a YouTube API key from the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtubePlaylistUrl">Playlist URL (Optional)</Label>
                    <Input
                      id="youtubePlaylistUrl"
                      placeholder="Enter a YouTube playlist URL"
                      value={youtubePlaylistUrl}
                      onChange={(e) => setYoutubePlaylistUrl(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-sm text-muted-foreground">
                      If not specified, platform-specific playlists will be used
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
