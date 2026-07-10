export default function MainNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mx-auto">
          <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          This page doesn&apos;t exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/search"
            className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            Search Manga
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}