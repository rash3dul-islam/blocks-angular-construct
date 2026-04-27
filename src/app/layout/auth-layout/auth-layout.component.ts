// ─── Auth Layout ───────────────────────────────────────────────────────────────
// Mirrors: react_Constract/src/layout/auth-layout/auth-layout.tsx
// — Loads `GetLoginOptions` before showing routes; surfaces project-key / 5xx errors like React.

import { DOCUMENT } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideMoon, lucideSun, lucideAlertTriangle } from '@ng-icons/lucide';
import { AuthLoginOptionsService } from '../../modules/auth/services/auth-login-options.service';

const THEME_STORAGE_KEY = 'theme';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, NgIconComponent],
  viewProviders: [provideIcons({ lucideMoon, lucideSun, lucideChevronDown, lucideAlertTriangle })],
  template: `
    <div class="flex h-screen w-full flex-col overflow-hidden">
      <div class="relative flex min-h-screen w-full flex-1 overflow-hidden">
        <div class="relative hidden w-[36%] shrink-0 bg-auth-panel md:block">
          <img
            [src]="authBgSrc()"
            alt=""
            class="h-full w-full object-cover"
            [attr.aria-hidden]="true"
          />
        </div>

        <div
          class="relative flex w-full flex-1 items-center justify-center bg-background px-6 sm:px-20 md:w-[64%] md:px-[14%] lg:px-[16%] 2xl:px-[20%]"
        >
          <div class="absolute right-4 top-2 z-10 flex flex-row gap-1">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
              (click)="toggleTheme()"
              [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (isDark()) {
                <ng-icon name="lucideSun" class="h-5 w-5" />
              } @else {
                <ng-icon name="lucideMoon" class="h-5 w-5" />
              }
            </button>

            <div class="relative" data-lang-root>
              <button
                type="button"
                class="flex h-[34px] cursor-pointer items-center gap-1 rounded px-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-muted"
                (click)="langOpen.update((v) => !v)"
              >
                <span>English</span>
                <ng-icon name="lucideChevronDown" class="h-4 w-4" />
              </button>
              @if (langOpen()) {
                <div
                  class="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
                >
                  <button
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    (click)="langOpen.set(false)"
                  >
                    English
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="w-full max-w-xl">
            @if (loginPhase() === 'loading') {
              <div
                class="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground"
              >
                Loading…
              </div>
            } @else if (loginPhase() === 'project_error') {
              <div
                class="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-8 shadow-xl dark:border-red-900/40 dark:from-red-950/40 dark:to-red-950/20"
              >
                <div class="relative z-10">
                  <div class="mb-4 flex justify-center">
                    <div class="rounded-full bg-red-100 p-3 dark:bg-red-900/50">
                      <ng-icon
                        name="lucideAlertTriangle"
                        class="h-8 w-8 text-red-600 dark:text-red-400"
                      />
                    </div>
                  </div>
                  <div class="space-y-4 text-center">
                    <h2 class="text-2xl font-bold tracking-tight text-red-900 dark:text-red-200">
                      Incorrect Project Key
                    </h2>
                    <div class="space-y-3 text-red-700 dark:text-red-300/90">
                      <p class="text-base leading-relaxed">
                        It seems your project is not set up in the Blocks Cloud.
                      </p>
                      <p class="text-sm leading-relaxed">
                        Please create a project at
                        <a
                          href="https://cloud.seliseblocks.com"
                          class="font-semibold underline decoration-red-400 underline-offset-2 hover:decoration-red-600"
                          target="_blank"
                          rel="noopener noreferrer"
                          >cloud.seliseblocks.com</a
                        >, then update your environment configuration (for example
                        <code
                          class="mx-1 inline-flex items-center rounded-md border border-red-300/50 bg-red-200/60 px-2 py-1 font-mono text-xs text-red-800 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200"
                          >xBlocksKey</code
                        >
                        / API base URL) accordingly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            } @else if (loginPhase() === 'server_error') {
              <div
                class="relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-8 shadow-xl dark:border-orange-900/40 dark:from-orange-950/40 dark:to-orange-950/20"
              >
                <div class="relative z-10">
                  <div class="mb-4 flex justify-center">
                    <div class="rounded-full bg-orange-100 p-3 dark:bg-orange-900/50">
                      <ng-icon
                        name="lucideAlertTriangle"
                        class="h-8 w-8 text-orange-600 dark:text-orange-400"
                      />
                    </div>
                  </div>
                  <div class="space-y-4 text-center">
                    <h2
                      class="text-2xl font-bold tracking-tight text-orange-900 dark:text-orange-200"
                    >
                      Services Temporarily Unavailable
                    </h2>
                    <div class="space-y-3 text-orange-700 dark:text-orange-300/90">
                      <p class="text-base leading-relaxed">
                        The services are temporarily unavailable.
                      </p>
                      <p class="text-base font-semibold leading-relaxed">
                        Everything will be back to normal soon.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <router-outlet />
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  private readonly _doc = inject(DOCUMENT);
  private readonly _loginOptions = inject(AuthLoginOptionsService);

  readonly langOpen = signal(false);
  private readonly _isDark = signal(false);

  readonly isDark = this._isDark.asReadonly();
  readonly loginPhase = this._loginOptions.phase;

  readonly authBgSrc = computed(() =>
    this._isDark() ? '/images/bg_auth_dark.svg' : '/images/bg_auth_light.svg'
  );

  constructor() {
    this.applyStoredTheme();
    this._loginOptions.load();
  }

  private applyStoredTheme(): void {
    const html = this._doc.documentElement;
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    const dark = stored === 'dark';
    html.classList.toggle('dark', dark);
    this._isDark.set(dark);
  }

  toggleTheme(): void {
    const html = this._doc.documentElement;
    const next = !html.classList.contains('dark');
    html.classList.toggle('dark', next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    this._isDark.set(next);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.langOpen()) return;
    const t = ev.target as HTMLElement | null;
    if (t?.closest('[data-lang-root]')) return;
    this.langOpen.set(false);
  }
}
