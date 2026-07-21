"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, Palette, BookOpen, Download, Trash2, Key, Moon, Sun, Monitor, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { ClientOnly } from "@/components/ui/ClientOnly";

const tabs = [
  { id: "profile", label: "Profile", icon: User, description: "Manage your profile and avatar" },
  { id: "reading", label: "Reading", icon: BookOpen, description: "Configure reading preferences" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Customize the look and feel" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Manage notification preferences" },
  { id: "privacy", label: "Privacy", icon: Shield, description: "Control your privacy settings" },
  { id: "data", label: "Data", icon: Download, description: "Manage your data and account" },
];

const themes = [
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes at night" },
  { value: "light", label: "Light", icon: Sun, description: "Bright and clean" },
  { value: "system", label: "System", icon: Monitor, description: "Match your OS setting" },
];

const readingDirections = [
  { value: "rtl", label: "Right to Left", description: "Traditional manga reading" },
  { value: "ltr", label: "Left to Right", description: "Western comic style" },
  { value: "vertical", label: "Vertical Scroll", description: "Webtoon style continuous scroll" },
];

const pageTransitions = [
  { value: "slide", label: "Slide", description: "Smooth sliding transition" },
  { value: "fade", label: "Fade", description: "Subtle fade transition" },
  { value: "curl", label: "Page Curl", description: "Realistic page turn effect" },
  { value: "none", label: "None", description: "Instant page changes" },
];

