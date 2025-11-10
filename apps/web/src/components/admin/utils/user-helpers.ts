/**
 * Helper function to get user initials from name and email
 */
export function getUserInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || email[0]?.toUpperCase() || "?";
  }
  return email[0]?.toUpperCase() || "?";
}

/**
 * Helper function to format a date as a relative time string
 * Returns "Today", "Yesterday", "X days ago", or a formatted date
 */
export function formatUserDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
