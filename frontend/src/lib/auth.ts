// Auth utility functions for managing authentication state

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.is_admin ?? false;
};

export const logout = async (): Promise<void> => {
  const token = getToken();
  
  // Call logout endpoint to clear token from database
  if (token) {
    try {
      await fetch("http://127.0.0.1:8000/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API call failed:", error);
    }
  }
  
  // Clear local storage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const setAuth = (token: string, user: User): void => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

