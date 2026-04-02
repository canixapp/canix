import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { PETSHOP_ID } from '@/lib/constants';
import type { AppointmentRow } from '@/services/appointmentsService';
import type { ProfileRow } from '@/services/profilesService';

export interface DemoConfig {
  clients: number;
  pets: number;
  appointments: number;
  revenue: number;
}

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  clients: 4,
  pets: 4,
  appointments: 8,
  revenue: 3420,
};

export interface DemoData {
  clients: { name: string; phone: string }[];
  pets: { name: string; breed: string; size: string; ownerIndex: number }[];
  appointments: {
    service_name: string;
    petName: string;
    date: string;
    time: string;
    status: string;
    price: number;
    payment_status: string;
    payment_method: string;
  }[];
  revenue: number;
  pending: number;
  // Shaped data for AdminContext injection
  profileRows: ProfileRow[];
  appointmentRows: AppointmentRow[];
}

interface TestModesContextType {
  proModeActive: boolean;
  toggleProMode: () => void;
  basicModeActive: boolean;
  toggleBasicMode: () => void;
  clientModeActive: boolean;
  toggleClientMode: () => void;
  demoModeActive: boolean;
  toggleDemoMode: () => void;
  demoData: DemoData | null;
  demoConfig: DemoConfig;
  setDemoConfig: (config: DemoConfig) => void;
  clearDemoData: () => void;
  regenerateDemoData: () => void;
  anyModeActive: boolean;
  activeModes: string[];
}

const TestModesContext = createContext<TestModesContextType | undefined>(undefined);

const CLIENT_POOL = [
  { name: 'João Silva', phone: '11999990001' },
  { name: 'Maria Souza', phone: '11999990002' },
  { name: 'Carlos Mendes', phone: '11999990003' },
  { name: 'Fernanda Oliveira', phone: '11999990004' },
  { name: 'Ana Paula Costa', phone: '11999990005' },
  { name: 'Ricardo Santos', phone: '11999990006' },
  { name: 'Juliana Almeida', phone: '11999990007' },
  { name: 'Pedro Henrique', phone: '11999990008' },
  { name: 'Camila Rocha', phone: '11999990009' },
  { name: 'Lucas Ferreira', phone: '11999990010' },
];

const PET_POOL = [
  { name: 'Thor', breed: 'Shih-tzu', size: 'pequeno' },
  { name: 'Luna', breed: 'Poodle', size: 'medio' },
  { name: 'Bob', breed: 'Golden Retriever', size: 'grande' },
  { name: 'Nina', breed: 'Yorkshire', size: 'pequeno' },
  { name: 'Max', breed: 'Labrador', size: 'grande' },
  { name: 'Mel', breed: 'Maltês', size: 'pequeno' },
  { name: 'Rex', breed: 'Pastor Alemão', size: 'grande' },
  { name: 'Bella', breed: 'Lhasa Apso', size: 'pequeno' },
  { name: 'Simba', breed: 'Spitz', size: 'medio' },
  { name: 'Pipoca', breed: 'SRD', size: 'medio' },
];

