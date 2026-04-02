import { ReactNode } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Link } from 'react-router-dom';
import { useBranding } from '@/contexts/BrandingContext';
import logoPetDefault from '@/assets/logopet.png';
import petTexture from '@/assets/pet-texture-gray.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { branding } = useBranding();
  const logoSrc = branding.logoUrl || logoPetDefault;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/[0.04] via-background to-muted/30 dark:from-background dark:via-background dark:to-primary/[0.06] relative overflow-hidden">
      {/* Paw texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.03]" style={{
        backgroundImage: `url(${petTexture})`,
        backgroundSize: '400px 400px',
        backgroundRepeat: 'repeat',
      }} />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] dark:bg-primary/[0.06] blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <div className="sticky top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-3.5 py-2 shadow-sm hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar para o site</span>
          <span className="sm:hidden">Voltar</span>
        </Link>
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-full shadow-sm hover:shadow-md transition-all">
          <ThemeToggle />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 pb-20 sm:pb-6">
        <div className="w-full max-w-[420px] relative z-[1]">
          <div className="bg-card/95 backdrop-blur-sm rounded-3xl border border-border/40 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.08)] dark:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] p-6 sm:p-9 space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center gap-2.5 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/50 border border-border/30 flex items-center justify-center shadow-sm overflow-hidden">
                <OptimizedImage src={logoSrc} alt={branding.shopName} className="h-9 sm:h-10 w-auto max-w-[120px] max-h-10 object-contain" showSkeleton={false} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
