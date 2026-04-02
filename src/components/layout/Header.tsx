import { useState } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Menu, LogOut } from 'lucide-react';
import logoPetDefault from '@/assets/logopet.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBranding } from '@/contexts/BrandingContext';
import { MobileDrawerMenu } from '@/components/layout/MobileDrawerMenu';
import { NotificationBell } from '@/components/notifications/NotificationBell';

import { useTestModes } from '@/contexts/TestModesContext';

interface HeaderProps {
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

const navLinks = [
  { href: '#inicio', label: 'Início' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#valores', label: 'Valores' },
  { href: '#agenda', label: 'Agenda' },
  { href: '#fotos', label: 'Fotos' },
  { href: '#avaliacoes', label: 'Avaliações' },
  { href: '#localizacao', label: 'Localização' },
];

export function Header({ onOpenLogin, onOpenRegister }: HeaderProps) {
  const handleOpenLogin = onOpenLogin || (() => navigate('/auth/login'));
  const handleOpenRegister = onOpenRegister || (() => navigate('/auth/register'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, user, logout, canAccessDashboard, canModerate } = useAuth();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { clientModeActive } = useTestModes();
  const logoSrc = branding.logoUrl || logoPetDefault;
  const shopName = branding.shopName;

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const showAdminLink = isAuthenticated && !clientModeActive && (canAccessDashboard() || canModerate());
  const firstName = user?.name?.split(' ')[0] || '';

  const handleAdminClick = () => {
    if (canAccessDashboard()) navigate('/admin/dashboard');
    else if (canModerate()) navigate('/admin/moderacao');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <a href="#inicio" className="flex items-center gap-2" onClick={() => scrollToSection('#inicio')}>
              <OptimizedImage src={logoSrc} alt={shopName} className="h-7 w-auto max-w-[120px] max-h-7 object-contain" showSkeleton={false} />
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button key={link.href} onClick={() => scrollToSection(link.href)} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </button>
              ))}
              {isAuthenticated && (user?.role === 'cliente' || clientModeActive) && (
                <button onClick={() => navigate('/perfil')} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Área do Cliente
                </button>
              )}
            </nav>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-3">
              
              <NotificationBell />
              <ThemeToggle />
              {showAdminLink && (
                <Button variant="outline" size="sm" onClick={handleAdminClick} className="text-primary border-primary/30">
                  Painel Admin
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Olá, <span className="font-medium text-foreground">{firstName}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleOpenLogin}>Entrar</Button>
                  <Button variant="outline" size="sm" onClick={handleOpenRegister}>Cadastrar</Button>
                </>
              )}
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={() => {
                const calendarEl = document.getElementById('agenda-wizard') || document.getElementById('agenda');
                if (calendarEl) calendarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                Agendar
              </Button>
            </div>

            {/* Mobile: theme toggle + hamburger */}
            <div className="lg:hidden flex items-center gap-1">
              
              <NotificationBell />
              <ThemeToggle />
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Premium mobile drawer */}
      <MobileDrawerMenu
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />
    </>
  );
}
