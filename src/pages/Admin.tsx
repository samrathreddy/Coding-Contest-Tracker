import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, Youtube, Save, Search, Clipboard, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEnvironmentConfig, setEnvironmentConfig } from '@/utils/env';
import { fetchAllContests } from '@/utils/api';
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="manage-solutions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage-solutions">Manage Solutions</TabsTrigger>
            <TabsTrigger value="api-settings">API Settings</TabsTrigger>
          </TabsList>
          
          {/* Manage Solutions Tab - Combined Interface */}
          <TabsContent value="manage-solutions" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left side - Contest Selection */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Past Contests</CardTitle>
                    <CardDescription>
                      Select a contest to add or update its solution link
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={fetchRealContests}
                    disabled={fetchingContests}
                  >
                    <RefreshCw className={`h-4 w-4 ${fetchingContests ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
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
          <TabsContent value="api-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>YouTube API Settings</CardTitle>
                <CardDescription>
                  Configure your YouTube API key to enable video browsing functionality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="warning" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Information</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      The YouTube API key is stored in your browser's localStorage and is only used for
                      fetching videos on your device. Never share your API key with others.
                    </p>
                    <a
                      href="https://developers.google.com/youtube/v3/getting-started"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Learn more about the YouTube Data API v3
                    </a>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-api-key">YouTube API Key</Label>
                    <Input
                      id="youtube-api-key"
                      type="password"
                      placeholder="Enter your YouTube Data API v3 key"
                      value={youtubeApiKey}
                      onChange={(e) => setYoutubeApiKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from the <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Cloud Console
                      </a>
                    </p>
                  </div>
                  
                  <Alert className="bg-muted">
                    <p className="text-sm text-foreground">
                      <strong>Note:</strong> This app automatically uses the relevant YouTube playlists for each platform.
                      When you select a platform in the Manage Solutions tab, the appropriate playlist will be loaded.
                    </p>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={saveYoutubeSettings}
                  disabled={loading}
                  className="ml-auto"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
