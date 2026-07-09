import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MangaCard } from "@/components/manga/manga-card";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, BookOpen, Search, Heart, Clock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium Manga Reading Platform",
  description: "Read manga online with a premium, cinematic experience. Advanced search, immersive reader, library management, and personalized recommendations.",
};

const features = [
  {
    icon: Sparkles,
    title: "Cinematic Reading",
    description: "Immersive vertical and horizontal reading modes with smooth page transitions",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Edge-optimized image delivery and instant page loads worldwide",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your reading data stays private. No tracking, no ads, ever",
  },
  {
    icon: BookOpen,
    title: "Massive Library",
    description: "Access millions of chapters across manga, manhwa, manhua, and webtoons",
  },
  {
    icon: Search,
    title: "Advanced Search",
    description: "Filter by genre, demographic, status, rating, and more with instant results",
  },
  {
    icon: Heart,
    title: "Smart Library",
    description: "Track progress, get notifications, and receive personalized recommendations",
  },
];

const stats = [
  { value: "500K+", label: "Manga Titles" },
  { value: "50M+", label: "Chapters" },
  { value: "2M+", label: "Active Readers" },
  { value: "99.9%", label: "Uptime" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="container-padded relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
                <Sparkles className="h-4 w-4" />
                <span>New: AI-Powered Recommendations & Vertical Reading Mode</span>
              </div>
              <h1 className="text-display-xl font-display font-bold text-foreground mb-6 animate-slide-up">
                Your Manga,
                <br />
                <span className="gradient-text">Elevated</span>
              </h1>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
                Experience manga like never before. Cinematic UI, lightning-fast performance,
                and features designed for serious readers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <Link href="/search">
                  <Button size="xl" className="group w-full sm:w-auto">
                    Start Reading
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/library">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    Explore Library
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce-slow">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50 backdrop-blur border border-border">
              <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground" />
            </div>
          </div>
        </section>

        <section className="section bg-gradient-to-b from-card/50 to-transparent">
          <div className="container-padded">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-display-md font-display font-bold text-foreground gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-body-md text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container-padded">
            <SectionTitle
              title="Why Choose MangaHub?"
              subtitle="Built by readers, for readers. Every feature designed to enhance your manga experience."
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group card p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-body-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-muted/30">
          <div className="container-padded">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-display-sm font-display font-bold text-foreground mb-6">
                Ready to Start Reading?
              </h2>
              <p className="text-body-lg text-muted-foreground mb-8">
                Join millions of readers enjoying the best manga experience.
                Free to start, no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="xl" className="w-full sm:w-auto group">
                    Create Free Account
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    Browse Without Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}