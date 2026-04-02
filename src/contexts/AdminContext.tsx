import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTestModes } from '@/contexts/TestModesContext';
import * as servicesService from '@/services/servicesService';
import * as appointmentsService from '@/services/appointmentsService';
import * as galleryService from '@/services/galleryService';
import * as reviewsService from '@/services/reviewsService';
import { createNotification } from '@/services/notificationsService';
import * as packagesService from '@/services/packagesService';
import * as profilesService from '@/services/profilesService';
import * as petsService from '@/services/petsService';
import { AppointmentStatus, PaymentMethod, PaymentStatus } from '@/lib/constants';

interface AdminContextType {
  // Appointments
  appointments: appointmentsService.AppointmentRow[];
  appointmentsLoading: boolean;
  refreshAppointments: () => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<void>;
  cancelAdminAppointment: (id: string, reason: string) => Promise<void>;
  completeAppointment: (id: string) => Promise<void>;
  setPayment: (id: string, status: PaymentStatus, method?: PaymentMethod, amount?: number) => Promise<void>;
  createAppointment: (data: Parameters<typeof appointmentsService.createAppointment>[0]) => Promise<appointmentsService.AppointmentRow | null>;
  addPreAgendamento: (data: any) => Promise<void>; // Alias for createAppointment for compatibility

  // Gallery
  galleryImages: galleryService.GalleryPhotoRow[];
  galleryLoading: boolean;
  refreshGallery: () => Promise<void>;
  approvePhoto: (id: string, category?: string) => Promise<void>;
  rejectPhoto: (id: string) => Promise<void>;
  addPhoto: (data: Parameters<typeof galleryService.createGalleryPhoto>[0]) => Promise<void>;
  updatePhotoCategory: (id: string, category: string) => Promise<void>;

  // Reviews
  reviewsList: reviewsService.ReviewRow[];
  reviewsLoading: boolean;
  refreshReviews: () => Promise<void>;
  approveReview: (id: string) => Promise<void>;
  rejectReview: (id: string) => Promise<void>;
  addReview: (data: Parameters<typeof reviewsService.createReview>[0]) => Promise<void>;
  setShopResponse: (reviewId: string, response: string) => Promise<void>;

