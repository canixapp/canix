import { Skeleton } from '@/components/ui/skeleton';

/** Services section — 3 card skeletons */
export function ServicesSkeleton() {
  return (
    <section id="servicos" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-3">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
        <div className="flex items-center gap-4 mb-10">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-card rounded-2xl border border-border/60 p-7 space-y-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Pricing section — tab bar + 3 card skeletons */
export function PricingSkeleton() {
  return (
    <section id="valores" className="py-20 bg-muted/50 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 bg-background rounded-2xl border border-border space-y-3">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Gallery section — grid of image skeletons */
export function GallerySkeleton() {
  return (
    <section id="fotos" className="py-20 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Reviews section — single review card skeleton */
export function ReviewsSkeleton() {
  return (
    <section id="avaliacoes" className="py-20 bg-muted/50 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-10 w-56 mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
        <div className="max-w-2xl mx-auto text-center space-y-6 py-8">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="w-5 h-5 rounded" />
            ))}
          </div>
          <Skeleton className="h-6 w-4/5 mx-auto" />
          <Skeleton className="h-6 w-3/5 mx-auto" />
          <div className="flex items-center justify-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
