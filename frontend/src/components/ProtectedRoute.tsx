import { Navigate, useLocation } from "react-router-dom";
import React from "react";
import { isAuthenticated, getUser } from "@/lib/auth";

type Props = {
  children: React.ReactElement;
  requiredRole?: "admin" | "user";
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const location = useLocation();

  // Not logged in -> redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const user = getUser();
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const isAdmin = !!user.is_admin;

  // If role mismatch, redirect to the appropriate home
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/user-home" replace />;
  }
  if (requiredRole === "user" && isAdmin) {
    return <Navigate to="/admin-home" replace />;
  }

  return children;
}
