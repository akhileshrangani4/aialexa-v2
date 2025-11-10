import { GRADIENT_STOPS } from "./constants";

/**
 * Builds a CSS linear gradient string from gradient stops
 * @returns CSS linear-gradient string
 */
export function buildGradient(): string {
  const stops = GRADIENT_STOPS.map(
    ({ position, opacity }) => `rgba(255, 255, 255, ${opacity}) ${position}%`,
  ).join(", ");

  return `linear-gradient(to bottom, ${stops})`;
}
