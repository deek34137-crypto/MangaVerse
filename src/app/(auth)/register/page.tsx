"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Mail, Lock, Eye, EyeOff, User, AlertCircle,
  Loader2, ArrowRight, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

/* ─── OAuth providers ────────────────────────────────────────────────────── */
const oauthProviders = [
  {
    id: "github" as const,
    name: "GitHub",
    className: "btn-oauth btn-oauth-github",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
      </svg>
    ),
  },
  {
    id: "google" as const,
    name: "Google",
    className: "btn-oauth btn-oauth-google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "discord" as const,
    name: "Discord",
    className: "btn-oauth btn-oauth-discord",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#5865F2" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.055a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
      </svg>
    ),
  },
];

/* ─── Password strength ──────────────────────────────────────────────────── */
function calcStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8)            s++;
  if (/[A-Z]/.test(pw))          s++;
  if (/[a-z]/.test(pw))          s++;
  if (/[0-9]/.test(pw))          s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
}

const strengthLabels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-400", "bg-emerald-500"];
const strengthText   = ["", "text-red-400", "text-orange-400", "text-yellow-400", "text-green-400", "text-emerald-400"];

/* ─── Field error ────────────────────────────────────────────────────────── */
function FieldError({ msg }: { msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-destructive flex items-center gap-1 mt-1"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" /> {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* ─── Main content ───────────────────────────────────────────────────────── */
function RegisterContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading]         = useState(false);
  const [oauthLoading, setOauthLoading]   = useState<string | null>(null);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [errors, setErrors]               = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const strength = calcStrength(form.password);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.displayName.trim() || form.displayName.length < 2)
      e.displayName = "Display name must be at least 2 characters";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
      e.username = "3–20 chars: letters, numbers, underscore only";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!form.terms)
      e.terms = "You must accept the terms to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Registration Failed", description: data.error ?? "Something went wrong.", variant: "destructive" });
      } else {
        toast({ title: "Account Created! 🎉", description: "Welcome to MangaHub. Please sign in." });
        router.push("/login?registered=1");
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* ── Left panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 gradient-animated opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/30 to-transparent" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px),
                              linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 max-w-md px-8 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Join 500K+ manga enthusiasts
            </div>
            <h2 className="text-heading-lg text-foreground mb-4">
              Start your manga<br />
              <span className="text-gradient">journey today</span>
            </h2>
            <p className="text-body-md text-muted-foreground leading-relaxed mb-8">
              Create your free account and unlock the full MangaHub experience.
            </p>
            {/* Feature list */}
            <div className="text-left space-y-3">
              {[
                "Track your reading progress across thousands of titles",
                "Get personalised recommendations based on your taste",
                "Sync your library across all your devices",
                "Join a passionate global manga community",
              ].map((feat) => (
                <div key={feat} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{feat}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right form ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-1/2 xl:w-2/5 flex flex-col items-center justify-center px-6 py-10 relative overflow-y-auto"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-7">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                <svg className="h-6 w-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className="font-display font-bold text-2xl text-foreground tracking-tight">MangaHub</span>
            </Link>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Create account</h1>
            <p className="text-muted-foreground text-sm">It's free — no credit card required</p>
          </motion.div>

          {/* Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 space-y-4">

            {/* OAuth */}
            <div className="space-y-2.5">
              {oauthProviders.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => { setOauthLoading(p.id); signIn(p.id, { callbackUrl: "/" }); }}
                  disabled={!!oauthLoading || isLoading}
                  className={cn(p.className, "disabled:opacity-50 disabled:cursor-not-allowed")}
                  whileHover={{ scale: oauthLoading ? 1 : 1.01, y: oauthLoading ? 0 : -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {oauthLoading === p.id ? <Loader2 className="h-5 w-5 animate-spin" /> : p.icon}
                  <span>{oauthLoading === p.id ? `Connecting…` : `Sign up with ${p.name}`}</span>
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">or with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Display name + username row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="displayName" className="text-xs mb-1.5 block">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input id="displayName" placeholder="Manga Fan" value={form.displayName} onChange={set("displayName")}
                      className={cn("pl-9 h-9 text-sm", errors.displayName && "border-destructive")} disabled={isLoading} />
                  </div>
                  <FieldError msg={errors.displayName} />
                </div>
                <div>
                  <Label htmlFor="username" className="text-xs mb-1.5 block">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input id="username" placeholder="mangafan" value={form.username} onChange={set("username")}
                      className={cn("pl-7 h-9 text-sm", errors.username && "border-destructive")} disabled={isLoading} />
                  </div>
                  <FieldError msg={errors.username} />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-xs mb-1.5 block">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")}
                    className={cn("pl-9 h-9 text-sm", errors.email && "border-destructive")} disabled={isLoading} autoComplete="email" />
                </div>
                <FieldError msg={errors.email} />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-xs mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={set("password")}
                    className={cn("pl-9 pr-9 h-9 text-sm", errors.password && "border-destructive")} disabled={isLoading} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <motion.div
                          key={i}
                          className={cn("flex-1 h-1 rounded-full transition-colors duration-300",
                            i <= strength ? strengthColors[strength] : "bg-border")}
                          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                          transition={{ delay: (i - 1) * 0.04 }}
                        />
                      ))}
                    </div>
                    <p className={cn("text-[11px] font-medium", strengthText[strength])}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
                <FieldError msg={errors.password} />
              </div>

              {/* Confirm password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-xs mb-1.5 block">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")}
                    className={cn("pl-9 pr-9 h-9 text-sm", errors.confirmPassword && "border-destructive",
                      form.confirmPassword && form.confirmPassword === form.password && "border-green-500/50")}
                    disabled={isLoading} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle confirm password">
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  {form.confirmPassword && form.confirmPassword === form.password && (
                    <Check className="absolute right-9 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-400" />
                  )}
                </div>
                <FieldError msg={errors.confirmPassword} />
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={form.terms} onChange={set("terms")}
                    className="h-4 w-4 mt-0.5 rounded border-border accent-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </span>
                </label>
                <FieldError msg={errors.terms} />
              </div>

              {/* Submit */}
              <motion.button type="submit" disabled={isLoading || !!oauthLoading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 mt-1"
              >
                {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>) : (<>Create Account <ArrowRight className="h-4 w-4" /></>)}
              </motion.button>
            </form>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:text-primary-hover transition-colors hover:underline">Sign in</Link>
          </motion.p>
        </div>
      </motion.div>

      <Toaster />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}