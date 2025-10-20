import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldGroup,
  Field,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const toggleMode = () => setIsSignUp((prev) => !prev);

  const title = isSignUp ? "Create Account" : "Welcome Back";
  const buttonText = isSignUp ? "Sign Up" : "Log In";
  const switchPrompt = isSignUp
    ? "Already have an account?"
    : "Don't have an account?";
  const switchAction = isSignUp ? "Log In" : "Sign Up";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
    const nameInput = document.getElementById(
      "name"
    ) as HTMLInputElement | null;
    const name = nameInput ? nameInput.value : null;

    const endpoint = isSignUp ? "signup" : "login";

    try {
      const res = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignUp
            ? { email, password, name, is_admin: isAdmin }
            : { email, password }
        ),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          data.message ||
            (isSignUp ? "Account created successfully!" : "Login successful!")
        );

        // Store token and user data
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Clear inputs
        (document.getElementById("email") as HTMLInputElement).value = "";
        (document.getElementById("password") as HTMLInputElement).value = "";
        if (nameInput) nameInput.value = "";
        const confirmPassword = document.getElementById(
          "confirm-password"
        ) as HTMLInputElement | null;
        if (confirmPassword) confirmPassword.value = "";

        // Redirect based on role
        setTimeout(() => {
          if (data.user?.is_admin) {
            navigate("/admin-home");
          } else {
            navigate("/user-home");
          }
        }, 1000);
      } else {
        toast.error(data.detail || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Unable to connect to the server.");
    }
  };

  return (
    <div className="w-full">
      <h1 className="w-full text-center text-2xl font-extrabold text-white mb-6">
        ProUX
      </h1>

      <Card className="w-full max-w-sm mx-auto gap-2">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <FieldSet>
              <FieldLegend className="sr-only">
                {isSignUp ? "Sign Up" : "Login"}
              </FieldLegend>
              <FieldDescription>
                {isSignUp
                  ? "Create your account to get started."
                  : "Log in to access your account."}
              </FieldDescription>

              <FieldGroup className="gap-3">
                {isSignUp && (
                  <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Email ID</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input id="password" type="password" required />
                </Field>

                {isSignUp && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="confirm-password">
                        Confirm Password
                      </FieldLabel>
                      <Input id="confirm-password" type="password" required />
                    </Field>

                    <Field className="flex flex-col gap-1">
                      <FieldLabel htmlFor="is-admin">Admin Account</FieldLabel>
                      <Select
                        value={isAdmin ? "true" : "false"}
                        onValueChange={(val) => setIsAdmin(val === "true")}
                      >
                        <SelectTrigger id="is-admin" className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                )}
              </FieldGroup>
            </FieldSet>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 mt-2">
            <Button type="submit" className="w-full bg-[#e6e6e6] text-white">
              {buttonText}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              {switchPrompt}{" "}
              <a
                href="#"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  toggleMode();
                }}
                className="text-black inline-flex items-center justify-center rounded-md text-sm font-medium p-0 h-auto hover:underline"
              >
                {switchAction}
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default AuthForm;
