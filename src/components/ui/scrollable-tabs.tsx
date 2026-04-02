import { useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableTabsProps {
  children: ReactNode;
  className?: string;
  /** Show "Arraste para ver mais" hint on mobile when overflowing */
  showHint?: boolean;
}

/**
 * Premium scrollable tab bar wrapper.
 * Wraps a <TabsList> and adds edge-fade gradients + chevron arrows
 * when content overflows horizontally. Includes a nudge animation
 * on first render (mobile only) to hint that more items exist.
 */
export function ScrollableTabs({ children, className, showHint = true }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Nudge animation on mobile: scroll right then back to hint at more items
    const isMobile = window.innerWidth < 768;
    if (isMobile && el && el.scrollWidth > el.clientWidth) {
      const timeout = setTimeout(() => {
        el.scrollTo({ left: 60, behavior: 'smooth' });
        setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 600);
      }, 400);
      return () => {
        clearTimeout(timeout);
        el?.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }

    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });

  return (
    <div className={cn("space-y-1", className)}>
      {/* Hint text – always in DOM, visibility via opacity to avoid layout shifts */}
      {showHint && (
        <div
          className="h-[18px] flex items-center gap-1 pl-1 md:hidden transition-opacity duration-300 ease-out"
          style={{ opacity: showRight ? 0.5 : 0 }}
        >
          <span className="text-[10px] text-muted-foreground">Arraste para ver mais</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      )}

      <div className="relative">
        {/* Left arrow */}
        {showLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Scrollable area */}
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-0.5"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {children}
        </div>

        {/* Right arrow */}
        {showRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Edge fade gradients – always in DOM, controlled via opacity */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5] md:hidden rounded-l-xl transition-opacity duration-250"
          style={{ opacity: showLeft ? 1 : 0 }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-10 z-[5] pointer-events-none md:hidden flex items-center justify-end pr-1 transition-opacity duration-250"
          style={{ opacity: showRight ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent rounded-r-xl" />
          <ChevronRight className="relative w-4 h-4 text-muted-foreground/40" />
        </div>
      </div>
    </div>
  );
}

/** Standard premium tab trigger class for consistency across all admin pages */
export const premiumTabClass =
  "rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-sm min-h-[36px] sm:min-h-[44px] whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 transition-all duration-200";

/** Standard premium TabsList class */
export const premiumTabListClass =
  "inline-flex h-10 w-max gap-0.5 bg-muted/50 backdrop-blur-sm p-1 rounded-full border border-border/30";
