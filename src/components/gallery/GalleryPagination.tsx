import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryPaginationProps {
  selectedCategory: string;
  totalPages: number;
  page: number;
  setPage: (fn: (p: number) => number) => void;
}

export function GalleryPagination({ selectedCategory, totalPages, page, setPage }: GalleryPaginationProps) {
  if (selectedCategory !== 'all' || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="gap-1">
        <ChevronLeft className="w-4 h-4" /> Anterior
      </Button>
      <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="gap-1">
        Próximo <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
