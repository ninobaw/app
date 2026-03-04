import 'react/jsx-runtime';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServerStatusProvider, MaintenanceOverlay } from "@/components/ui/server-status";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Documents from "./pages/Documents";
import FormulairesDoc from "./pages/FormulairesDoc";
import Correspondances from "./pages/Correspondances";
import ProcesVerbaux from "./pages/ProcesVerbaux";
import Users from "./pages/Users";
import Actions from "./pages/Actions";
import QRCodes from "./pages/QRCodes";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import AuditLogs from "./pages/AuditLogs";
import MicrosoftOfficeEditorPage from '@/pages/MicrosoftOfficeEditorPage';
import CollaboraEditorPage from '@/pages/CollaboraEditorPage';
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SecureResetPasswordPage from "./pages/SecureResetPasswordPage";
import WorkflowPage from "./pages/WorkflowPage";
import EnhancedWorkflowPage from "./pages/EnhancedWorkflowPage";
import PublicViewPage from "./pages/PublicViewPage";
import Dashboard from "./pages/Dashboard";
import TestWorkflowChat from "./components/debug/TestWorkflowChat";
import { TemporaryLinkHandler } from "./components/auth/TemporaryLinkHandler";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ServerStatusProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
          <Routes>
            {/* Routes publiques (non protégées) */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/:tokenId" element={<SecureResetPasswordPage />} />
            <Route path="/public-view/:type/:id" element={<PublicViewPage />} />
            <Route path="/temp-login" element={<TemporaryLinkHandler />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Routes protégées */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/test-chat" element={
              <ProtectedRoute>
                <TestWorkflowChat />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute requiredPermission="view_documents">
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="/documents/formulaires" element={
              <ProtectedRoute requiredPermission="manage_forms">
                <FormulairesDoc />
              </ProtectedRoute>
            } />
            <Route path="/documents/templates" element={
              <ProtectedRoute requiredPermission="manage_templates">
                <Templates />
              </ProtectedRoute>
            } />
            <Route path="/documents/edit/:documentId" element={ 
              <ProtectedRoute>
                <CollaboraEditorPage />
              </ProtectedRoute>
            } />
            {/* Microsoft Office 365 routes */}
            <Route path="/documents/edit-microsoft/:documentId" element={ 
              <ProtectedRoute>
                <MicrosoftOfficeEditorPage />
              </ProtectedRoute>
            } />
            <Route path="/correspondances/edit-microsoft/:documentId" element={ 
              <ProtectedRoute>
                <MicrosoftOfficeEditorPage />
              </ProtectedRoute>
            } />
            <Route path="/proces-verbaux/edit-microsoft/:documentId" element={ 
              <ProtectedRoute>
                <MicrosoftOfficeEditorPage />
              </ProtectedRoute>
            } />
            {/* Collabora Online routes */}
            <Route path="/documents/edit-collabora/:documentId" element={ 
              <ProtectedRoute>
                <CollaboraEditorPage />
              </ProtectedRoute>
            } />
            <Route path="/correspondances/edit-collabora/:documentId" element={ 
              <ProtectedRoute>
                <CollaboraEditorPage />
              </ProtectedRoute>
            } />
            <Route path="/proces-verbaux/edit-collabora/:documentId" element={ 
              <ProtectedRoute>
                <CollaboraEditorPage />
              </ProtectedRoute>
            } />
            {/* All editor routes now use Collabora as primary editor */}
            <Route path="/correspondances/edit/:documentId" element={ 
              <ProtectedRoute>
                <CollaboraEditorPage />
              </ProtectedRoute>
            } />
            <Route path="/proces-verbaux/edit/:documentId" element={ 
              <ProtectedRoute>
                <CollaboraEditorPage />
              </ProtectedRoute>
            } />

            <Route path="/correspondances" element={
              <ProtectedRoute requiredPermission="view_correspondences">
                <Correspondances />
              </ProtectedRoute>
            } />
            <Route path="/correspondances/:id" element={
              <ProtectedRoute requiredPermission="view_correspondences">
                <Correspondances />
              </ProtectedRoute>
            } />
            <Route path="/workflow/:workflowId" element={
              <ProtectedRoute>
                <WorkflowPage />
              </ProtectedRoute>
            } />
            <Route path="/enhanced-workflow/:workflowId" element={
              <ProtectedRoute>
                <EnhancedWorkflowPage />
              </ProtectedRoute>
            } />
            <Route path="/proces-verbaux" element={
              <ProtectedRoute requiredPermission="view_proces_verbaux">
                <ProcesVerbaux />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requiredPermission="manage_users">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/actions" element={
              <ProtectedRoute requiredPermission="view_actions">
                <Actions />
              </ProtectedRoute>
            } />
            <Route path="/qr-codes" element={
              <ProtectedRoute requiredPermission="view_qr_codes">
                <QRCodes />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredPermission="view_reports">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/audit-logs" element={
              <ProtectedRoute requiredPermission="view_audit_logs">
                <AuditLogs />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredPermission="manage_settings">
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <MaintenanceOverlay />
    </ServerStatusProvider>
  </TooltipProvider>
</QueryClientProvider>
);
export default App;