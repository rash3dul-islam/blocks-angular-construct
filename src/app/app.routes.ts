// ─── Application Routes ────────────────────────────────────────────────────────
// Mirrors: src/routes/app-routes.tsx + src/routes/auth.route.tsx in React project
// All feature modules are lazy-loaded

import { Routes } from '@angular/router';
import { authGuard } from './state/store/auth/auth.guard';
import { publicGuard } from './state/store/auth/public.guard';

export const routes: Routes = [
  // ── Redirect root (full app URL) → dashboard (requires auth, handled by next route) ──
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Protected Routes (MainLayout + AuthGuard) ──────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: 'my-files', redirectTo: 'file-manager/my-files', pathMatch: 'full' },
      { path: 'shared-files', redirectTo: 'file-manager/shared-files', pathMatch: 'full' },
      { path: 'trash', redirectTo: 'file-manager/trash', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'finance',
        loadChildren: () =>
          import('./modules/finance/finance.routes').then(m => m.FINANCE_ROUTES),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./modules/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () =>
          import('./modules/invoices/invoices.routes').then(m => m.INVOICES_ROUTES),
      },
      {
        path: 'task-manager',
        loadChildren: () =>
          import('./modules/task-manager/task-manager.routes').then(m => m.TASK_MANAGER_ROUTES),
      },
      {
        path: 'mail',
        loadChildren: () =>
          import('./modules/email/email.routes').then(m => m.EMAIL_ROUTES),
      },
      {
        path: 'chat',
        loadChildren: () =>
          import('./modules/chat/chat.routes').then(m => m.CHAT_ROUTES),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./modules/calendar/calendar.routes').then(m => m.CALENDAR_ROUTES),
      },
      {
        path: 'file-manager',
        loadChildren: () =>
          import('./modules/file-manager/file-manager.routes').then(m => m.FILE_MANAGER_ROUTES),
      },
      {
        path: 'timeline',
        loadComponent: () =>
          import('./modules/activity-log/pages/timeline/timeline.component').then(
            m => m.TimelineComponent,
          ),
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./modules/auth/pages/unauthorized/unauthorized.component').then(
            m => m.UnauthorizedComponent,
          ),
      },
      {
        path: 'activity-log',
        loadChildren: () =>
          import('./modules/activity-log/activity-log.routes').then(m => m.ACTIVITY_LOG_ROUTES),
      },
      {
        path: 'identity-management',
        loadChildren: () =>
          import('./modules/identity-management/iam.routes').then(m => m.IAM_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./modules/profile/profile.routes').then(m => m.PROFILE_ROUTES),
      },
    ],
  },

  // ── Auth Routes (public — redirect away if already logged in) ──────────────
  {
    path: '',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./modules/auth/pages/login/login.component').then(m => m.LoginComponent),
      },
      { path: 'signin', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'signup',
        loadComponent: () =>
          import('./modules/auth/pages/signup/signup.component').then(m => m.SignupComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./modules/auth/pages/forgot-password/forgot-password.component').then(
            m => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./modules/auth/pages/reset-password/reset-password.component').then(
            m => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'resetpassword',
        loadComponent: () =>
          import('./modules/auth/pages/reset-password/reset-password.component').then(
            m => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./modules/auth/pages/verify-otp/verify-otp.component').then(
            m => m.VerifyOtpComponent,
          ),
      },
      {
        path: 'account-activation',
        loadComponent: () =>
          import('./modules/auth/pages/account-activation/account-activation.component').then(
            m => m.AccountActivationComponent,
          ),
      },
      {
        path: 'activate',
        loadComponent: () =>
          import('./modules/auth/pages/account-activation/account-activation.component').then(
            m => m.AccountActivationComponent,
          ),
      },
      {
        path: 'activate-failed',
        loadComponent: () =>
          import('./modules/auth/pages/activate-failed/activate-failed.component').then(
            m => m.ActivateFailedComponent,
          ),
      },
      {
        path: 'activation-success',
        loadComponent: () =>
          import('./modules/auth/pages/activation-success/activation-success.component').then(
            m => m.ActivationSuccessComponent,
          ),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./modules/auth/pages/activation-success/activation-success.component').then(
            m => m.ActivationSuccessComponent,
          ),
      },
      {
        path: 'email-sent',
        loadComponent: () =>
          import('./modules/auth/pages/email-sent/email-sent.component').then(
            m => m.EmailSentComponent,
          ),
      },
      {
        path: 'sent-email',
        loadComponent: () =>
          import('./modules/auth/pages/email-sent/email-sent.component').then(
            m => m.EmailSentComponent,
          ),
      },
    ],
  },

  // ── Error pages ────────────────────────────────────────────────────────────
  {
    path: '404',
    loadComponent: () =>
      import('./modules/auth/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: '503',
    loadComponent: () =>
      import('./modules/auth/pages/service-unavailable/service-unavailable.component').then(
        m => m.ServiceUnavailableComponent,
      ),
  },

  // ── Wildcard → 404 ────────────────────────────────────────────────────────
  { path: '**', redirectTo: '404' },
];
