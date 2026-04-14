export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

export function calculateResponseRate(responded: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((responded / total) * 100);
}

export function getRatingDistribution(ratings: number[]): number[] {
  const distribution = [0, 0, 0, 0, 0];
  for (const rating of ratings) {
    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1]++;
    }
  }
  return distribution;
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return "#22c55e";
  if (rating >= 3) return "#eab308";
  return "#ef4444";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "draft":
      return "bg-zinc-100 text-zinc-600";
    case "closed":
      return "bg-slate-100 text-slate-600";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}
