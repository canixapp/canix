import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import * as petsService from '@/services/petsService';
import * as profilesService from '@/services/profilesService';
import * as appointmentsService from '@/services/appointmentsService';
import * as accountsService from '@/services/accountsService';
import { phoneToVirtualEmail, normalizePhone, toE164 } from '@/lib/phoneUtils';


export type AppRole = 'dev' | 'admin' | 'midia' | 'cliente';

export interface Pet {
  id: string;
  name: string;
  size: string;
  breed: string;
  photo_url?: string;
}

export interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  petName: string;
  petId?: string;
  price: number;
  payment_status?: string | null;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: AppRole;
  pets: Pet[];
  avatarUrl?: string;
  profileCompleted?: boolean;
  mustChangePassword?: boolean;
}

interface RegisterPetData {
  name: string;
  size: string;
  breed: string;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  petName: string;
  petSize: string;
  petBreed: string;
  email?: string;
  extraPets?: RegisterPetData[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  needsProfileCompletion: boolean;
  mustChangePassword: boolean;
  login: (credential: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginByPhone: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ error?: Error | null } | void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  updateUserAvatar: (url: string) => void;
  addPet: (pet: Omit<Pet, 'id'>) => Promise<void>;
  updatePet: (petId: string, data: Partial<Pet>) => Promise<void>;
  removePet: (petId: string) => Promise<void>;
  refreshPets: () => Promise<void>;
  refreshUser: () => Promise<void>;
  appointments: Appointment[];
  appointmentsLoading: boolean;
  addAppointment: (data: { service: string; date: string; time: string; status?: string; petId: string; petName: string; price: number }) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  refreshAppointments: () => Promise<void>;
  isDev: () => boolean;
  isAdmin: () => boolean;
  isMidia: () => boolean;
  canAccessDashboard: () => boolean;
  canModerate: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.role as AppRole) || 'cliente';
}


