import { ThemeProvider } from "@/components/theme-provider";
import AuthForm from "./components/AuthForm";
import AdminHome from "./components/AdminHome";
import UserHome from "./components/UserHome";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./components/ProductDetails";
import AdminReviews from "./components/AdminReviews";
import AdminDashboard from "./components/AdminDashboard";
import UserProfile from "./components/UserProfile";
import { ModeToggle } from "./components/mode-toggle";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function ApiDocs() {
  return (
    <div className="w-full min-h-screen flex justify-center items-center p-6 bg-background">
      <iframe
        src="http://127.0.0.1:8000/api.html"
        title="API Documentation"
        className="w-[90%] h-[90vh] border rounded-xl shadow-lg"
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Toaster richColors position="top-right" />

      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <div className="w-full">
                <div className="relative min-h-screen flex items-center justify-center">
                  <div className="absolute top-4 right-4 z-50">
                    <ModeToggle />
                  </div>
                  <AuthForm />
                </div>
              </div>
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-home"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-home"
            element={
              <ProtectedRoute requiredRole="user">
                <UserHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:productId/reviews"
            element={<ProductDetails />}
          />
          <Route
            path="/admin/product/:productId/reviews"
            element={<AdminReviews />}
          />
          <Route path="/api.html" element={<ApiDocs />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
