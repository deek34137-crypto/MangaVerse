"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, AlertCircle, Loader2, CheckCircle, ArrowLeft, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/login";
  const { toast } = useToast();

  const [step, setStep] = useState<"email" | "verify" | "reset" | "success">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const validateEmail = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCode = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code) newErrors.code = "Verification code is required";
    else if (!/^\d{6}$/.test(formData.code)) newErrors.code = "Code must be 6 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to send verification code",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code Sent!",
        description: `We've sent a 6-digit code to ${formData.email}`,
      });

      setStep("verify");
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: formData.code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Invalid Code",
          description: data.error || "The verification code is incorrect or expired",
          variant: "destructive",
        });
        return;
      }

      setStep("reset");
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to reset password",
          variant: "destructive",
        });
        return;
      }

      setStep("success");
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

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    handleSendCode({ preventDefault: () => {} } as React.FormEvent);
  };

  const steps = [
    { id: "email", label: "Email" },
    { id: "verify", label: "Verify" },
    { id: "reset", label: "Reset" },
    { id: "success", label: "Done" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

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

            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all",
                      i < currentStepIndex
                        ? "bg-primary text-primary-foreground"
                        : i === currentStepIndex
                        ? "bg-primary/10 text-primary border border-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i < currentStepIndex ? <CheckCircle className="h-5 w-5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-0.5 mx-2",
                        i < currentStepIndex ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <h1 className="text-display-sm font-display font-bold text-foreground">
              {step === "email" && "Forgot Password"}
              {step === "verify" && "Verify Code"}
              {step === "reset" && "New Password"}
              {step === "success" && "All Set!"}
            </h1>
            <p className="text-body-md text-muted-foreground mt-2">
              {step === "email" && "Enter your email to receive a verification code"}
              {step === "verify" && `We've sent a 6-digit code to ${formData.email}`}
              {step === "reset" && "Create a new password for your account"}
              {step === "success" && "Your password has been reset successfully"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{step === "email" && "Enter Email"}{step === "verify" && "Verify Code"}{step === "reset" && "New Password"}{step === "success" && "Success"}</CardTitle>
              <CardDescription>
                {step === "email" && "We'll send a verification code to your email"}
                {step === "verify" && "Enter the 6-digit code sent to your email"}
                {step === "reset" && "Your new password must be at least 8 characters"}
                {step === "success" && "You can now sign in with your new password"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === "email" && (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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

                  <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                    {isLoading ? (
                      <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending... </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </form>
              )}

              {step === "verify" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="••••••"
                        value={formData.code}
                        onChange={(e) => setFormData(d => ({ ...d, code: e.target.value }))}
                        className={cn("pl-10 text-center text-2xl tracking-widest", errors.code && "border-destructive")}
                        disabled={isLoading}
                        autoComplete="one-time-code"
                        maxLength={6}
                      />
                    </div>
                    {errors.code && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.code}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                    {isLoading ? (
                      <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying... </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || isLoading}
                  >
                    {resendTimer > 0 ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Resend in {resendTimer}s
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </Button>
                </form>
              )}

              {step === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData(d => ({ ...d, password: e.target.value }))}
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
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(d => ({ ...d, confirmPassword: e.target.value }))}
                        className={cn("pl-10 pr-10", errors.confirmPassword && "border-destructive")}
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
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                    {isLoading ? (
                      <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Resetting... </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              )}

              {step === "success" && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-heading-md font-semibold text-foreground mb-2">Password Reset Complete</h3>
                  <p className="text-muted-foreground mb-6">Your password has been successfully updated.</p>
                  <Button className="w-full" onClick={() => router.push(callbackUrl)} size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{" "}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}