import { useEffect, useState } from 'react';
import { Home, Scissors, CalendarPlus, Image, MapPin } from 'lucide-react';

const sideItems = [
  { id: 'inicio', icon: Home, label: 'Home' },
  { id: 'servicos', icon: Scissors, label: 'Serviços' },
  { id: 'fotos', icon: Image, label: 'Fotos' },
  { id: 'localizacao', icon: MapPin, label: 'Local' },
];

const sectionIds = ['inicio', 'servicos', 'agenda', 'fotos', 'localizacao'];

export function BottomNav() {
  const [activeId, setActiveId] = useState('inicio');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActiveId(id);
      }, { threshold: 0.3 });
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const handleNavClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAgendarClick = () => {
    const calendarEl = document.getElementById('agenda-wizard') || document.getElementById('agenda');
    if (calendarEl) calendarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const leftItems = sideItems.slice(0, 2);
  const rightItems = sideItems.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="relative bg-background rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 px-2 pb-1 pt-1">
          {leftItems.map(item => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] transition-colors duration-200">
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
              </button>
            );
          })}

          <div className="flex flex-col items-center gap-0.5 -translate-y-3">
            <button onClick={handleAgendarClick} className="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform duration-150 hover:bg-primary/90">
              <CalendarPlus className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-medium text-primary">Agendar</span>
          </div>

          {rightItems.map(item => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] transition-colors duration-200">
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
