
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      
      if (difference <= 0) {
        if (onExpire) onExpire();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference
      };
    };
    
    // Update immediately
    setTimeLeft(calculateTimeLeft());
    
    // Then update every second
    const timerId = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timerId);
      }
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [targetDate, onExpire]);
  
  // Format time with leading zeros
  const formatTime = (value: number): string => {
    return value < 10 ? `0${value}` : value.toString();
  };
  
  // If time is up
  if (timeLeft.total <= 0) {
    return (
      <div className="flex items-center text-success font-semibold">
        <Clock className="h-4 w-4 mr-1" />
        <span>Started!</span>
      </div>
    );
  }
  
  // For contests in the future
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {timeLeft.days > 0 && (
        <div className="flex items-center justify-center bg-primary/10 rounded-md px-2 py-1">
          <span className="text-primary">{timeLeft.days}</span>
          <span className="text-primary text-xs ml-1">d</span>
        </div>
      )}
      <div className="flex items-center justify-center bg-primary/10 rounded-md px-2 py-1">
        <span className="text-primary">{formatTime(timeLeft.hours)}</span>
        <span className="text-primary text-xs ml-1">h</span>
      </div>
      <div className="flex items-center justify-center bg-primary/10 rounded-md px-2 py-1">
        <span className="text-primary">{formatTime(timeLeft.minutes)}</span>
        <span className="text-primary text-xs ml-1">m</span>
      </div>
      <div className="flex items-center justify-center bg-primary/10 rounded-md px-2 py-1">
        <span className="text-primary">{formatTime(timeLeft.seconds)}</span>
        <span className="text-primary text-xs ml-1">s</span>
      </div>
    </div>
  );
}
