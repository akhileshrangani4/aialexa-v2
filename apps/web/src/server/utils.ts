/**
 * Escapes special SQL LIKE pattern characters (% and _) for literal matching.
 * This prevents users from using wildcards in search queries.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
