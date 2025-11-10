/**
 * Shared password validation rules and configuration
 * Used by both backend and frontend for consistency
 */

export interface PasswordRule {
  id: string;
  label: string;
  validate: (password: string) => boolean;
  errorMessage: string;
}

/**
 * Common weak passwords to reject
 */
export const COMMON_PASSWORDS = [
  "password",
  "password123",
  "12345678",
  "qwerty123",
  "admin123",
  "letmein",
  "welcome123",
  "monkey123",
  "123456789",
  "password1",
  "abc12345",
  "password12",
  "welcome",
  "admin",
  "root",
] as const;

/**
 * Sequential character patterns to reject
 */
const SEQUENTIAL_PATTERNS =
  /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;

/**
 * Password validation rules
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "minLength",
    label: "At least 8 characters",
    validate: (password) => password.length >= 8,
    errorMessage: "Password must be at least 8 characters",
  },
  {
    id: "maxLength",
    label: "Less than 128 characters",
    validate: (password) => password.length <= 128,
    errorMessage: "Password must be less than 128 characters",
  },
  {
    id: "hasLowercase",
    label: "Contains lowercase letter",
    validate: (password) => /[a-z]/.test(password),
    errorMessage: "Password must contain at least one lowercase letter",
  },
  {
    id: "hasUppercase",
    label: "Contains uppercase letter",
    validate: (password) => /[A-Z]/.test(password),
    errorMessage: "Password must contain at least one uppercase letter",
  },
  {
    id: "hasNumber",
    label: "Contains number",
    validate: (password) => /[0-9]/.test(password),
    errorMessage: "Password must contain at least one number",
  },
  {
    id: "hasSpecialChar",
    label: "Contains special character",
    validate: (password) => /[^a-zA-Z0-9]/.test(password),
    errorMessage: "Password must contain at least one special character",
  },
  {
    id: "noRepeatedChars",
    label: "No repeated characters",
    validate: (password) => !/(.)\1{2,}/.test(password),
    errorMessage: "Password must not contain repeated characters",
  },
  {
    id: "noSequentialChars",
    label: "No sequential characters",
    validate: (password) => !SEQUENTIAL_PATTERNS.test(password),
    errorMessage: "Password must not contain sequential characters",
  },
  {
    id: "notCommon",
    label: "Not a common password",
    validate: (password) => {
      const passwordLower = password.toLowerCase();
      return !COMMON_PASSWORDS.some((common) => passwordLower === common);
    },
    errorMessage:
      "Password is too common. Please choose a more unique password",
  },
];

/**
 * Validate password against all rules
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  passedRules: string[];
  failedRules: string[];
} {
  const errors: string[] = [];
  const passedRules: string[] = [];
  const failedRules: string[] = [];

  for (const rule of PASSWORD_RULES) {
    if (rule.validate(password)) {
      passedRules.push(rule.id);
    } else {
      failedRules.push(rule.id);
      errors.push(rule.errorMessage);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    passedRules,
    failedRules,
  };
}

/**
 * Get password requirements checklist
 */
export function getPasswordRequirements(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.validate(password),
  }));
}
