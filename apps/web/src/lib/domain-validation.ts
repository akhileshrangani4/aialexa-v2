import { parse, getPublicSuffix } from "tldts";

/**
 * Safe educational TLDs that are allowed (specific to educational institutions).
 * These bypass the broad TLD check because they're restricted to academia.
 *
 * Stored in canonical form (without leading dot). Input is normalized before checking.
 */
export const SAFE_EDUCATIONAL_TLDS = [
  "edu", // US education
  "ac.uk", // UK academia
  "ac.in", // India academia
  "edu.in", // India education
  "ac.nz", // New Zealand academia
  "ac.za", // South Africa academia
  "ac.jp", // Japan academia
  "ac.kr", // South Korea academia
  "ac.cn", // China academia
  "ac.il", // Israel academia
  "edu.au", // Australia education
  "edu.cn", // China education
  "edu.br", // Brazil education
  "edu.mx", // Mexico education
  "edu.ar", // Argentina education
  "edu.co", // Colombia education
  "edu.eg", // Egypt education
  "edu.pk", // Pakistan education
  "edu.sg", // Singapore education
  "edu.my", // Malaysia education
  "edu.ph", // Philippines education
];

/**
 * Normalizes a domain by removing leading dot if present.
 * Used to check against SAFE_EDUCATIONAL_TLDS in canonical form.
 */
function normalizeDomain(domain: string): string {
  return domain.startsWith(".") ? domain.slice(1) : domain;
}

export type DomainValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates a domain for the email allowlist using the Public Suffix List (PSL).
 * Uses Mozilla's PSL via the `tldts` library for accurate TLD detection.
 *
 * ## Input Format
 * Accepts domains with or without a leading dot:
 * - `".edu"` or `"edu"` - TLD pattern
 * - `"stanford.edu"` - Specific domain
 * - `"uni-bonn.de"` - Specific domain
 *
 * ## Behavior
 * - **Educational TLDs** (.edu, .ac.uk, etc.) → Always allowed (safe patterns)
 * - **Specific domains** (stanford.edu, uni-bonn.de) → Allowed
 * - **Broad TLDs** (.de, .com, .fr) → Blocked (would allow any email)
 *
 * ## Examples
 * ```typescript
 * validateDomainForAllowlist(".edu")        // { valid: true }
 * validateDomainForAllowlist("stanford.edu") // { valid: true }
 * validateDomainForAllowlist("uni-bonn.de")  // { valid: true }
 * validateDomainForAllowlist(".de")          // { valid: false, reason: "..." }
 * validateDomainForAllowlist("de")           // { valid: false, reason: "..." }
 * validateDomainForAllowlist(".com")         // { valid: false, reason: "..." }
 * ```
 *
 * @param domain - The domain to validate (with or without leading dot)
 * @returns `{ valid: true }` or `{ valid: false, reason: string }`
 */
export function validateDomainForAllowlist(
  domain: string,
): DomainValidationResult {
  const trimmedDomain = domain.trim().toLowerCase();

  // Domain format validation regex:
  // - ^\.?              → Optional leading dot (for TLD patterns like ".edu")
  // - [a-zA-Z0-9]       → Label must start with alphanumeric
  // - ([a-zA-Z0-9-]*[a-zA-Z0-9])? → Middle can have hyphens, but must end with alphanumeric
  // - (\.[a-zA-Z0-9]...)* → Repeat for multi-level domains (e.g., "ac.uk", "uni-bonn.de")
  //
  // Valid: ".edu", "edu", "stanford.edu", "uni-bonn.de", ".ac.uk"
  // Invalid: "-invalid.com", "invalid-.com", "..", "domain..com"
  const domainRegex =
    /^\.?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(trimmedDomain)) {
    return { valid: false, reason: "Invalid domain format" };
  }

  // Normalize domain (strip leading dot) for consistent checking
  const normalizedDomain = normalizeDomain(trimmedDomain);

  // Safe educational TLDs are always allowed
  if (SAFE_EDUCATIONAL_TLDS.includes(normalizedDomain)) {
    return { valid: true };
  }

  // Use tldts to parse the domain using the Public Suffix List

  // We use both parse() and getPublicSuffix() for different purposes:
  // - getPublicSuffix(): Extracts the public suffix (e.g., "de", "co.uk") to detect
  //   if the input is ONLY a public suffix (too broad for an allowlist)
  // - parse(): Returns the full registrable domain. If parsed.domain is null,
  //   the input is invalid (e.g., malformed or unrecognized)
  const parsed = parse(normalizedDomain);
  const publicSuffix = getPublicSuffix(normalizedDomain);

  // Check if what they entered is ONLY a public suffix (too broad)
  if (publicSuffix && normalizedDomain === publicSuffix) {
    return {
      valid: false,
      reason: `"${trimmedDomain}" is a broad TLD that would allow ALL emails from this domain type. Please add specific domains instead (e.g., "uni-bonn.de" not "${trimmedDomain}")`,
    };
  }

  // If parsed domain is null or invalid, reject it
  if (!parsed.domain) {
    return { valid: false, reason: "Invalid domain name" };
  }

  return { valid: true };
}
