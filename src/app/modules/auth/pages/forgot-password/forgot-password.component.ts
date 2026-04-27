// ─── Forgot Password Page ──────────────────────────────────────────────────────
// Mirrors: src/modules/auth/pages/forgot-password/ in React project

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLoader, lucideArrowLeft } from '@ng-icons/lucide';
import { AuthService } from '../../services/auth.service';
import { idpErrorMessage } from '../../utils/idp-error.util';
import { strictEmailValidator } from '../../validators/strict-email.validator';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgIconComponent],
  viewProviders: [provideIcons({ lucideLoader, lucideArrowLeft })],
  template: `
    <div class="flex w-full flex-col gap-6">
      <a
        routerLink="/login"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ng-icon name="lucideArrowLeft" class="w-4 h-4" /> Back to sign in
      </a>

      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Forgot password?</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div
        *ngIf="errorMessage()"
        class="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        {{ errorMessage() }}
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex w-full flex-col gap-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-foreground" for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="Enter your email"
            autocomplete="email"
            class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
            [class.border-destructive]="fieldInvalid"
          />
          <p *ngIf="fieldInvalid" class="text-destructive text-xs">Enter a valid email address.</p>
        </div>

        <button
          type="submit"
          [disabled]="isLoading() || form.invalid"
          class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ng-icon *ngIf="isLoading()" name="lucideLoader" class="w-4 h-4 animate-spin" />
          {{ isLoading() ? 'Sending...' : 'Send reset link' }}
        </button>
      </form>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this._fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
  });

  get fieldInvalid(): boolean {
    const c = this.form.get('email');
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const email = this.form.value.email!;
    this._authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res?.isSuccess) {
          this._router.navigate(['/sent-email'], { queryParams: { email } });
          return;
        }
        this.errorMessage.set('Could not send reset email. Please try again.');
      },
      error: (err) => {
        this.errorMessage.set(idpErrorMessage(err, 'Failed to send email.'));
        this.isLoading.set(false);
      },
    });
  }
}