  // Services
  servicesList: servicesService.ServiceRow[];
  servicesLoading: boolean;
  refreshServices: () => Promise<void>;
  addService: (data: Omit<servicesService.ServiceRow, 'id' | 'petshop_id'>) => Promise<void>;
  updateService: (id: string, data: Partial<servicesService.ServiceRow>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Customer Packages
  customerPackages: packagesService.CustomerPackageRow[];
  packageTypes: packagesService.PackageRow[];
  packagesLoading: boolean;
  refreshPackages: () => Promise<void>;
  createCustomerPackage: (data: Parameters<typeof packagesService.createCustomerPackage>[0]) => Promise<void>;
  toggleCustomerPackageStatus: (id: string) => Promise<void>;
  updateCustomerPackage: (id: string, data: Partial<packagesService.CustomerPackageRow>) => Promise<void>;
  
  // Aliases for compatibility
  adminPackages: packagesService.CustomerPackageRow[]; 
  addAdminPackage: (data: any) => Promise<void>;
  toggleAdminPackageStatus: (id: string) => Promise<void>;
  updateAdminPackage: (id: string, data: any) => Promise<void>;

  // Clients
  clientProfiles: profilesService.ProfileRow[];
  clientsLoading: boolean;
  refreshClients: () => Promise<void>;
  tutors: profilesService.ProfileRow[]; // Alias
  getTutorByPhone: (phone: string) => any;
  addTutor: (data: any) => Promise<void>;
  addPetToTutor: (tutorId: string, pet: any) => Promise<void>;

  // Admin Users
  adminUsersList: any[]; // Placeholder
  addAdminUser: (data: any) => Promise<void>;
  deleteAdminUser: (id: string) => Promise<void>;

  // Feature flags
  exportEnabled: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { demoModeActive, demoData } = useTestModes();
  
  // State
  const [realAppointments, setRealAppointments] = useState<appointmentsService.AppointmentRow[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  
  const [gallery, setGallery] = useState<galleryService.GalleryPhotoRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  
  const [reviews, setReviews] = useState<reviewsService.ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  const [services, setServices] = useState<servicesService.ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  const [customerPackages, setCustomerPackages] = useState<packagesService.CustomerPackageRow[]>([]);
  const [packageTypes, setPackageTypes] = useState<packagesService.PackageRow[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  
  const [realClientProfiles, setRealClientProfiles] = useState<profilesService.ProfileRow[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  
  const [exportEnabled, setExportEnabled] = useState(false);

  // Merge demo data when active
  const appointments = useMemo(() => {
    if (demoModeActive && demoData?.appointmentRows) {
      return [...realAppointments, ...demoData.appointmentRows];
    }
    return realAppointments;
  }, [realAppointments, demoModeActive, demoData]);

  const clientProfiles = useMemo(() => {
    if (demoModeActive && demoData?.profileRows) {
      return [...realClientProfiles, ...demoData.profileRows];
    }
    return realClientProfiles;
  }, [realClientProfiles, demoModeActive, demoData]);

  // Load data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loadAll();

    // Realtime subscription for appointments
    const channel = supabase
      .channel('admin-appointments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          refreshAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const loadAll = useCallback(async () => {
    await Promise.all([
      refreshAppointments(),
      refreshGallery(),
      refreshReviews(),
      refreshServices(),
      refreshPackages(),
      refreshClients(),
      loadFeatureFlags(),
    ]);
  }, []);

  const refreshAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    const data = await appointmentsService.getAppointmentsWithProfiles();
    setRealAppointments(data);
    setAppointmentsLoading(false);
  }, []);

  const refreshGallery = useCallback(async () => {
    setGalleryLoading(true);
    const data = await galleryService.getGalleryPhotos();
    setGallery(data);
    setGalleryLoading(false);
  }, []);

  const refreshReviews = useCallback(async () => {
    setReviewsLoading(true);
    const data = await reviewsService.getReviews();
    setReviews(data);
    setReviewsLoading(false);
  }, []);

  const refreshServices = useCallback(async () => {
    setServicesLoading(true);
    const data = await servicesService.getServices();
    setServices(data);
    setServicesLoading(false);
  }, []);

  const refreshPackages = useCallback(async () => {
    setPackagesLoading(true);
    const [types, customers] = await Promise.all([
      packagesService.getPackages(),
      packagesService.getCustomerPackages(),
    ]);
    setPackageTypes(types);
    setCustomerPackages(customers);
    setPackagesLoading(false);
  }, []);

  const refreshClients = useCallback(async () => {
    setClientsLoading(true);
    const data = await profilesService.getClientProfiles();
    setRealClientProfiles(data);
    setClientsLoading(false);
  }, []);

  const loadFeatureFlags = useCallback(async () => {
    const enabled = await profilesService.getFeatureFlag('export_enabled');
    setExportEnabled(enabled);
  }, []);

  // Appointment actions
  const confirmAppointment = useCallback(async (id: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'confirmado');
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento confirmado âœ…', description: `Seu agendamento de ${appt.service_name} foi confirmado.`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const rescheduleAppointment = useCallback(async (id: string, newDate: string, newTime: string) => {
    await appointmentsService.rescheduleAppointment(id, newDate, newTime);
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento remarcado ðŸ“…', description: `Seu agendamento foi remarcado para ${newDate} Ã s ${newTime}.`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const cancelAdminAppointment = useCallback(async (id: string, reason: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'cancelado', { cancel_reason: reason });
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento cancelado âŒ', description: `Seu agendamento de ${appt.service_name} foi cancelado. Motivo: ${reason}`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const completeAppointment = useCallback(async (id: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'realizado');
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento concluÃ­do ðŸŽ‰', description: `Seu agendamento de ${appt.service_name} foi concluÃ­do. Obrigado!`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const setPayment = useCallback(async (id: string, status: PaymentStatus, method?: PaymentMethod, amount?: number) => {
    await appointmentsService.setAppointmentPayment(id, status, method, amount);
    await refreshAppointments();
  }, [refreshAppointments]);

  const handleCreateAppointment = useCallback(async (data: Parameters<typeof appointmentsService.createAppointment>[0]) => {
    const result = await appointmentsService.createAppointment(data);
    await refreshAppointments();
    return result;
  }, [refreshAppointments]);

  // Gallery actions
  const approvePhoto = useCallback(async (id: string, category?: string) => {
    await galleryService.updateGalleryPhoto(id, { 
      moderation_status: 'aprovado', 
      ...(category ? { category } : {}) 
    });
    const photo = gallery.find(p => p.id === id);
    if (photo?.submitted_by_user_id) {
      createNotification({ user_id: photo.submitted_by_user_id, title: 'Foto aprovada! ðŸŽ‰', description: 'Sua foto foi aprovada e jÃ¡ estÃ¡ visÃ­vel na galeria.', type: 'galeria', link: '/#galeria' }).catch(() => {});
    }
    await refreshGallery();
  }, [refreshGallery, gallery]);

  const rejectPhoto = useCallback(async (id: string) => {
    await galleryService.updateGalleryPhoto(id, { moderation_status: 'rejeitado' });
    const photo = gallery.find(p => p.id === id);
    if (photo?.submitted_by_user_id) {
      createNotification({ user_id: photo.submitted_by_user_id, title: 'Foto nÃ£o aprovada', description: 'Sua foto nÃ£o atendeu aos critÃ©rios da galeria.', type: 'galeria' }).catch(() => {});
    }
    await refreshGallery();
  }, [refreshGallery, gallery]);

  const addPhoto = useCallback(async (data: Parameters<typeof galleryService.createGalleryPhoto>[0]) => {
    const created = await galleryService.createGalleryPhoto(data);
    if (!created) {
      throw new Error('Falha ao salvar foto na galeria.');
    }
    await refreshGallery();
  }, [refreshGallery]);

