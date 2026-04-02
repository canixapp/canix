import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCommentsForPhoto, addComment, type GalleryComment } from '@/services/galleryCommentsService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface Props {
  photoId: string;
  isAuthenticated: boolean;
}

export function PhotoComments({ photoId, isAuthenticated }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setShowAll(false);
    getCommentsForPhoto(photoId).then(c => {
      setComments(c);
      setLoaded(true);
    });
  }, [photoId]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Faça login para comentar.');
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast.error('Comentário muito longo (máx. 500 caracteres).');
      return;
    }
    setSending(true);
    const result = await addComment(photoId, user.id, user.name, user.avatarUrl || null, trimmed);
    if (result) {
      setComments(prev => [...prev, result]);
      setText('');
    } else {
      toast.error('Erro ao enviar comentário.');
    }
    setSending(false);
  };

  const visible = showAll ? comments : comments.slice(0, 3);
  const hasMore = comments.length > 3 && !showAll;

  return (
    <div className="px-4 pb-3">
      {/* Comments list */}
      {loaded && comments.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {visible.map(c => (
            <div key={c.id} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5">
                {c.user_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                  <span className="font-semibold">{c.user_name}</span>{' '}
                  <span className="text-muted-foreground">{c.comment_text}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {getTimeAgo(c.created_at)}
                </p>
              </div>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-primary font-medium hover:underline"
            >
              Ver todos os {comments.length} comentários
            </button>
          )}
        </div>
      )}

      {loaded && comments.length === 0 && (
        <p className="text-xs text-muted-foreground/50 mb-3">Nenhum comentário ainda</p>
      )}

      {/* Comment input */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
            {user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5 border border-border/30">
          <input
            type="text"
            placeholder={isAuthenticated ? 'Escreva um comentário...' : 'Faça login para comentar'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            disabled={!isAuthenticated || sending}
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50"
          />
          {text.trim() && (
            <button
              onClick={handleSubmit}
              disabled={sending}
              className={cn(
                'p-1 rounded-full text-primary transition-all',
                sending ? 'opacity-50' : 'hover:bg-primary/10 active:scale-90'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}sem`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}
