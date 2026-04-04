import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { useTestModes } from '@/contexts/TestModesContext';
import * as servicesService from '@/services/servicesService';
import * as appointmentsService from '@/services/appointmentsService';
import * as galleryService from '@/services/galleryService';
import * as reviewsService from '@/services/reviewsService';
import { createNotification } from '@/services/notificationsService';
import * as packagesService from '@/services/packagesService';
import * as profilesService from '@/services/profilesService';
import * as petsService from '@/services/petsService';
import { PaymentMethod, PaymentStatus } from '@/lib/constants';

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
  addPreAgendamento: (data: Parameters<typeof appointmentsService.createAppointment>[0]) => Promise<void>;

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
  addService: (data: Omit<servicesService.ServiceInsert, 'petshop_id'>) => Promise<void>;
  updateService: (id: string, data: servicesService.ServiceUpdate) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Customer Packages
  customerPackages: packagesService.CustomerPackageRow[];
  packageTypes: packagesService.PackageRow[];
  packagesLoading: boolean;
  refreshPackages: () => Promise<void>;
  createCustomerPackage: (data: Parameters<typeof packagesService.createCustomerPackage>[0]) => Promise<void>;
  toggleCustomerPackageStatus: (id: string) => Promise<void>;
  updateCustomerPackage: (id: string, data: packagesService.CustomerPackageUpdate) => Promise<void>;
  
  // Aliases for compatibility
  adminPackages: packagesService.CustomerPackageRow[]; 
  addAdminPackage: (data: Parameters<typeof packagesService.createCustomerPackage>[0]) => Promise<void>;
  toggleAdminPackageStatus: (id: string) => Promise<void>;
  updateAdminPackage: (id: string, data: packagesService.CustomerPackageUpdate) => Promise<void>;

  // Clients
  clientProfiles: profilesService.ProfileRow[];
  clientsLoading: boolean;
  refreshClients: () => Promise<void>;
  tutors: profilesService.ProfileRow[];
  getTutorByPhone: (phone: string) => profilesService.ProfileRow | undefined;
  addTutor: (data: profilesService.ProfileInsert) => Promise<void>;
  addPetToTutor: (tutorId: string, pet: petsService.PetInsert) => Promise<void>;

  // Admin Users
  adminUsersList: profilesService.ProfileRow[];
  addAdminUser: (data: profilesService.ProfileInsert) => Promise<void>;
  deleteAdminUser: (id: string) => Promise<void>;

  // Feature flags
  exportEnabled: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { petshop } = usePetshop();
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

  // Refresh functions
  const refreshAppointments = useCallback(async () => {
    if (!petshop?.id) return;
    setAppointmentsLoading(true);
    const data = await appointmentsService.getAppointmentsWithProfiles(petshop.id);
    setRealAppointments(data);
    setAppointmentsLoading(false);
  }, [petshop?.id]);

  const refreshGallery = useCallback(async () => {
    if (!petshop?.id) return;
    setGalleryLoading(true);
    const data = await galleryService.getGalleryPhotos(petshop.id);
    setGallery(data);
    setGalleryLoading(false);
  }, [petshop?.id]);

  const refreshReviews = useCallback(async () => {
    if (!petshop?.id) return;
    setReviewsLoading(true);
    const data = await reviewsService.getReviews(petshop.id);
    setReviews(data);
    setReviewsLoading(false);
  }, [petshop?.id]);

  const refreshServices = useCallback(async () => {
    if (!petshop?.id) return;
    setServicesLoading(true);
    const data = await servicesService.getServices(petshop.id);
    setServices(data);
    setServicesLoading(false);
  }, [petshop?.id]);

  const refreshPackages = useCallback(async () => {
    if (!petshop?.id) return;
    setPackagesLoading(true);
    const [types, customers] = await Promise.all([
      packagesService.getPackages(petshop.id),
      packagesService.getCustomerPackages(petshop.id),
    ]);
    setPackageTypes(types);
    setCustomerPackages(customers);
    setPackagesLoading(false);
  }, [petshop?.id]);

  const refreshClients = useCallback(async () => {
    if (!petshop?.id) return;
    setClientsLoading(true);
    const data = await profilesService.getClientProfiles(petshop.id);
    setRealClientProfiles(data);
    setClientsLoading(false);
  }, [petshop?.id]);

  const loadFeatureFlags = useCallback(async () => {
    if (!petshop?.id) return;
    const enabled = await profilesService.getFeatureFlag('export_enabled', petshop.id);
    setExportEnabled(enabled);
  }, [petshop?.id]);

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
  }, [refreshAppointments, refreshGallery, refreshReviews, refreshServices, refreshPackages, refreshClients, loadFeatureFlags]);

  // Load data effect
  useEffect(() => {
    if (!isAuthenticated || !petshop?.id) return;
    loadAll();

    const channel = supabase
      .channel(`admin-appointments-${petshop.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `petshop_id=eq.${petshop.id}`
        },
        () => {
          refreshAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, petshop?.id, loadAll, refreshAppointments]);

  // Memoized derived data
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

  // Appointment actions
  const confirmAppointment = useCallback(async (id: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'confirmado');
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento confirmado ✅', description: `Seu agendamento de ${appt.service_name} foi confirmado.`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const rescheduleAppointment = useCallback(async (id: string, newDate: string, newTime: string) => {
    await appointmentsService.rescheduleAppointment(id, newDate, newTime);
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento remarcado 🗓️', description: `Seu agendamento foi remarcado para ${newDate} às ${newTime}.`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const cancelAdminAppointment = useCallback(async (id: string, reason: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'cancelado', { cancel_reason: reason });
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento cancelado ❌', description: `Seu agendamento de ${appt.service_name} foi cancelado. Motivo: ${reason}`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const completeAppointment = useCallback(async (id: string) => {
    await appointmentsService.updateAppointmentStatus(id, 'realizado');
    const appt = appointments.find(a => a.id === id);
    if (appt?.customer_id) {
      createNotification({ user_id: appt.customer_id, title: 'Agendamento concluído 🎉', description: `Seu agendamento de ${appt.service_name} foi concluído. Obrigado!`, type: 'agendamento', link: '/area-cliente' }).catch(() => {});
    }
    await refreshAppointments();
  }, [refreshAppointments, appointments]);

  const setPayment = useCallback(async (id: string, status: PaymentStatus, method?: PaymentMethod, amount?: number) => {
    await appointmentsService.setAppointmentPayment(id, status, method, amount);
    await refreshAppointments();
  }, [refreshAppointments]);

  const handleCreateAppointment = useCallback(async (data: Parameters<typeof appointmentsService.createAppointment>[0]) => {
    const result = await appointmentsService.createAppointment(data, petshop?.id);
    await refreshAppointments();
    return result;
  }, [refreshAppointments, petshop?.id]);

  // Gallery actions
  const approvePhoto = useCallback(async (id: string, category?: string) => {
    await galleryService.updateGalleryPhoto(id, { 
      moderation_status: 'aprovado', 
      ...(category ? { category } : {}) 
    });
    const photo = gallery.find(p => p.id === id);
    if (photo?.submitted_by_user_id) {
      createNotification({ user_id: photo.submitted_by_user_id, title: 'Foto aprovada! 🎉', description: 'Sua foto foi aprovada e já está visível na galeria.', type: 'galeria', link: '/#galeria' }).catch(() => {});
    }
    await refreshGallery();
  }, [refreshGallery, gallery]);

  const rejectPhoto = useCallback(async (id: string) => {
    await galleryService.updateGalleryPhoto(id, { moderation_status: 'rejeitado' });
    const photo = gallery.find(p => p.id === id);
    if (photo?.submitted_by_user_id) {
      createNotification({ user_id: photo.submitted_by_user_id, title: 'Foto não aprovada', description: 'Sua foto não atendeu aos critérios da galeria.', type: 'galeria' }).catch(() => {});
    }
    await refreshGallery();
  }, [refreshGallery, gallery]);

  const addPhoto = useCallback(async (data: Parameters<typeof galleryService.createGalleryPhoto>[0]) => {
    const created = await galleryService.createGalleryPhoto(data, petshop?.id);
    if (!created) throw new Error('Falha ao salvar foto na galeria.');
    await refreshGallery();
  }, [refreshGallery, petshop?.id]);

  const updatePhotoCategory = useCallback(async (id: string, category: string) => {
    await galleryService.updateGalleryPhoto(id, { category });
    await refreshGallery();
  }, [refreshGallery]);

  // Review actions
  const approveReview = useCallback(async (id: string) => {
    await reviewsService.updateReview(id, { moderation_status: 'aprovado' });
    const review = reviews.find(r => r.id === id);
    if (review?.user_id) {
      createNotification({ user_id: review.user_id, title: 'Avaliação aprovada! ⭐', description: 'Sua avaliação foi aprovada e está visível para todos.', type: 'avaliacao', link: '/#avaliacoes' }).catch(() => {});
    }
    await refreshReviews();
  }, [refreshReviews, reviews]);

  const rejectReview = useCallback(async (id: string) => {
    await reviewsService.updateReview(id, { moderation_status: 'rejeitado' });
    const review = reviews.find(r => r.id === id);
    if (review?.user_id) {
      createNotification({ user_id: review.user_id, title: 'Avaliação não aprovada', description: 'Sua avaliação não atendeu aos critérios de publicação.', type: 'avaliacao' }).catch(() => {});
    }
    await refreshReviews();
  }, [refreshReviews, reviews]);

  const addReview = useCallback(async (data: Parameters<typeof reviewsService.createReview>[0]) => {
    await reviewsService.createReview(data, petshop?.id);
    await refreshReviews();
  }, [refreshReviews, petshop?.id]);

  const setShopResponse = useCallback(async (reviewId: string, response: string) => {
    await reviewsService.updateReview(reviewId, { shop_response: response });
    await refreshReviews();
  }, [refreshReviews]);

  // Service actions
  const addService = useCallback(async (data: Omit<servicesService.ServiceInsert, 'petshop_id'>) => {
    await servicesService.createService(data, petshop?.id);
    await refreshServices();
  }, [refreshServices, petshop?.id]);

  const handleUpdateService = useCallback(async (id: string, data: servicesService.ServiceUpdate) => {
    await servicesService.updateService(id, data);
    await refreshServices();
  }, [refreshServices]);

  const handleDeleteService = useCallback(async (id: string) => {
    await servicesService.deleteService(id);
    await refreshServices();
  }, [refreshServices]);

  // Package actions
  const handleCreateCustomerPackage = useCallback(async (data: Parameters<typeof packagesService.createCustomerPackage>[0]) => {
    await packagesService.createCustomerPackage(data, petshop?.id);
    await refreshPackages();
  }, [refreshPackages, petshop?.id]);

  const handleToggleCustomerPackageStatus = useCallback(async (id: string) => {
    await packagesService.toggleCustomerPackageStatus(id);
    await refreshPackages();
  }, [refreshPackages]);

  const handleUpdateCustomerPackage = useCallback(async (id: string, data: packagesService.CustomerPackageUpdate) => {
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
      addPreAgendamento: async (data) => { await handleCreateAppointment(data); },

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
      
      adminPackages: customerPackages,
      addAdminPackage: handleCreateCustomerPackage,
      toggleAdminPackageStatus: handleToggleCustomerPackageStatus,
      updateAdminPackage: handleUpdateCustomerPackage,

      clientProfiles, clientsLoading, refreshClients,
      tutors: clientProfiles,
      getTutorByPhone,
      addTutor: async () => {},
      addPetToTutor: async () => {},

      adminUsersList: [], 
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
