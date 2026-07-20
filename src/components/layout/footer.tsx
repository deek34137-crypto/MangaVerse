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
    <footer className="border-t border-ink-700 bg-background/50">
      <div className="container-padded py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2" aria-label="MangaHub Home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">MangaHub</span>
            </Link>
            <p className="text-ink-400 text-xs max-w-xs leading-relaxed">
              The premium manga reading platform with a cinematic experience.
              Discover, read, and organize your favorite series.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-400 hover:text-primary transition-colors p-1"
                  aria-label={label}
                >
                  <Icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          <nav>
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3">Product</h3>
            <ul className="space-y-2">
              {navigation.product.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs text-ink-400 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3">Community</h3>
            <ul className="space-y-2">
              {navigation.community.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-xs text-ink-400 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3">Support</h3>
            <ul className="space-y-2">
              {navigation.support.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs text-ink-400 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-2">
              {navigation.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs text-ink-400 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-700/60">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 border border-ink-700/60 text-ink-300">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{title}</h4>
                  <p className="text-[11px] text-ink-400 mt-0.5 leading-snug">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-[11px] text-ink-400 border-t border-ink-700/60 pt-6">
          <p>© {currentYear} MangaHub. All rights reserved.</p>
          <p className="text-ink-400/60">
            Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}