const SERVICES = ['Banho', 'Tosa', 'Banho + Tosa', 'Tosa higiênica', 'Hidratação'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const STATUSES = ['confirmado', 'confirmado', 'pendente', 'realizado', 'realizado', 'realizado'];
const PAYMENT_METHODS = ['pix', 'cartao', 'dinheiro', 'pix'];

function generateDemoData(config: DemoConfig): DemoData {
  const today = new Date();
  const clientCount = Math.min(config.clients, CLIENT_POOL.length);
  const petCount = Math.min(config.pets, PET_POOL.length);
  const aptCount = config.appointments;

  const clients = CLIENT_POOL.slice(0, clientCount);
  const pets = PET_POOL.slice(0, petCount).map((p, i) => ({ ...p, ownerIndex: i % clientCount }));

  const appointments: DemoData['appointments'] = [];
  let totalRevenue = 0;
  let totalPending = 0;

  for (let i = 0; i < aptCount; i++) {
    const pet = pets[i % petCount];
    const service = SERVICES[i % SERVICES.length];
    const dayOffset = i < 3 ? 0 : i < 5 ? 1 : -(i - 4);
    const date = format(dayOffset >= 0 ? addDays(today, dayOffset) : subDays(today, Math.abs(dayOffset)), 'yyyy-MM-dd');
    const time = TIMES[i % TIMES.length];
    const status = STATUSES[i % STATUSES.length];
    const price = [60, 80, 100, 120, 150][i % 5];
    const isPaid = status === 'realizado' || (status === 'confirmado' && i % 3 === 0);
    const paymentStatus = isPaid ? 'pago' : 'pendente';
    const paymentMethod = isPaid ? PAYMENT_METHODS[i % PAYMENT_METHODS.length] : 'pix';

    if (isPaid) totalRevenue += price;
    else totalPending += price;

    appointments.push({
      service_name: service,
      petName: pet.name,
      date,
      time,
      status,
      price,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
    });
  }

  // Override revenue if user set a custom value
  if (config.revenue !== DEFAULT_DEMO_CONFIG.revenue) {
    totalRevenue = config.revenue;
  }

  // Generate ProfileRow-shaped data
  const profileRows: ProfileRow[] = clients.map((c, i) => ({
    id: `demo-profile-${i}`,
    user_id: `demo-user-${i}`,
    name: c.name,
    phone: c.phone,
    avatar_url: null,
    active: true,
    petshop_id: PETSHOP_ID,
    created_at: format(subDays(today, Math.floor(Math.random() * 30)), "yyyy-MM-dd'T'HH:mm:ss"),
    updated_at: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
  }));

  // Generate AppointmentRow-shaped data
  const appointmentRows: AppointmentRow[] = appointments.map((a, i) => {
    const ownerIdx = pets[i % petCount].ownerIndex;
    return {
      id: `demo-apt-${i}`,
      petshop_id: PETSHOP_ID,
      customer_id: `demo-user-${ownerIdx}`,
      service_id: null,
      service_name: a.service_name,
      date: a.date,
      time: a.time,
      status: a.status,
      price: a.price,
      payment_status: a.payment_status,
      payment_method: a.payment_method,
      payment_amount: a.payment_status === 'pago' ? a.price : null,
      completed_at: a.status === 'realizado' ? format(today, "yyyy-MM-dd'T'HH:mm:ss") : null,
      cancel_reason: null,
      notes: '',
      origin: 'demo',
      created_at: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss"),
      updated_at: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
      customer_name: clients[ownerIdx].name,
      customer_phone: clients[ownerIdx].phone,
      pets: [{
        id: `demo-pet-${i}`,
        appointment_id: `demo-apt-${i}`,
        pet_id: `demo-pet-ref-${i % petCount}`,
        pet_name: a.petName,
        pet_size: pets[i % petCount].size,
        pet_breed: pets[i % petCount].breed,
      }],
    };
  });

  return {
    clients,
    pets,
    appointments,
    revenue: totalRevenue,
    pending: totalPending,
    profileRows,
    appointmentRows,
  };
}

export function TestModesProvider({ children }: { children: ReactNode }) {
  const [proModeActive, setProModeActive] = useState(false);
  const [basicModeActive, setBasicModeActive] = useState(false);
  const [clientModeActive, setClientModeActive] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(false);
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [demoConfig, setDemoConfig] = useState<DemoConfig>(DEFAULT_DEMO_CONFIG);

  const toggleProMode = useCallback(() => {
    setProModeActive(prev => !prev);
    setBasicModeActive(false);
  }, []);

  const toggleBasicMode = useCallback(() => {
    setBasicModeActive(prev => !prev);
    setProModeActive(false);
  }, []);
  
  const toggleClientMode = useCallback(() => setClientModeActive(prev => !prev), []);
  
  const toggleDemoMode = useCallback(() => {
    setDemoModeActive(prev => {
      if (!prev) {
        setDemoData(generateDemoData(demoConfig));
      } else {
        setDemoData(null);
      }
      return !prev;
    });
  }, [demoConfig]);

  const regenerateDemoData = useCallback(() => {
    if (demoModeActive) {
      setDemoData(generateDemoData(demoConfig));
    }
  }, [demoModeActive, demoConfig]);

  const clearDemoData = useCallback(() => {
    setDemoModeActive(false);
    setDemoData(null);
  }, []);

  const activeModes = useMemo(() => {
    const modes: string[] = [];
    if (proModeActive) modes.push('PRO');
    if (basicModeActive) modes.push('Básico');
    if (clientModeActive) modes.push('Cliente');
    if (demoModeActive) modes.push('Demo');
    return modes;
  }, [proModeActive, basicModeActive, clientModeActive, demoModeActive]);

  const anyModeActive = activeModes.length > 0;

  return (
    <TestModesContext.Provider value={{
      proModeActive, toggleProMode,
      basicModeActive, toggleBasicMode,
      clientModeActive, toggleClientMode,
      demoModeActive, toggleDemoMode,
      demoData, clearDemoData,
      demoConfig, setDemoConfig, regenerateDemoData,
      anyModeActive, activeModes,
    }}>
      {children}
    </TestModesContext.Provider>
  );
}

export function useTestModes() {
  const context = useContext(TestModesContext);
  if (!context) throw new Error('useTestModes must be used within TestModesProvider');
  return context;
}
