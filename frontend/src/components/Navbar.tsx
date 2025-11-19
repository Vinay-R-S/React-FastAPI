import { useNavigate } from "react-router-dom";
import { getUser, logout as authLogout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = async () => {
    try {
      await authLogout();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
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
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 
            className="text-xl font-bold cursor-pointer bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            onClick={() => navigate(user.is_admin ? "/admin-home" : "/user-home")}
          >
            ProUX
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="hidden sm:inline-flex"
          >
            Home
          </Button>
          {user.is_admin ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/admin-home")}
                className="hidden sm:inline-flex"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/admin-dashboard")}
                className="hidden sm:inline-flex"
              >
                Stats
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => navigate("/user-home")}
              className="hidden sm:inline-flex"
            >
              Dashboard
            </Button>
          )}
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 rounded-full">
                  <AvatarImage src={user.avatar_url || "https://cdn.vectorstock.com/i/500p/29/53/gray-silhouette-avatar-for-male-profile-picture-vector-56412953.jpg"} className="rounded-full object-cover" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.is_admin ? "Administrator" : "User"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/home")}>
                Home
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(user.is_admin ? "/admin-home" : "/user-home")}
              >
                Dashboard
              </DropdownMenuItem>
              {user.is_admin && (
                <DropdownMenuItem onClick={() => navigate("/admin-dashboard")}>
                  Stats Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

