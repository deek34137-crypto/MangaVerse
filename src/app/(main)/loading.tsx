export default function MainLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="animate-pulse">
        <div className="h-16 bg-muted/50" />
        <div className="container-padded py-8 space-y-6">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted rounded-lg" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}