import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Platform } from '@/utils/types';
import { PLATFORMS } from '@/utils/constants';

// Local interface for contest data
interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  solutionLink?: string;
}

export function SolutionLinkForm() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingContests, setFetchingContests] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('');
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [solutionLink, setSolutionLink] = useState('');
  const [inputTab, setInputTab] = useState<'manual' | 'list'>('manual');

  // Fetch all contests when component mounts
  useEffect(() => {
    async function fetchContests() {
      try {
        setFetchingContests(true);
        // Let's use a simplified approach for this tutorial - fetch from localStorage
        // In a real app, you would fetch from your API or use the fetchAllContests function
        
        // Mock call to simulate fetching contests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in a real app, you'd fetch this from your API
        const mockContests: Contest[] = [
          { id: 'leetcode-weekly-350', name: 'LeetCode Weekly Contest 350', platform: 'leetcode', startTime: '2023-06-11T02:30:00.000Z' },
          { id: 'leetcode-biweekly-105', name: 'LeetCode Biweekly Contest 105', platform: 'leetcode', startTime: '2023-06-24T13:30:00.000Z' },
          { id: 'codeforces-round-886', name: 'Codeforces Round #886 (Div. 4)', platform: 'codeforces', startTime: '2023-07-21T13:35:00.000Z' },
          { id: 'codechef-starter-91', name: 'CodeChef Starters 91', platform: 'codechef', startTime: '2023-06-28T13:30:00.000Z' },
        ];
        
        // Load saved solution links from localStorage
        const savedLinks = localStorage.getItem('contest-tracker-solution-links');
        const linkMap = savedLinks ? JSON.parse(savedLinks) : {};
        
        // Add solution links to contests if available
        const contestsWithLinks = mockContests.map(contest => ({
          ...contest,
          solutionLink: linkMap[contest.id] || null
        }));
        
        setContests(contestsWithLinks);
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
    
    fetchContests();
  }, []);
  
  // Filter contests based on selected platform
  const filteredContests = filterPlatform && filterPlatform !== 'all'
    ? contests.filter(contest => contest.platform === filterPlatform) 
    : contests;
  
  // Handle selecting a video from the list
  const handleSelectVideo = (videoUrl: string) => {
    setSolutionLink(videoUrl);
    setInputTab('manual'); // Switch back to manual tab to show the selected link
    
    toast({
      title: 'Video selected',
      description: 'YouTube video URL added to the form',
    });
  };
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedContest || !solutionLink) {
      toast({
        title: 'Error',
        description: 'Please select a contest and enter a solution link.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      
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
      
      // Reset form
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
      setLoading(false);
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Step 1: Filter by Platform */}
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
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
      
      {/* Step 2: Select Contest */}
      <div className="space-y-2">
        <Label htmlFor="contest">Contest</Label>
        {fetchingContests ? (
          <div className="flex items-center gap-2 p-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading contests...</span>
          </div>
        ) : (
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
                <SelectItem key={contest.id} value={contest.id} className="flex items-center">
                  <div>
                    {contest.name}
                    {contest.solutionLink && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">
                        Has Solution
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {!fetchingContests && filteredContests.length === 0 && (
          <p className="text-sm text-amber-500 mt-1">
            No past contests found for this platform
          </p>
        )}
      </div>
      
      {/* Step 3: Solution Link */}
      <div className="space-y-2">
        <Label htmlFor="solutionLink">YouTube Solution Link</Label>
        
        <Tabs value={inputTab} onValueChange={(value) => setInputTab(value as 'manual' | 'list')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Enter Manually</TabsTrigger>
            <TabsTrigger value="list">Browse Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 pt-4">
            <Input
              id="solutionLink"
              placeholder="https://www.youtube.com/watch?v=..."
              value={solutionLink}
              onChange={(e) => setSolutionLink(e.target.value)}
              disabled={!selectedContest || loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter a YouTube video URL for this contest solution
            </p>
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4 pt-4">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm">Select a video from your playlist to use as a solution for this contest.</p>
            </div>
            
            {/* Use YouTubeVideoList component to browse videos */}
            {/* This would be integrated with the YouTubeVideoList component */}
            <div className="bg-muted/30 p-6 rounded-md text-center">
              <p className="text-muted-foreground">
                Video browsing is enabled in the "Browse Videos" tab. Copy a video URL and paste it here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={loading || !selectedContest || !solutionLink}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Solution Link'
        )}
      </Button>
    </div>
  );
} 