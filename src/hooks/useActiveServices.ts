import { useState, useEffect } from 'react';
import { getActiveServices, ServiceRow } from '@/services/servicesService';

export interface GroupedServices {
  category: string;
  services: ServiceRow[];
}

export function useActiveServices() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveServices().then(data => {
      setServices(data);
      setLoading(false);
    });
  }, []);

  const grouped: GroupedServices[] = services.reduce<GroupedServices[]>((acc, s) => {
    const existing = acc.find(g => g.category === s.category);
    if (existing) {
      existing.services.push(s);
    } else {
      acc.push({ category: s.category, services: [s] });
    }
    return acc;
  }, []);

  return { services, grouped, loading };
}
