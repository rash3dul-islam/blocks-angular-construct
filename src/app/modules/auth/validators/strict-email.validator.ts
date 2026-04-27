import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Stricter than Angular's built-in `Validators.email`.
 * React uses Zod `.email()`, which rejects addresses like `abc@email` (no TLD).
 */
export function strictEmailValidator(): ValidatorFn {
  // Simple, UX-friendly rule: local@domain.tld (at least one dot in domain).
  // Avoid being fully RFC 5322-complete; we only need parity with the React UI validation.
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '').trim();
    if (!v) return null; // `required` is handled separately
    return re.test(v) ? null : { strictEmail: true };
  };
}

