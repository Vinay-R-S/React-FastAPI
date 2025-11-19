import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Navbar from "./Navbar";
import { isAuthenticated, getUser, getToken, setAuth } from "@/lib/auth";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    avatar_url: "",
    password: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    const currentUser = getUser();
    setUser(currentUser);
    setForm({
      name: currentUser?.name || "",
      avatar_url: currentUser?.avatar_url || "",
      password: "",
    });
  }, [navigate]);

  const handleSubmit = async () => {
    try {
      const token = getToken();
      const res = await fetch("http://127.0.0.1:8000/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            name: form.name,
            avatar_url: form.avatar_url,
            password: form.password || undefined
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated!");
        // Update local storage
        setAuth(token!, data.user);
        setUser(data.user);
        setForm(prev => ({ ...prev, password: "" })); // Clear password field
      } else {
        toast.error(data.detail || "Failed to update profile");
      }
    } catch {
      toast.error("Server error");
    }
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url || "https://cdn.vectorstock.com/i/500p/29/53/gray-silhouette-avatar-for-male-profile-picture-vector-56412953.jpg"} className="object-cover rounded-full" />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar URL</label>
              <Input
                value={form.avatar_url}
                placeholder="https://example.com/avatar.jpg"
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password (Optional)</label>
              <Input
                type="password"
                placeholder="Leave blank to keep current"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleSubmit}>
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