  const updatePhotoCategory = useCallback(async (id: string, category: string) => {
    await galleryService.updateGalleryPhoto(id, { category });
    await refreshGallery();
  }, [refreshGallery]);

  // Review actions
  const approveReview = useCallback(async (id: string) => {
    await reviewsService.updateReview(id, { moderation_status: 'aprovado' });
    const review = reviews.find(r => r.id === id);
    if (review?.user_id) {
      createNotification({ user_id: review.user_id, title: 'AvaliaÃ§Ã£o aprovada! â­', description: 'Sua avaliaÃ§Ã£o foi aprovada e estÃ¡ visÃ­vel para todos.', type: 'avaliacao', link: '/#avaliacoes' }).catch(() => {});
    }
    await refreshReviews();
  }, [refreshReviews, reviews]);

  const rejectReview = useCallback(async (id: string) => {
    await reviewsService.updateReview(id, { moderation_status: 'rejeitado' });
    const review = reviews.find(r => r.id === id);
    if (review?.user_id) {
      createNotification({ user_id: review.user_id, title: 'AvaliaÃ§Ã£o nÃ£o aprovada', description: 'Sua avaliaÃ§Ã£o nÃ£o atendeu aos critÃ©rios de publicaÃ§Ã£o.', type: 'avaliacao' }).catch(() => {});
    }
    await refreshReviews();
  }, [refreshReviews, reviews]);

  const addReview = useCallback(async (data: Parameters<typeof reviewsService.createReview>[0]) => {
    await reviewsService.createReview(data);
    await refreshReviews();
  }, [refreshReviews]);

  const setShopResponse = useCallback(async (reviewId: string, response: string) => {
    await reviewsService.updateReview(reviewId, { shop_response: response });
    await refreshReviews();
  }, [refreshReviews]);

  // Service actions
  const addService = useCallback(async (data: Omit<servicesService.ServiceRow, 'id' | 'petshop_id'>) => {
    await servicesService.createService(data);
    await refreshServices();
  }, [refreshServices]);

  const handleUpdateService = useCallback(async (id: string, data: Partial<servicesService.ServiceRow>) => {
    await servicesService.updateService(id, data);
    await refreshServices();
  }, [refreshServices]);

  const handleDeleteService = useCallback(async (id: string) => {
    await servicesService.deleteService(id);
    await refreshServices();
  }, [refreshServices]);

  // Package actions
  const handleCreateCustomerPackage = useCallback(async (data: Parameters<typeof packagesService.createCustomerPackage>[0]) => {
    await packagesService.createCustomerPackage(data);
    await refreshPackages();
  }, [refreshPackages]);

  const handleToggleCustomerPackageStatus = useCallback(async (id: string) => {
    await packagesService.toggleCustomerPackageStatus(id);
    await refreshPackages();
  }, [refreshPackages]);

  const handleUpdateCustomerPackage = useCallback(async (id: string, data: Partial<packagesService.CustomerPackageRow>) => {
    await packagesService.updateCustomerPackage(id, data);
    await refreshPackages();
  }, [refreshPackages]);

  // Helpers
  const getTutorByPhone = useCallback((phone: string) => {
    const normalized = phone.replace(/\D/g, '');
    return clientProfiles.find(p => p.phone?.replace(/\D/g, '') === normalized);
  }, [clientProfiles]);

  return (
    <AdminContext.Provider value={{
      appointments, appointmentsLoading, refreshAppointments,
      confirmAppointment, rescheduleAppointment, cancelAdminAppointment, completeAppointment, setPayment,
      createAppointment: handleCreateAppointment,
      addPreAgendamento: async (data: any) => { await handleCreateAppointment(data); }, // Alias

      galleryImages: gallery, galleryLoading, refreshGallery,
      approvePhoto, rejectPhoto, addPhoto, updatePhotoCategory,

      reviewsList: reviews, reviewsLoading, refreshReviews,
      approveReview, rejectReview, addReview, setShopResponse,

      servicesList: services, servicesLoading, refreshServices,
      addService, updateService: handleUpdateService, deleteService: handleDeleteService,

      customerPackages, packageTypes, packagesLoading, refreshPackages,
      createCustomerPackage: handleCreateCustomerPackage,
      toggleCustomerPackageStatus: handleToggleCustomerPackageStatus,
      updateCustomerPackage: handleUpdateCustomerPackage,
      
      // Compatibility aliases
      adminPackages: customerPackages,
      addAdminPackage: async (data: any) => { await handleCreateCustomerPackage(data); },
      toggleAdminPackageStatus: handleToggleCustomerPackageStatus,
      updateAdminPackage: handleUpdateCustomerPackage,

      clientProfiles, clientsLoading, refreshClients,
      tutors: clientProfiles, // Alias
      getTutorByPhone,
      addTutor: async () => {}, // Not needed with direct profile creation in flow
      addPetToTutor: async () => {}, // Not needed

      adminUsersList: [], // Mock for now
      addAdminUser: async () => {},
      deleteAdminUser: async () => {},

      exportEnabled,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
}
