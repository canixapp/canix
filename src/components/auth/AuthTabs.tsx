import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail } from 'lucide-react';

interface AuthTabsProps {
  value: 'phone' | 'email';
  onValueChange: (value: 'phone' | 'email') => void;
}

export function AuthTabs({ value, onValueChange }: AuthTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as 'phone' | 'email')} className="w-full">
      <TabsList className="w-full h-12 rounded-xl bg-muted/60 p-1 gap-1">
        <TabsTrigger
          value="phone"
          className="flex-1 h-10 rounded-lg text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          <Phone className="h-4 w-4" />
          Telefone
        </TabsTrigger>
        <TabsTrigger
          value="email"
          className="flex-1 h-10 rounded-lg text-sm font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          <Mail className="h-4 w-4" />
          E-mail
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