const imageQualities = [
  { value: "low", label: "Low (Data Saver)", description: "Compressed images, faster loading" },
  { value: "medium", label: "Medium", description: "Balanced quality and speed" },
  { value: "high", label: "High", description: "High quality images" },
  { value: "original", label: "Original", description: "Full quality, slower loading" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "zh", label: "Chinese (中文)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "pt", label: "Portuguese (Português)" },
  { value: "it", label: "Italian (Italiano)" },
  { value: "ru", label: "Russian (Русский)" },
];

export function SettingsClient() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [profile, setProfile] = useState<{
    displayName: string;
    username: string;
    email: string;
    bio: string;
    avatar: string;
  }>({
    displayName: session?.user?.displayName || session?.user?.name || "",
    username: session?.user?.username || "",
    email: session?.user?.email || "",
    bio: "",
    avatar: session?.user?.avatar || session?.user?.image || "",
  });

  // Sync profile state with real session user when session finishes loading
  useEffect(() => {
    if (session?.user) {
      setProfile((prev) => ({
        ...prev,
        displayName: session.user.displayName || session.user.name || prev.displayName,
        username: session.user.username || prev.username,
        email: session.user.email || prev.email,
        avatar: session.user.avatar || session.user.image || prev.avatar,
      }));
    }
  }, [session?.user]);

  const [readingPrefs, setReadingPrefs] = useState({
    direction: "rtl",
    transition: "slide",
    quality: "high",
    autoPlay: false,
    autoPlayDelay: 3000,
    showMature: false,
    languages: ["en"],
    fitMode: "width",
  });

  const [appearancePrefs, setAppearancePrefs] = useState({
    theme: "dark",
    fontSize: 100,
    lineHeight: 150,
    reducedMotion: false,
    highContrast: false,
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    newChapter: true,
    libraryUpdates: true,
    recommendations: true,
    social: true,
    marketing: false,
  });

  const [privacyPrefs, setPrivacyPrefs] = useState({
    profileVisibility: "public",
    libraryVisibility: "public",
    historyVisibility: "private",
    activityVisibility: "public",
    showOnlineStatus: true,
    allowRecommendations: true,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const handleSave = async (section: string) => {
    setIsSaving(true);
    setSaveStatus("idle");
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-padded py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-display-md font-display font-bold text-foreground">Settings</h1>
          <p className="text-body-md text-muted-foreground mt-1">
            Manage your account, preferences, and reading experience
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-48 flex-shrink-0">
            {/* Mobile horizontal scroll menu */}
            <div className="flex lg:hidden gap-1.5 overflow-x-auto scrollbar-hide pb-3 border-b border-border/40 mb-2 -mx-4 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
 
            {/* Desktop sidebar */}
            <nav className="hidden lg:flex flex-col gap-1" role="navigation" aria-label="Settings sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold transition-all z-10 text-left",
                    activeTab === tab.id ? "text-foreground" : "text-ink-400 hover:text-foreground hover:bg-ink-800"
                  )}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-settings-bg"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-sm -z-10"
                      transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {activeTab === "profile" && (
                  <ProfileSettings
                    profile={profile}
                    setProfile={setProfile}
                    handleSave={() => handleSave("profile")}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                  />
                )}

                {activeTab === "reading" && (
                  <ReadingSettings
                    prefs={readingPrefs}
                    setPrefs={setReadingPrefs}
                    handleSave={() => handleSave("reading")}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                  />
                )}

                {activeTab === "appearance" && (
                  <ClientOnly fallback={
                    <div className="h-60 flex items-center justify-center text-muted-foreground bg-muted/20 border border-border rounded-xl">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs">Loading appearance settings...</span>
                      </div>
                    </div>
                  }>
                    <AppearanceSettings
                      prefs={appearancePrefs}
                      setPrefs={setAppearancePrefs}
                      theme={theme ?? "dark"}
                      setTheme={setTheme}
                      handleSave={() => handleSave("appearance")}
                      isSaving={isSaving}
                      saveStatus={saveStatus}
                    />
                  </ClientOnly>
                )}

                {activeTab === "notifications" && (
                  <NotificationSettings
                    prefs={notificationPrefs}
                    setPrefs={setNotificationPrefs}
                    handleSave={() => handleSave("notifications")}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                  />
                )}

                {activeTab === "privacy" && (
                  <PrivacySettings
                    prefs={privacyPrefs}
                    setPrefs={setPrivacyPrefs}
                    handleSave={() => handleSave("privacy")}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                  />
                )}

                {activeTab === "data" && (
                  <DataSettings
                    security={security}
                    setSecurity={setSecurity}
                    handleSave={() => handleSave("data")}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ profile, setProfile, handleSave, isSaving, saveStatus }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>How others see you on MangaHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar} alt={profile.displayName} />
              <AvatarFallback className="text-2xl">{profile.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => {}}>
                Change Avatar
              </Button>
              <Button variant="ghost" onClick={() => {}}>
                Remove Avatar
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile((p: typeof profile) => ({ ...p, displayName: e.target.value }))}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile((p: typeof profile) => ({ ...p, username: e.target.value }))}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">Unique identifier for your profile URL</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p: typeof profile) => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile((p: typeof profile) => ({ ...p, bio: e.target.value }))}
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Tell others about yourself..."
              />
              <p className="text-xs text-muted-foreground">{profile.bio.length}/500 characters</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving... </>
              ) : (
                <> <Save className="h-4 w-4 mr-2" /> Save Changes </>
              )}
            </Button>
          </div>

          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              Profile saved successfully!
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Link external accounts for easier login</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {["Google", "GitHub", "Discord", "Twitter", "Apple"].map((provider) => (
            <div key={provider} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  {provider.slice(0, 1)}
                </div>
                <div>
                  <p className="font-medium">{provider}</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface ReadingPrefs {
  direction: string;
  transition: string;
  quality: string;
  autoPlay: boolean;
  autoPlayDelay: number;
  showMature: boolean;
  languages: string[];
  fitMode: string;
}

function ReadingSettings({ prefs, setPrefs, handleSave, isSaving, saveStatus }: {
  prefs: ReadingPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<ReadingPrefs>>;
  handleSave: () => void;
  isSaving: boolean;
  saveStatus: string;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reading Direction</CardTitle>
          <CardDescription>Choose your preferred reading direction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {readingDirections.map((dir) => (
              <button
                key={dir.value}
                onClick={() => setPrefs(p => ({ ...p, direction: dir.value }))}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  prefs.direction === dir.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium">{dir.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{dir.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Transition</CardTitle>
          <CardDescription>Animation style when changing pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {pageTransitions.map((trans) => (
              <button
                key={trans.value}
                onClick={() => setPrefs(p => ({ ...p, transition: trans.value }))}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-center",
                  prefs.transition === trans.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium capitalize">{trans.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{trans.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Quality</CardTitle>
          <CardDescription>Balance between quality and loading speed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {imageQualities.map((qual) => (
              <button
                key={qual.value}
                onClick={() => setPrefs(p => ({ ...p, quality: qual.value }))}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  prefs.quality === qual.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium">{qual.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{qual.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Advance</CardTitle>
          <CardDescription>Automatically load next chapter when reaching the end</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Auto-Advance</p>
              <p className="text-sm text-muted-foreground">Automatically go to next chapter</p>
            </div>
            <Switch
              checked={prefs.autoPlay}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, autoPlay: checked }))}
            />
          </label>

          {prefs.autoPlay && (
            <div className="space-y-2">
              <Label htmlFor="autoPlayDelay">Delay (milliseconds)</Label>
              <Slider
                id="autoPlayDelay"
                value={[prefs.autoPlayDelay]}
                onValueChange={([v]) => setPrefs(p => ({ ...p, autoPlayDelay: v }))}
                min={1000}
                max={10000}
                step={500}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">Current: {prefs.autoPlayDelay}ms</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language Preferences</CardTitle>
          <CardDescription>Preferred languages for manga (in order of preference)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {languages.slice(0, 8).map((lang) => (
              <button
                key={lang.value}
                onClick={() => setPrefs(p => ({
                  ...p,
                  languages: p.languages.includes(lang.value)
                    ? p.languages.filter((l: string) => l !== lang.value)
                    : [...p.languages, lang.value]
                }))}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm border transition-all",
                  prefs.languages.includes(lang.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Drag to reorder (coming soon)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
          <CardDescription>Control what content is visible</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Mature Content</p>
              <p className="text-sm text-muted-foreground">Display manga with mature themes</p>
            </div>
            <Switch
              checked={prefs.showMature}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, showMature: checked }))}
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving... </>
          ) : (
            <> <Save className="h-4 w-4 mr-2" /> Save Changes </>
          )}
        </Button>
      </div>

      {saveStatus === "success" && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          Reading preferences saved!
        </div>
      )}
    </div>
  );
}

interface AppearancePrefs {
  theme: string;
  fontSize: number;
  lineHeight: number;
  reducedMotion: boolean;
  highContrast: boolean;
}

function AppearanceSettings({ prefs, setPrefs, theme, setTheme, handleSave, isSaving, saveStatus }: {
  prefs: AppearancePrefs;
  setPrefs: React.Dispatch<React.SetStateAction<AppearancePrefs>>;
  theme: string;
  setTheme: (t: string) => void;
  handleSave: () => void;
  isSaving: boolean;
  saveStatus: string;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => { setPrefs(p => ({ ...p, theme: t.value })); setTheme(t.value); }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
                  prefs.theme === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <t.icon className="h-8 w-8" />
                <div className="font-medium">{t.label}</div>
                <div className="text-sm text-muted-foreground text-center">{t.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>Adjust text size across the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[prefs.fontSize]}
            onValueChange={([v]) => setPrefs(p => ({ ...p, fontSize: v }))}
            min={80}
            max={150}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Small (80%)</span>
            <span className="font-medium">{prefs.fontSize}%</span>
            <span>Large (150%)</span>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">Preview Text</p>
            <p className="text-sm text-muted-foreground" style={{ fontSize: `${prefs.fontSize}%` }}>
              This is how text will appear with the current font size setting.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Height</CardTitle>
          <CardDescription>Adjust spacing between lines for readability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[prefs.lineHeight]}
            onValueChange={([v]) => setPrefs(p => ({ ...p, lineHeight: v }))}
            min={120}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Compact (120%)</span>
            <span className="font-medium">{prefs.lineHeight}%</span>
            <span>Relaxed (200%)</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>Options for improved accessibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reduce Motion</p>
              <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
            </div>
            <Switch
              checked={prefs.reducedMotion}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, reducedMotion: checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-muted-foreground">Increase color contrast for readability</p>
            </div>
            <Switch
              checked={prefs.highContrast}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, highContrast: checked }))}
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving... </>
          ) : (
            <> <Save className="h-4 w-4 mr-2" /> Save Changes </>
          )}
        </Button>
      </div>

      {saveStatus === "success" && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          Appearance settings saved!
        </div>
      )}
    </div>
  );
}

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  newChapter: boolean;
  libraryUpdates: boolean;
  recommendations: boolean;
  social: boolean;
  marketing: boolean;
}

