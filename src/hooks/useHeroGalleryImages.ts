import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

/**
 * Fetches a small random set of approved gallery photos for use in hero bubbles.
 * Returns up to `count` unique URLs. Falls back to empty array (caller provides defaults).
 */
export function useHeroGalleryImages(count = 3) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      // Fetch a modest pool so we can pick randomly client-side
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('url')
        .eq('petshop_id', PETSHOP_ID)
        .eq('moderation_status', 'aprovado')
        .order('created_at', { ascending: false })
        .limit(20);

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        setLoaded(true);
        return;
      }

      // Shuffle and pick `count` unique
      const shuffled = data
        .map(r => r.url)
        .filter(Boolean)
        .sort(() => Math.random() - 0.5);

      setUrls(shuffled.slice(0, count));
      setLoaded(true);
    }

    fetch();
    return () => { cancelled = true; };
  }, [count]);

  return { urls, loaded };
}
