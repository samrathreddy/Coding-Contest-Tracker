import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  rootMargin?: string;
  threshold?: number;
  root?: Element | null;
  triggerOnce?: boolean;
}

export function useIntersectionObserver({
  rootMargin = '0px',
  threshold = 0.1,
  root = null,
  triggerOnce = true,
}: UseIntersectionObserverProps = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (!window.IntersectionObserver) {
      // Fallback if IntersectionObserver isn't supported
      setIsIntersecting(true);
      return;
    }

    // Disconnect any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create a new observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);
        
        // Unobserve if it's intersecting and triggerOnce is true
        if (entry.isIntersecting && triggerOnce && elementRef.current) {
          observerRef.current?.unobserve(elementRef.current);
        }
      },
      { rootMargin, threshold, root }
    );

    // Observe the element if we have one
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [rootMargin, threshold, root, triggerOnce]);

  // Function to set the ref on an element
  const ref = (element: Element | null) => {
    if (element && elementRef.current !== element) {
      elementRef.current = element;
      
      // Observe the new element if we have an observer
      if (observerRef.current && element) {
        observerRef.current.observe(element);
      }
    }
  };

  return { ref, entry, isIntersecting };
} 