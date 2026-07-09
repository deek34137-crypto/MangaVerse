import Link from "next/link";
import { BookOpen, Github, Twitter, MessageCircle, Heart, Sparkles, Zap, Shield } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { label: "Browse Manga", href: "/search" },
      { label: "Popular", href: "/search?sort=popularity" },
      { label: "Latest Updates", href: "/search?sort=updated" },
      { label: "Completed Series", href: "/search?status=completed" },
      { label: "Genres", href: "/search?view=genres" },
    ],
    community: [
      { label: "Discord", href: "https://discord.gg/mangahub", external: true },
      { label: "Twitter", href: "https://twitter.com/mangahub", external: true },
      { label: "GitHub", href: "https://github.com/mangahub", external: true },
      { label: "Reddit", href: "https://reddit.com/r/mangahub", external: true },
    ],
    support: [
      { label: "Help Center", href: "/help" },
      { label: "Report Issue", href: "/report" },
      { label: "Request Manga", href: "/request" },
      { label: "API Docs", href: "/api-docs" },
      { label: "Status", href: "/status" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "DMCA", href: "/dmca" },
      { label: "Guidelines", href: "/guidelines" },
    ],
  };

  const features = [
    { icon: Sparkles, title: "Cinematic UI", description: "Beautiful, modern interface designed for reading" },
    { icon: Zap, title: "Lightning Fast", description: "Optimized performance with edge caching" },
    { icon: Shield, title: "Privacy First", description: "Your data stays yours, always" },
    { icon: Heart, title: "Made with Love", description: "Built by manga fans, for manga fans" },
  ];

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/mangahub", label: "Twitter" },
    { icon: Github, href: "https://github.com/mangahub", label: "GitHub" },
    { icon: MessageCircle, href: "https://discord.gg/mangahub", label: "Discord" },
  ];

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container-padded py-16 lg:py-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2" aria-label="MangaHub Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-2xl text-foreground">MangaHub</span>
            </Link>
            <p className="text-muted-foreground text-base max-w-xs">
              The premium manga reading platform with a cinematic experience.
              Discover, read, and organize your favorite series.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <nav>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="font-semibold text-foreground mb-4">Community</h3>
            <ul className="space-y-3">
              {navigation.community.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {navigation.support.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{title}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} MangaHub. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-2">
            <span>Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion</span>
          </p>
        </div>
      </div>
    </footer>
  );
}