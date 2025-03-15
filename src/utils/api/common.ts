import { toast } from '@/components/ui/use-toast';

// Helper function to create a delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Common fetch headers
export const FETCH_HEADERS = {
  'Accept': '*/*',
  'User-Agent': 'Thunder Client (https://www.thunderclient.com)'
};

// Browser-like fetch headers for more complex sites
export const BROWSER_FETCH_HEADERS = {
  ...FETCH_HEADERS,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0'
};

// Storage key for solution links
export const SOLUTION_LINKS_KEY = 'contest-tracker-solution-links';

// Helper function to display error toast
export const showErrorToast = (message: string) => {
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive'
  });
}; 