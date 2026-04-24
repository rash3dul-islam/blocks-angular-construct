// ─── Finance Routes ────────────────────────────────────────────────────────────
import { Routes } from '@angular/router';
import { roleGuard } from '@app/state/store/auth/role.guard';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    // data: { roles: ['admin'] },
    loadComponent: () =>
      import('./pages/finance/finance.component').then(m => m.FinanceComponent),
  },
];
