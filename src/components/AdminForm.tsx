
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { fetchAllContests, addSolutionLink, fetchYouTubeVideos } from '@/utils/api';
import { Contest, Platform, YouTubeVideo } from '@/utils/types';
import { toast } from '@/components/ui/use-toast';
import { PLATFORMS, YOUTUBE_PLAYLISTS } from '@/utils/constants';
import { Loader2, Youtube, LinkIcon, ExternalLink } from 'lucide-react';

// Define form schema with Zod
const formSchema = z.object({
  contestId: z.string({
    required_error: 'Please select a contest.',
  }),
  platform: z.enum(['codeforces', 'codechef', 'leetcode'] as const, {
    required_error: 'Please select a platform.',
  }),
  solutionLink: z.string({
    required_error: 'Please enter a YouTube link.',
  }).url('Please enter a valid URL'),
});

type FormValues = z.infer<typeof formSchema>;

export function AdminForm() {
  const [pastContests, setPastContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVideos, setFetchingVideos] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contestId: '',
      platform: 'codeforces',
      solutionLink: '',
    },
  });
  
  // Get the selected platform
  const selectedPlatform = form.watch('platform') as Platform;
  
  // Fetch past contests when component mounts
  useEffect(() => {
    async function fetchPastContests() {
      try {
        setLoading(true);
        const allContests = await fetchAllContests();
        const past = allContests.filter(contest => contest.status === 'past');
        setPastContests(past);
      } catch (error) {
        console.error('Error fetching contests:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch contests. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchPastContests();
  }, []);
  
  // Fetch YouTube videos when selected platform changes
  useEffect(() => {
    async function fetchVideos() {
      if (!selectedPlatform) return;
      
      try {
        setFetchingVideos(true);
        const videos = await fetchYouTubeVideos(selectedPlatform);
        setYoutubeVideos(videos);
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      } finally {
        setFetchingVideos(false);
      }
    }
    
    fetchVideos();
  }, [selectedPlatform]);
  
  // Filter contests based on selected platform
  const filteredContests = pastContests.filter(
    contest => contest.platform === selectedPlatform
  );
  
  // Handle form submission
  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);
      
      const success = await addSolutionLink(values.contestId, values.solutionLink);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Solution link added successfully!',
          variant: 'default',
        });
        
        form.reset();
      } else {
        throw new Error('Failed to add solution link');
      }
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
    <Card className="w-full max-w-3xl mx-auto border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Add Solution Link</CardTitle>
        <CardDescription>
          Connect YouTube solution videos to past contests
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Platform Selection */}
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PLATFORMS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <a 
                      href={YOUTUBE_PLAYLISTS[selectedPlatform]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-primary hover:underline"
                    >
                      <Youtube className="h-3 w-3" />
                      View {PLATFORMS[selectedPlatform].name} YouTube Playlist
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Contest Selection */}
            <FormField
              control={form.control}
              name="contestId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contest</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading || filteredContests.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Contest" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredContests.map(contest => (
                        <SelectItem key={contest.id} value={contest.id}>
                          {contest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* YouTube Link */}
            <FormField
              control={form.control}
              name="solutionLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Solution Link</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        {...field} 
                        disabled={loading}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Paste the YouTube video URL for this contest solution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* YouTube Videos Section */}
            {youtubeVideos.length > 0 && (
              <div className="mt-6 border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Youtube className="h-4 w-4 text-red-500" />
                  Available YouTube Videos
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {youtubeVideos.map(video => (
                    <div 
                      key={video.videoId} 
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => {
                        const url = `https://www.youtube.com/watch?v=${video.videoId}`;
                        form.setValue('solutionLink', url);
                      }}
                    >
                      <div className="w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open video</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {fetchingVideos && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading videos...
                </span>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save Solution Link'}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <p className="text-xs text-muted-foreground">
          Adding solution links helps learners find video explanations for contests
        </p>
      </CardFooter>
    </Card>
  );
}
