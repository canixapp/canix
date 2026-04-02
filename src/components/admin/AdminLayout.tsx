import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Desktop sidebar */}
      <div className="animate-fade-in">
        <AdminSidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header
          className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 overflow-y-auto">
                <div onClick={(e) => {
                  // Only close the sheet when clicking an actual navigation link (anchor/NavLink)
                  const target = e.target as HTMLElement;
                  if (target.closest('a[href]')) setMobileOpen(false);
                }}>
                  <AdminSidebar collapsed={false} onToggle={toggle} mobile />
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium text-foreground">
              {user?.name} <span className="text-xs text-muted-foreground ml-1 capitalize">({user?.role})</span>
            </span>
            
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
