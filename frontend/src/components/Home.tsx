import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, isAuthenticated } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "./Navbar";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    // Auto-redirect after a brief moment to show welcome message
    const timer = setTimeout(() => {
      const currentUser = getUser();
      if (currentUser?.is_admin) {
        navigate("/admin-home");
      } else {
        navigate("/user-home");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to ProUX
            </CardTitle>
            <p className="text-lg text-white">
              Your Product Review Platform
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2 text-white">
                Hello, {user?.name || "User"}! 👋
              </h2>
              <p className="text-white mb-6">
                {user?.is_admin 
                  ? "You are logged in as an Administrator" 
                  : "You are logged in as a User"}
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate(user?.is_admin ? "/admin-home" : "/user-home")}
                  className="px-6"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
              <p className="text-sm text-white mt-4 opacity-80">
                Redirecting automatically...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

