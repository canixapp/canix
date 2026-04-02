import { Skeleton } from '@/components/ui/skeleton';

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
        </div>
      </header>

      <main className="pt-16 pb-24 lg:pb-8">
        {/* Greeting */}
        <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>

        {/* Quick shortcuts */}
        <div className="px-4 pb-2 max-w-2xl mx-auto">
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>

        {/* Upcoming appointments */}
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <Skeleton className="h-5 w-48 mb-3" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pets */}
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-[140px] bg-card rounded-2xl border border-border p-4 flex flex-col items-center gap-2">
                <Skeleton className="w-14 h-14 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Recommended */}
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <Skeleton className="h-5 w-44 mb-3" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-[160px] bg-card rounded-2xl border border-border p-4 space-y-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="w-9 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
