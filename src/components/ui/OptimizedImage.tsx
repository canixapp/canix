import { useState, useRef, useEffect, useCallback, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  showSkeleton?: boolean;
  skeletonClassName?: string;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
}

const FALLBACK_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCBmaWxsPSJoc2woMjQwIDQuOCUgOTUuOSUpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjxwYXRoIGZpbGw9ImhzbCgyNDAgMy44JSA0Ni4xJSkiIGQ9Ik0xMDAgNjBjLTE2LjU3IDAtMzAgMTMuNDMtMzAgMzAgMCAxNi41NyAxMy40MyAzMCAzMCAzMHMzMC0xMy40MyAzMC0zMGMwLTE2LjU3LTEzLjQzLTMwLTMwLTMwem0wIDQ4Yy05LjkzIDAtMTgtOC4wNy0xOC0xOHM4LjA3LTE4IDE4LTE4IDE4IDguMDcgMTggMTgtOC4wNyAxOC0xOCAxOHptLTQwIDQyaDgwdjRINjB2LTR6Ii8+PC9zdmc+';

/**
 * OptimizedImage - Reusable image component with:
 * - IntersectionObserver-based lazy loading
 * - Skeleton placeholder while loading
 * - Error fallback
 * - Smooth fade-in transition
 */
export function OptimizedImage({
  src,
  alt,
  fallback = FALLBACK_PLACEHOLDER,
  aspectRatio = 'auto',
  showSkeleton = true,
  skeletonClassName,
  className,
  style,
  onLoadSuccess,
  onLoadError,
  ...props
}: OptimizedImageProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // IntersectionObserver for true lazy loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Start loading when in view
  useEffect(() => {
    if (isInView && status === 'idle' && src) {
      setStatus('loading');
    }
  }, [isInView, status, src]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
    onLoadSuccess?.();
  }, [onLoadSuccess]);

  const handleError = useCallback(() => {
    setStatus('error');
    onLoadError?.();
  }, [onLoadError]);

  const aspectRatioClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
        ? 'aspect-video'
        : '';

  const showSkeletonPlaceholder = showSkeleton && (status === 'idle' || status === 'loading');
  const showImage = status === 'loaded' || status === 'error';
  const imageSrc = status === 'error' ? fallback : src;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', aspectRatioClass, className)}
      style={style}
    >
      {/* Skeleton placeholder */}
      {showSkeletonPlaceholder && (
        <Skeleton className={cn('absolute inset-0', skeletonClassName)} />
      )}

      {/* Image element - only render when in view */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            showImage ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Preload critical images
 * Use for hero images and above-the-fold content
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Hook for preloading multiple images
 */
export function usePreloadImages(srcs: string[]) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (srcs.length === 0) {
      setLoaded(true);
      return;
    }

    Promise.all(srcs.filter(Boolean).map(preloadImage))
      .then(() => setLoaded(true))
      .catch(() => setLoaded(true)); // Still mark as loaded on error

    return () => {};
  }, [srcs.join(',')]);

  return loaded;
}