function NotificationSettings({ prefs, setPrefs, handleSave, isSaving, saveStatus }: {
  prefs: NotificationPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<NotificationPrefs>>;
  handleSave: () => void;
  isSaving: boolean;
  saveStatus: string;
}) {
  const notificationOptions = [
    { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
    { key: "push", label: "Push Notifications", description: "Receive browser push notifications" },
    { key: "newChapter", label: "New Chapters", description: "Notify when new chapters are released" },
    { key: "libraryUpdates", label: "Library Updates", description: "Updates to your library manga" },
    { key: "recommendations", label: "Recommendations", description: "Personalized manga recommendations" },
    { key: "social", label: "Social Activity", description: "Follows, comments, and mentions" },
    { key: "marketing", label: "Marketing", description: "News, updates, and promotions" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>How you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationOptions.slice(0, 2).map((opt) => (
            <label key={opt.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
              <Switch
                checked={prefs[opt.key as keyof typeof prefs]}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, [opt.key]: checked }))}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>What you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationOptions.slice(2).map((opt) => (
            <label key={opt.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
              <Switch
                checked={prefs[opt.key as keyof typeof prefs]}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, [opt.key]: checked }))}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving... </>
          ) : (
            <> <Save className="h-4 w-4 mr-2" /> Save Changes </>
          )}
        </Button>
      </div>

      {saveStatus === "success" && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          Notification settings saved!
        </div>
      )}
    </div>
  );
}

