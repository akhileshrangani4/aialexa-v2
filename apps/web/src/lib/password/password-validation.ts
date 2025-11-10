import { validatePassword } from "./password-rules";
import * as bcrypt from "bcryptjs";

/**
 * Re-export for backward compatibility
 * @deprecated Use validatePassword from password-rules instead
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const result = validatePassword(password);
  return {
    isValid: result.isValid,
    errors: result.errors,
  };
}

/**
 * Checks if new password is different from current password
 */
export async function isPasswordDifferent(
  newPassword: string,
  currentHashedPassword: string,
  compareFn: (plain: string, hash: string) => Promise<boolean> = bcrypt.compare,
): Promise<boolean> {
  // If passwords are the same, they'll hash to the same value
  // But we can't compare hashes directly, so we compare the new password against the old hash
  const isSame = await compareFn(newPassword, currentHashedPassword);
  return !isSame;
}
