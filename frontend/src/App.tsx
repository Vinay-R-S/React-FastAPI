import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthForm from "./components/AuthForm";
import AdminHome from "./components/AdminHome";
import UserHome from "./components/UserHome";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./components/ProductDetails";
import AdminReviews from "./components/AdminReviews";
import { ModeToggle } from "./components/mode-toggle";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
            path="/admin-home"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminHome />
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
          <Route path="/product/:productId/reviews" element={<ProductDetails />} />
          <Route path="/admin/product/:productId/reviews" element={<AdminReviews />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