interface PrivacyPrefs {
  profileVisibility: string;
  libraryVisibility: string;
  historyVisibility: string;
  activityVisibility: string;
  showOnlineStatus: boolean;
  allowRecommendations: boolean;
}

function PrivacySettings({ prefs, setPrefs, handleSave, isSaving, saveStatus }: {
  prefs: PrivacyPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<PrivacyPrefs>>;
  handleSave: () => void;
  isSaving: boolean;
  saveStatus: string;
}) {
  const visibilityOptions = [
    { value: "public", label: "Public", description: "Everyone can see this" },
    { value: "friends", label: "Friends Only", description: "Only people you follow" },
    { value: "private", label: "Private", description: "Only you can see this" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>Who can view your profile and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Profile Visibility</Label>
            <Select
              value={prefs.profileVisibility}
              onValueChange={(value) => setPrefs(p => ({ ...p, profileVisibility: value }))}
            >
              <SelectTrigger className="w-full max-w-xs mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Library Visibility</Label>
            <Select
              value={prefs.libraryVisibility}
              onValueChange={(value) => setPrefs(p => ({ ...p, libraryVisibility: value }))}
            >
              <SelectTrigger className="w-full max-w-xs mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reading History Visibility</Label>
            <Select
              value={prefs.historyVisibility}
              onValueChange={(value) => setPrefs(p => ({ ...p, historyVisibility: value }))}
            >
              <SelectTrigger className="w-full max-w-xs mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activity Visibility</Label>
            <Select
              value={prefs.activityVisibility}
              onValueChange={(value) => setPrefs(p => ({ ...p, activityVisibility: value }))}
            >
              <SelectTrigger className="w-full max-w-xs mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Privacy</CardTitle>
          <CardDescription>More privacy controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div>
              <p className="font-medium">Show Online Status</p>
              <p className="text-sm text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch
              checked={prefs.showOnlineStatus}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, showOnlineStatus: checked }))}
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div>
              <p className="font-medium">Allow Personalized Recommendations</p>
              <p className="text-sm text-muted-foreground">Use your reading data for better suggestions</p>
            </div>
            <Switch
              checked={prefs.allowRecommendations}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, allowRecommendations: checked }))}
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving... </>
          ) : (
            <> <Save className="h-4 w-4 mr-2" /> Save Changes </>
          )}
        </Button>
      </div>

      {saveStatus === "success" && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          Privacy settings saved!
        </div>
      )}
    </div>
  );
}

function DataSettings({ security, setSecurity, handleSave, isSaving, saveStatus }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={security.currentPassword}
              onChange={(e) => setSecurity((s: typeof security) => ({ ...s, currentPassword: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={security.newPassword}
              onChange={(e) => setSecurity((s: typeof security) => ({ ...s, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={security.confirmPassword}
              onChange={(e) => setSecurity((s: typeof security) => ({ ...s, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={() => handleSave()} disabled={isSaving || !security.newPassword || security.newPassword !== security.confirmPassword}>
            {isSaving ? (
              <> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving... </>
            ) : (
              <> <Key className="h-4 w-4 mr-2" /> Update Password </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => {}}>Delete Account</Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">Download all your data in JSON format</p>
            </div>
            <Button variant="outline" onClick={() => {}}><Download className="h-4 w-4 mr-2" />Export Data</Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium">Clear Reading History</p>
              <p className="text-sm text-muted-foreground">Remove all reading history entries</p>
            </div>
            <Button variant="outline" onClick={() => {}}><Trash2 className="h-4 w-4 mr-2" />Clear History</Button>
          </div>
        </CardContent>
      </Card>

      {saveStatus === "success" && (
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          Password updated successfully!
        </div>
      )}
    </div>
  );
}
