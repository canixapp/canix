import { lazy, Suspense, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import HubLayout from "@/components/hub/HubLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { PetshopProvider } from "@/contexts/PetshopContext";
import { TestModesProvider } from "@/contexts/TestModesContext";
import { CompleteProfileModal } from "@/components/modals/CompleteProfileModal";
import { ForcePasswordChangeModal } from "@/components/modals/ForcePasswordChangeModal";
import { TestModeIndicator } from "@/components/admin/TestModeIndicator";
import { LoginNotificationToast } from "@/components/notifications/LoginNotificationToast";

import { CookieConsentModal } from "@/components/modals/CookieConsentModal";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { getTenantSlug } from "@/lib/tenant";

// Lazy-loaded HUB
const HubDashboard = lazy(() => import("./pages/hub/Dashboard"));
const HubLicenses = lazy(() => import("./pages/hub/Licenses"));
const HubPlans = lazy(() => import("./pages/hub/Plans"));
const HubSecurity = lazy(() => import("./pages/hub/Security"));
const HubSettings = lazy(() => import("./pages/hub/Settings"));
const HubPrototype = lazy(() => import("./pages/hub/Prototype"));
const HubLogin = lazy(() => import("./pages/hub/Login"));
const HubAudit = lazy(() => import("./pages/hub/AuditLogs"));
import HubProtectedRoute from "@/components/hub/HubProtectedRoute";
import HubErrorBoundary from "@/components/hub/HubErrorBoundary";

// Lazy-loaded routes for code splitting (Retail App)
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Agendamentos = lazy(() => import("@/pages/admin/Agendamentos"));
const Pacotes = lazy(() => import("@/pages/admin/Pacotes"));
const Moderacao = lazy(() => import("@/pages/admin/Moderacao"));
const Servicos = lazy(() => import("@/pages/admin/Servicos"));
const Usuarios = lazy(() => import("@/pages/admin/Usuarios"));
const Configuracoes = lazy(() => import("@/pages/admin/Configuracoes"));
const Clientes = lazy(() => import("@/pages/admin/Clientes"));
const DevTools = lazy(() => import("@/pages/admin/DevTools"));
const DevToolsPanel = lazy(() => import("@/pages/DevToolsPanel"));
const AuditLog = lazy(() => import("@/pages/admin/AuditLog"));
const PetProfile = lazy(() => import("@/pages/admin/PetProfile"));
const Pets = lazy(() => import("@/pages/admin/Pets"));
const Financeiro = lazy(() => import("@/pages/admin/Financeiro"));
const Estoque = lazy(() => import("@/pages/admin/Estoque"));
const Relatorios = lazy(() => import("@/pages/admin/Relatorios"));
const Lembretes = lazy(() => import("@/pages/admin/Lembretes"));
const Marketing = lazy(() => import("@/pages/admin/Marketing"));

const queryClient = new QueryClient();

function ProfileCompletionGate() {
  const { user, needsProfileCompletion, mustChangePassword, logout, refreshUser } = useAuth();

  if (user && mustChangePassword) {
    return (
      <ForcePasswordChangeModal
        open={true}
        userId={user.id}
        onComplete={refreshUser}
      />
    );
  }

  // O modal de conclusão de perfil (PET) só deve aparecer no contexto de um Petshop (tenant)
  const tenantSlug = getTenantSlug();
  if (!user || !needsProfileCompletion || !tenantSlug) return null;

  return (
    <CompleteProfileModal
      userId={user.id}
      userName={user.name}
      userEmail={user.email}
      onComplete={refreshUser}
      onLogout={logout}
    />
  );
}

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  const tenantSlug = useMemo(() => getTenantSlug(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="petcao-theme" enableSystem>
        <PetshopProvider>
          <BrandingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Router>
                <AuthProvider>
                  <TestModesProvider>
                  <AdminProvider>
                    <ProfileCompletionGate />
                    <TestModeIndicator />
                    <LoginNotificationToast />
                    <CookieConsentModal />

                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        {/* Se nÃ£o houver slug, renderizamos o HUB */}
                        {!tenantSlug ? (
                          <Route element={<HubErrorBoundary />}>
                            <Route path="/login" element={<HubLogin />} />
                            <Route element={<HubProtectedRoute />}>
                              <Route element={<HubLayout />}>
                                <Route path="/" element={<HubDashboard />} />
                                <Route path="/licenses" element={<HubLicenses />} />
                                <Route path="/prototype" element={<HubPrototype />} />
                                <Route path="/plans" element={<HubPlans />} />
                                <Route path="/auditoria" element={<HubAudit />} />
                                <Route path="/security" element={<HubSecurity />} />
                                <Route path="/settings" element={<HubSettings />} />
                              </Route>
                            </Route>
                            <Route path="/admin/*" element={<Navigate to="/" replace />} />
                          </Route>
                        ) : (
                          <>
                            <Route path="/" element={<Index />} />
                            <Route path="/auth/login" element={<LoginPage />} />
                            <Route path="/auth/register" element={<RegisterPage />} />
                            <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
                            <Route path="/cliente" element={<ProfilePage />} />
                            <Route path="/perfil" element={<ProfilePage />} />
                            
                            {/* Admin routes for Tenants */}
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/admin" element={
                              <ProtectedRoute allowedRoles={['dev', 'admin', 'midia']}>
                                <AdminLayout />
                              </ProtectedRoute>
                            }>
                              <Route path="dashboard" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="dashboard"><Dashboard /></ProtectedRoute>
                              } />
                              <Route path="agendamentos" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="agendamentos"><Agendamentos /></ProtectedRoute>
                              } />
                              <Route path="pacotes" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="pacotes"><Pacotes /></ProtectedRoute>
                              } />
                              <Route path="clientes" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="clientes"><Clientes /></ProtectedRoute>
                              } />
                              <Route path="valores" element={<Navigate to="/admin/servicos" replace />} />
                              <Route path="moderacao" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin', 'midia']} pageKey="moderacao"><Moderacao /></ProtectedRoute>
                              } />
                              <Route path="servicos" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="servicos"><Servicos /></ProtectedRoute>
                              } />
                              <Route path="usuarios" element={
                                <ProtectedRoute allowedRoles={['dev']}><Usuarios /></ProtectedRoute>
                              } />
                              <Route path="configuracoes" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="configuracoes"><Configuracoes /></ProtectedRoute>
                              } />
                              <Route path="audit-log" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="configuracoes"><AuditLog /></ProtectedRoute>
                              } />
                              <Route path="pets" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="clientes"><Pets /></ProtectedRoute>
                              } />
                              <Route path="pet/:petId" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']}><PetProfile /></ProtectedRoute>
                              } />
                              <Route path="financeiro" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="dashboard"><Financeiro /></ProtectedRoute>
                              } />
                              <Route path="estoque" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="dashboard"><Estoque /></ProtectedRoute>
                              } />
                              <Route path="relatorios" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="dashboard"><Relatorios /></ProtectedRoute>
                              } />
                              <Route path="lembretes" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="dashboard"><Lembretes /></ProtectedRoute>
                              } />
                              <Route path="marketing" element={
                                <ProtectedRoute allowedRoles={['dev', 'admin']} pageKey="dashboard"><Marketing /></ProtectedRoute>
                              } />
                            </Route>

                            {/* DevTools â€” standalone layout */}
                            <Route path="/admin/devtools" element={
                              <ProtectedRoute allowedRoles={['dev']}><DevTools /></ProtectedRoute>
                            } />

                            {/* Super Dev Panel */}
                            <Route path="/dev-tools" element={
                              <ProtectedRoute allowedRoles={['dev', 'admin']}><DevToolsPanel /></ProtectedRoute>
                            } />
                          </>
                        )}

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </AdminProvider>
                  </TestModesProvider>
                </AuthProvider>
              </Router>
            </TooltipProvider>
          </BrandingProvider>
        </PetshopProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};


export default App;
