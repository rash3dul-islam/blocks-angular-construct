// ─── Login Page ────────────────────────────────────────────────────────────────
// Mirrors: react_Constract Signin + SigninEmail + SsoSignin (grant types from GetLoginOptions)

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff, lucideLoader } from '@ng-icons/lucide';
import { AuthService } from '../../services/auth.service';
import { AuthLoginOptionsService } from '../../services/auth-login-options.service';
import { SsoService } from '../../services/sso.service';
import { GRANT_TYPES } from '../../types/login-options.types';
import { ssoProviderImageSrc } from '@constant/social-auth.constant';
import { strictEmailValidator } from '../../validators/strict-email.validator';

const DEMO_BANNER_HOSTS: readonly string[] = [
  'localhost',
  'construct.seliseblocks.com',
  'stg-construct.seliseblocks.com',
  'dev-construct.seliseblocks.com',
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgIconComponent],
  viewProviders: [provideIcons({ lucideEye, lucideEyeOff, lucideLoader })],
  template: `
    <div class="flex w-full flex-col gap-6">
      <div class="mb-2 h-14 w-32 shrink-0">
        <img
          src="/images/construct_logo_dark.svg"
          alt="BLOCKS construct"
          class="block h-full w-full object-contain object-left dark:hidden"
        />
        <img
          src="/images/construct_logo_light.svg"
          alt="BLOCKS construct"
          class="hidden h-full w-full object-contain object-left dark:block"
        />
      </div>

      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Log in</h1>
        @if (showSignupLink()) {
          <div class="mt-1 flex flex-wrap items-center gap-1 text-sm">
            <span class="font-normal text-muted-foreground">Don't have an account?</span>
            <a
              routerLink="/signup"
              class="font-bold text-primary hover:text-primary/90 hover:underline"
            >
              Sign up
            </a>
          </div>
        }
      </div>

      @if (showDemoBanner()) {
        <div
          class="w-full rounded-lg border border-construct-success-border bg-construct-success-bg p-4 text-xs text-construct-success-fg"
        >
          <p class="font-normal leading-relaxed">
            Log in to explore the complete Demo and Documentation. Use the credentials:
            <span class="font-semibold">demo.construct&#64;seliseblocks.com</span>
            with password:
            <span class="font-semibold">H%FE*FYi5oTQ!VyT6TkEy</span>
          </p>
        </div>
      }

      <div
        *ngIf="errorMessage()"
        class="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        {{ errorMessage() }}
      </div>

      @if (!passwordGrantAllowed() && !socialGrantAllowed()) {
        <p class="text-sm text-muted-foreground">
          No sign-in methods are enabled for this project. Check IdP login options configuration.
        </p>
      }

      @if (passwordGrantAllowed()) {
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex w-full flex-col gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-foreground" for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="Enter your email"
              autocomplete="email"
              class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
              [class.border-destructive]="emailInvalid"
            />
            <p *ngIf="emailInvalid" class="text-xs text-destructive">
              Please enter a valid email address.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-foreground" for="password">Password</label>
            <div class="relative">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                class="h-11 w-full rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                [class.border-destructive]="passwordInvalid"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                <ng-icon [name]="showPassword() ? 'lucideEyeOff' : 'lucideEye'" class="h-4 w-4" />
              </button>
            </div>
            <p *ngIf="passwordInvalid" class="text-xs text-destructive">Password is required.</p>
          </div>

          <div class="flex justify-end">
            <a
              routerLink="/forgot-password"
              class="text-sm text-primary hover:text-primary/90 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            [disabled]="isLoading() || loginForm.invalid"
            class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (isLoading()) {
              <ng-icon name="lucideLoader" class="h-4 w-4 animate-spin" />
            }
            {{ isLoading() ? 'Logging in...' : 'Log in' }}
          </button>
        </form>
      }

      @if (passwordGrantAllowed() && socialGrantAllowed()) {
        <div class="relative flex items-center gap-3 py-1">
          <div class="h-px flex-1 bg-border"></div>
          <span class="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >Or</span
          >
          <div class="h-px flex-1 bg-border"></div>
        </div>
      }

      @if (socialGrantAllowed()) {
        <div class="flex w-full flex-col gap-3">
          @for (sso of ssoProviders(); track sso.provider + sso.audience) {
            <button
              type="button"
              [disabled]="ssoBusy()"
              class="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              (click)="onSsoClick(sso.provider, sso.audience)"
            >
              @if (ssoBusy()) {
                <ng-icon name="lucideLoader" class="h-4 w-4 animate-spin" />
              } @else {
                <img
                  [src]="ssoIconSrc(sso.provider)"
                  width="20"
                  height="20"
                  class="shrink-0"
                  [alt]="formatProviderLabel(sso.provider) + ' logo'"
                />
              }
              Log in with {{ formatProviderLabel(sso.provider) }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _authService = inject(AuthService);
  private readonly _loginOptions = inject(AuthLoginOptionsService);
  private readonly _sso = inject(SsoService);
  private readonly _router = inject(Router);

  readonly isLoading = signal(false);
  readonly ssoBusy = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');
  readonly signupSettings = signal<{
    isEmailPasswordSignUpEnabled?: boolean;
    isSSoSignUpEnabled?: boolean;
  } | null>(null);

  readonly showDemoBanner = signal(
    typeof window !== 'undefined' && DEMO_BANNER_HOSTS.includes(window.location.hostname)
  );

  readonly loginForm = this._fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
    password: ['', [Validators.required]],
  });

  readonly passwordGrantAllowed = computed(() => {
    const types = this._loginOptions.options()?.allowedGrantTypes ?? [];
    return types.includes(GRANT_TYPES.password);
  });

  readonly socialGrantAllowed = computed(() => {
    const opt = this._loginOptions.options();
    if (!opt) return false;
    const types = opt.allowedGrantTypes ?? [];
    return types.includes(GRANT_TYPES.social) && (opt.ssoInfo?.length ?? 0) > 0;
  });

  readonly ssoProviders = computed(() => this._loginOptions.options()?.ssoInfo ?? []);

  readonly showSignupLink = computed(() => {
    const s = this.signupSettings();
    if (!s) return true;
    return !!(s.isEmailPasswordSignUpEnabled || s.isSSoSignUpEnabled);
  });

  get emailInvalid(): boolean {
    const ctrl = this.loginForm.get('email');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get passwordInvalid(): boolean {
    const ctrl = this.loginForm.get('password');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  ngOnInit(): void {
    this._authService.getSignupSettings().subscribe({
      next: (s) => this.signupSettings.set(s),
      error: () => this.signupSettings.set(null),
    });
  }

  formatProviderLabel(provider: string): string {
    if (!provider) return 'SSO';
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
  }

  ssoIconSrc(provider: string): string {
    return ssoProviderImageSrc(provider);
  }

  onSsoClick(provider: string, audience: string): void {
    if (!provider || !audience) {
      this.errorMessage.set('SSO provider configuration is incomplete.');
      return;
    }
    this.errorMessage.set('');
    this.ssoBusy.set(true);
    this._sso
      .getSocialLoginEndpoint({
        provider,
        audience,
        sendAsResponse: true,
      })
      .subscribe({
        next: (res) => {
          this.ssoBusy.set(false);
          if (res.error) {
            this.errorMessage.set(String(res.error));
            return;
          }
          if (res.requiresMfa && res.mfaToken != null) {
            this.errorMessage.set(
              'Additional sign-in verification is required. Add an Angular route for MFA (React uses /verify-mfa) to complete this flow.'
            );
            return;
          }
          if (res.providerUrl) {
            window.location.href = res.providerUrl;
          }
        },
        error: () => {
          this.ssoBusy.set(false);
          this.errorMessage.set('Could not start social sign-in.');
        },
      });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this._authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this._router.navigate(['/dashboard']);
      },
      error: (err: {
        error?: { error_description?: string; message?: string };
        message?: string;
      }) => {
        const msg =
          err?.error?.error_description ??
          err?.error?.message ??
          err?.message ??
          'Invalid email or password.';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      },
    });
  }
}
