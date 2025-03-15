import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Award, Menu, Settings, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/70 border-b border-border shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="font-semibold text-lg">
              Contest Tracker
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 justify-center">
            <Link to="/">
              <Button variant={location.pathname === '/' ? 'default' : 'ghost'}>
                Contests
              </Button>
            </Link>
            <Link to="/videos">
              <Button variant={location.pathname === '/videos' ? 'default' : 'ghost'}>
                Videos
              </Button>
            </Link>
          </nav>
          
          <div className="flex items-center justify-end">
            <ThemeToggle />
            <div className="block md:hidden ml-2">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle menu">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="container py-3 flex flex-col space-y-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={location.pathname === '/' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                >
                  Contests
                </Button>
              </Link>
              <Link to="/videos" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={location.pathname === '/videos' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                >
                  Videos
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1 container py-6 md:py-8">
        {children}
      </main>
      
      <footer className="border-t border-border py-6 bg-muted/50">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Stay updated with competitive programming contests
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Contest Tracker
          </p>
        </div>
      </footer>
    </div>
  );
}
