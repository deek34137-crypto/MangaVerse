"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = "Display name must be at least 2 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = "Username must be 3-20 characters (letters, numbers, underscore)";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength < 3) {
      newErrors.password = "Password is too weak";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.terms) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Registration Failed",
          description: data.error || "An error occurred during registration",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account Created!",
        description: "Welcome to MangaHub! Redirecting to login...",
      });

      setTimeout(() => {
        router.push(`/login?callbackUrl=/`);
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const passwordStrengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <ToastProvider>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <svg className="h-7 w-7 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className="font-display font-bold text-2xl text-foreground">MangaHub</span>
            </Link>
            <h1 className="text-display-sm font-display font-bold text-foreground">Create Account</h1>
            <p className="text-body-md text-muted-foreground mt-2">
              Join millions of readers and start your manga journey
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your details to create an account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      placeholder="John Doe"
                      value={formData.displayName}
                      onChange={(e) => setFormData(d => ({ ...d, displayName: e.target.value }))}
                      className={cn("pl-10", errors.displayName && "border-destructive")}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.displayName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) => setFormData(d => ({ ...d, username: e.target.value.toLowerCase() }))}
                      className={cn("pl-8", errors.username && "border-destructive")}
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                      className={cn("pl-10", errors.email && "border-destructive")}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(d => ({ ...d, password: e.target.value }));
                        calculatePasswordStrength(e.target.value);
                      }}
                      className={cn("pl-10 pr-10", errors.password && "border-destructive")}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            passwordStrengthColors[passwordStrength - 1] || "bg-muted"
                          )}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength: {passwordStrengthLabels[passwordStrength - 1] || "Very Weak"}
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(d => ({ ...d, confirmPassword: e.target.value }))}
                      className={cn("pl-10 pr-10", errors.confirmPassword && "border-destructive")}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={(e) => setFormData(d => ({ ...d, terms: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="text-sm text-muted-foreground">
                      I agree to the
                      <Link href="/terms" className="text-primary hover:underline ml-1">Terms of Service</Link>
                      {" "}
                      and
                      <Link href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>
                    </div>
                  </label>
                  {errors.terms && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.terms}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}