async function buildUser(supabaseUser: SupabaseUser): Promise<User | null> {
  try {
    const [role, profile, pets] = await Promise.all([
      fetchUserRole(supabaseUser.id),
      profilesService.getProfile(supabaseUser.id),
      petsService.getPetsByOwner(supabaseUser.id),
    ]);

    if (!profile || !profile.active) return null;

    const profileCompleted = profile.profile_completed === true;
    const mustChangePassword = profile.must_change_password === true;
    const user: User = {
      id: supabaseUser.id,
      name: profile.name || supabaseUser.email || '',
      phone: profile.phone || '',
      email: supabaseUser.email,
      role,
      pets: pets.map(p => ({ id: p.id, name: p.name, size: p.size, breed: p.breed || '', photo_url: p.photo_url || undefined })),
      avatarUrl: profile.avatar_url || undefined,
      profileCompleted,
      mustChangePassword,
    };

    return user;
  } catch (err) {
    console.warn('[Auth] buildUser failed:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setTimeout(async () => {
          const appUser = await buildUser(session.user);
          setUser(appUser);
          setLoading(false);
        }, 0);
      }
    });

    // Initial session restore
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser = await buildUser(session.user);
          setUser(appUser);
        }
      } catch (err) {
        console.warn('[Auth] Session restore failed:', err);
      }
      setLoading(false);
    };

    restoreSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Client appointments
  const fetchClientAppointments = useCallback(async () => {
    if (!user) { setAppointments([]); return; }
    setAppointmentsLoading(true);
    try {
      const { data } = await supabase
        .from('appointments')
        .select('*, appointment_pets(*)')
        .eq('customer_id', user.id)
        .order('date', { ascending: false });
      
      const mappedAppointments = (data || []).map((a: appointmentsService.AppointmentRow & { appointment_pets?: { pet_name: string }[] }) => ({
        id: a.id,
        service: a.service_name,
        date: a.date,
        time: a.time,
        status: a.status,
        petName: a.appointment_pets?.map(p => p.pet_name).join(', ') || '',
        price: a.price || 0,
        payment_status: a.payment_status,
      }));
      setAppointments(mappedAppointments);
    } catch (e) { console.error('fetchClientAppointments:', e); }
    setAppointmentsLoading(false);
  }, [user]);

  useEffect(() => { if (user) fetchClientAppointments(); }, [user, fetchClientAppointments]);

  // Generic login (email or phone auto-detect)
  const login = useCallback(async (credential: string, password: string) => {
    const trimmed = credential.trim();
    if (trimmed.includes('@')) {
      // Email login
      return loginByEmail(trimmed, password);
    } else {
      // Phone login
      return loginByPhone(trimmed, password);
    }
  }, []);

  // Login by phone: lookup account first, then sign in with virtual email
  const loginByPhone = useCallback(async (phone: string, password: string) => {
    const e164 = toE164(phone);
    if (!e164) {
      return { success: false, error: 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).' };
    }

    // Lookup via RPC (SECURITY DEFINER — works for anon)
    const account = await accountsService.lookupByPhone(phone);

    if (!account) {
      return { success: false, error: 'Telefone não encontrado. Crie sua conta.' };
    }

    if (account.auth_provider === 'google' && !account.has_password) {
      return { success: false, error: 'Sua conta foi criada com Google. Entre com Google ou cadastre uma senha.' };
    }

    // Phone login: always use virtual email since we no longer get email from lookup
    const authEmail = phoneToVirtualEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) {
      if (error.message.includes('Invalid login')) {
        // Fallback: try virtual email in case account.email is the real one but auth uses virtual
        const virtualEmail = phoneToVirtualEmail(phone);
        if (virtualEmail !== authEmail) {
          const { error: err2 } = await supabase.auth.signInWithPassword({ email: virtualEmail, password });
          if (!err2) return { success: true };
        }
        return { success: false, error: 'Senha incorreta. Tente novamente.' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  // Login by email
  const loginByEmail = useCallback(async (email: string, password: string) => {
    const account = await accountsService.lookupByEmail(email);

    if (!account) {
      // Maybe user registered with phone but has this real email — try phone lookup won't help here
      return { success: false, error: 'E-mail não encontrado. Crie sua conta.' };
    }

    if (account.auth_provider === 'google' && !account.has_password) {
      return { success: false, error: 'Sua conta foi criada com Google. Entre com Google ou cadastre uma senha.' };
    }

    // Use the provided email for auth
    const authEmail = email;
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) {
      if (error.message.includes('Invalid login')) {
        return { success: false, error: 'Senha incorreta. Tente novamente.' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) {
      return { error: new Error(error.message) };
    }
    return {};
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const e164 = data.phone ? toE164(data.phone) : null;

    // Check email uniqueness
    if (data.email) {
      const existingEmail = await accountsService.lookupByEmail(data.email);
      if (existingEmail) return { success: false, error: 'E-mail já cadastrado. Faça login.' };
    }

    // Check phone — detect pre-registered accounts
    if (e164) {
      const existingPhone = await accountsService.lookupByPhone(data.phone);
      if (existingPhone) {
        // Check if it's a pre-registered account (no password set = pre-registered by admin)
        if (!existingPhone.has_password && existingPhone.auth_provider === 'local') {
          return { success: false, error: 'PRE_REGISTERED', preRegistered: existingPhone };
        }
        return { success: false, error: 'Telefone já cadastrado. Faça login.' };
      }
    }

    // Use real email for auth if provided, otherwise virtual email
    const authEmail = data.email ? data.email.trim() : (e164 ? phoneToVirtualEmail(data.phone) : null);
    if (!authEmail) return { success: false, error: 'Informe um telefone ou e-mail válido.' };

    const { data: authData, error } = await supabase.auth.signUp({
      email: authEmail,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: e164 || '',
          phone_e164: e164 || '',
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Conta já cadastrada. Faça login.' };
      }
      return { success: false, error: error.message };
    }

    if (authData.user) {
      // Update profile with phone and mark completed
      const profileUpdate: profilesService.ProfileUpdate = { profile_completed: !!data.petName };
      if (e164) profileUpdate.phone = e164;
      await profilesService.updateProfile(authData.user.id, profileUpdate);

      // Create pets if provided
      if (data.petName) {
        try {
          await petsService.createPet({
            owner_id: authData.user!.id,
            name: data.petName,
            size: data.petSize,
            breed: data.petBreed,
          });
          if (data.extraPets && data.extraPets.length > 0) {
            for (const pet of data.extraPets) {
              await petsService.createPet({
                owner_id: authData.user!.id,
                name: pet.name,
                size: pet.size,
                breed: pet.breed,
              });
            }
          }
        } catch (petErr) {
          console.error('Error creating pets during registration:', petErr);
        }
      }

      // Force refresh user state AFTER all data is saved to avoid race condition
      const appUser = await buildUser(authData.user);
      setUser(appUser);
    }
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppointments([]);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      if (data.name || data.phone) {
        const payload: profilesService.ProfileUpdate = {};
        if (data.name) payload.name = data.name;
        if (data.phone) payload.phone = data.phone;
        profilesService.updateProfile(prev.id, payload);
      }
      return { ...prev, ...data };
    });
  }, []);

  const updateUserAvatar = useCallback((url: string) => {
    setUser(prev => {
      if (!prev) return null;
      profilesService.updateProfile(prev.id, { avatar_url: url });
      return { ...prev, avatarUrl: url };
    });
  }, []);

  const addPet = useCallback(async (pet: Omit<Pet, 'id'>) => {
    if (!user) return;
    const created = await petsService.createPet({
      owner_id: user.id,
      name: pet.name,
      size: pet.size,
      breed: pet.breed,
    });
    if (created) {
      setUser(prev => prev ? { ...prev, pets: [...prev.pets, { id: created.id, name: created.name, size: created.size, breed: created.breed || '' }] } : null);
    }
  }, [user]);

  const updatePetAction = useCallback(async (petId: string, data: Partial<Pet>) => {
    await petsService.updatePet(petId, data as petsService.PetUpdate);
    setUser(prev => prev ? { ...prev, pets: prev.pets.map(p => p.id === petId ? { ...p, ...data } : p) } : null);
  }, []);

  const removePet = useCallback(async (petId: string) => {
    await petsService.deletePet(petId);
    setUser(prev => prev ? { ...prev, pets: prev.pets.filter(p => p.id !== petId) } : null);
  }, []);

  const refreshPets = useCallback(async () => {
    if (!user) return;
    const pets = await petsService.getPetsByOwner(user.id);
    setUser(prev => prev ? { ...prev, pets: pets.map(p => ({ id: p.id, name: p.name, size: p.size, breed: p.breed || '', photo_url: p.photo_url || undefined })) } : null);
  }, [user]);

  const addAppointment = useCallback(async (data: { service: string; date: string; time: string; status?: string; petId: string; petName: string; price: number }) => {
    if (!user) return;
    await appointmentsService.createAppointment({
      customer_id: user.id,
      service_name: data.service,
      date: data.date,
      time: data.time,
      price: data.price,
      origin: 'sistema',
      pets: [{ pet_id: data.petId, pet_name: data.petName }],
    });
    await fetchClientAppointments();
  }, [user, fetchClientAppointments]);

  const cancelAppointmentFn = useCallback(async (id: string, reason?: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'cancelado', { cancel_reason: reason || '' });
    await fetchClientAppointments();
  }, [fetchClientAppointments]);

  const isDev = useCallback(() => user?.role === 'dev', [user]);
  const isAdmin = useCallback(() => user?.role === 'admin', [user]);
  const isMidia = useCallback(() => user?.role === 'midia', [user]);
  const canAccessDashboard = useCallback(() => user?.role === 'dev' || user?.role === 'admin', [user]);
  const canModerate = useCallback(() => user?.role === 'dev' || user?.role === 'admin' || user?.role === 'midia', [user]);

  // Profile completion check for Google users
  // Only clients need full profile completion (phone + pet)
  const needsProfileCompletion = !!user && user.role === 'cliente' && !user.profileCompleted && (!user.phone || user.pets.length === 0);
  const mustChangePassword = !!user && !!user.mustChangePassword;


  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const appUser = await buildUser(session.user);
      setUser(appUser);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, loading, needsProfileCompletion, mustChangePassword,
      login, loginByPhone, loginWithGoogle, register, logout,
      updateUser, updateUserAvatar, addPet, updatePet: updatePetAction, removePet, refreshPets, refreshUser,
      appointments, appointmentsLoading, addAppointment, cancelAppointment: cancelAppointmentFn, refreshAppointments: fetchClientAppointments,
      isDev, isAdmin, isMidia, canAccessDashboard, canModerate,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
