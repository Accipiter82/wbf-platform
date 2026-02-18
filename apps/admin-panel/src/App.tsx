import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppShell, LoadingOverlay } from "@mantine/core";
import { RootState } from "./store";
import { getCurrentUser } from "./store/slices/authSlice";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterStep1Page from "./pages/RegisterStep1Page";
import RegisterStep2Page from "./pages/RegisterStep2Page";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import DashboardPage from "./pages/DashboardPage";
import BrowseOrganisationsPage from "./pages/BrowseOrganisationsPage";
import OrganisationDetailPage from "./pages/OrganisationDetailPage";
import EditSubmissionPage from "./pages/EditSubmissionPage";
import AdminReviewPage from "./pages/AdminReviewPage";

// New dashboard feature imports
import OrganisationsPage from "./features/organisations/pages/OrganisationsPage";
import CallsProjectsPage from "./features/calls-projects/pages/CallsProjectsPage";
import NotificationsPage from "./features/notifications-messages/pages/NotificationsPage";
import ProfilePage from "./features/profile/pages/ProfilePage";
import OrganisationProfilePage from "./features/organisations/pages/OrganisationProfilePage";
import ScrollToTop from "./components/ScrollToTop";

// Super Admin imports
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import SuperAdminOrganisationsPage from "./pages/SuperAdminOrganisationsPage";
import SuperAdminUsersPage from "./pages/SuperAdminUsersPage";
import SuperAdminCallsProjectsPage from "./pages/SuperAdminCallsProjectsPage";
import SuperAdminCreateCallProjectPage from "./pages/SuperAdminCreateCallProjectPage";

function App() {
  const dispatch = useDispatch();
  const { token, isLoading, user, organisation } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser(token) as any);
    }
  }, [dispatch, token, user]);

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  // Check if user needs to complete profile
  const needsProfileCompletion =
    token && organisation && organisation.status === "draft";

  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/step-1" element={<RegisterStep1Page />} />
        <Route path="/register/step-2" element={<RegisterStep2Page />} />
        <Route path="/browse" element={<BrowseOrganisationsPage />} />
        <Route path="/organisation/:id" element={<OrganisationDetailPage />} />
        <Route
          path="/organisations/:id"
          element={<OrganisationProfilePage />}
        />

        {/* Profile completion route - redirect to dashboard if profile already completed */}
        <Route
          path="/complete-profile"
          element={
            token ? (
              needsProfileCompletion ? (
                <CompleteProfilePage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected routes - redirect to profile completion if needed */}
        <Route
          path="/dashboard"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <DashboardPage />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Dashboard feature routes */}
        <Route
          path="/dashboard/organisations"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <OrganisationsPage />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dashboard/calls-projects"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <CallsProjectsPage />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dashboard/notifications"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <NotificationsPage />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <ProfilePage />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/edit-submission"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <Layout>
                  <EditSubmissionPage />
                </Layout>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/review"
          element={
            token && user?.role === "admin" ? (
              <Layout>
                <AdminReviewPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Super Admin routes */}
        <Route path="/admin/login" element={<SuperAdminLoginPage />} />

        <Route
          path="/super-admin/dashboard"
          element={
            token && user?.role === "super_admin" ? (
              <SuperAdminDashboardPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        <Route
          path="/super-admin/organisations"
          element={
            token && user?.role === "super_admin" ? (
              <SuperAdminOrganisationsPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        <Route
          path="/super-admin/calls-projects"
          element={
            token && user?.role === "super_admin" ? (
              <SuperAdminCallsProjectsPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        <Route
          path="/super-admin/calls-projects/create"
          element={
            token && user?.role === "super_admin" ? (
              <SuperAdminCreateCallProjectPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        <Route
          path="/super-admin/admin-users"
          element={
            token && user?.role === "super_admin" ? (
              <SuperAdminUsersPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            token ? (
              needsProfileCompletion ? (
                <Navigate to="/complete-profile" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </AppShell>
  );
}

export default App;
