// ─── App.jsx — Router + Auth Guard + Global TopNavbar + ProfilePanel ─────────
import { useContext, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import TopNavbar from "./components/TopNavbar";
import UserProfilePanel from "./components/UserProfilePanel";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import ComingSoon from "./pages/ComingSoon";
import ErrorBoundary from "./components/ErrorBoundary";

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, requireRole }) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#2fc6f6", fontSize: "18px" }}>
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (requireRole && !requireRole.includes(user.role)) {
    return <Navigate to="/messages" />;
  }

  return children;
}

// ─── AuthenticatedLayout — TopNavbar + content + global ProfilePanel ─────────
function AuthenticatedLayout({ children }) {
  const { user } = useContext(AuthContext);
  const [profileUserId, setProfileUserId] = useState(null);

  // TopNavbar-dan "open-profile" event-i dinlə
  useEffect(() => {
    const handler = (e) => setProfileUserId(e.detail.userId);
    window.addEventListener("open-profile", handler);
    return () => window.removeEventListener("open-profile", handler);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopNavbar />
      <div className="app-content">
        {children}
      </div>

      {/* Global ProfilePanel — bütün səhifələrdə işləyir */}
      {profileUserId && user && (
        <UserProfilePanel
          userId={profileUserId}
          currentUserId={user.id}
          isOwnProfile={profileUserId === user.id}
          onClose={() => setProfileUserId(null)}
          onStartChat={() => setProfileUserId(null)}
        />
      )}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
    <ToastProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* / → /messages redirect */}
      <Route path="/" element={<Navigate to="/messages" replace />} />

      <Route path="/messages" element={
        <ProtectedRoute>
          <AuthenticatedLayout><Chat /></AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/feed" element={
        <ProtectedRoute>
          <AuthenticatedLayout><ComingSoon title="Feed" /></AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/drive" element={
        <ProtectedRoute>
          <AuthenticatedLayout><ComingSoon title="Drive" /></AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <AuthenticatedLayout><ComingSoon title="Settings" /></AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requireRole={["Admin", "SuperAdmin"]}>
          <AuthenticatedLayout><AdminPanel /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/:section" element={
        <ProtectedRoute requireRole={["Admin", "SuperAdmin"]}>
          <AuthenticatedLayout><AdminPanel /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users/:userId" element={
        <ProtectedRoute requireRole={["Admin", "SuperAdmin"]}>
          <AuthenticatedLayout><AdminPanel /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
