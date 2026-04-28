// ─── Users Table (IAM) ───────────────────────────────────────────────────────
// Mirrors: react_Constract/src/modules/iam/pages/users-table/users-table.tsx
// API: POST /idp/v1/Iam/GetUsers (same payload as React `getUsers`)

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucideUser,
  lucideMail,
  lucideShieldCheck,
  lucideMoreHorizontal,
  lucideCalendar,
  lucideSlidersHorizontal,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideLoaderCircle,
} from '@ng-icons/lucide';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import {
  HlmDialog,
  HlmDialogContent,
  HlmDialogHeader,
  HlmDialogFooter,
  HlmDialogTitle,
  HlmDialogDescription,
  HlmDialogTrigger,
} from '@spartan-ng/helm/dialog';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import {
  HlmSheet,
  HlmSheetContent,
  HlmSheetHeader,
  HlmSheetTitle,
  HlmSheetDescription,
} from '../../../../components/ui-kit/sheet/src';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan-ng/helm/select';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IamService } from '../../services/iam.service';
import { IamUser, CreateUserInput } from '../../../../models/iam.model';
import { AuthService } from '../../../auth/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIconComponent,
    TranslateModule,
    HlmInput,
    HlmButton,
    HlmLabel,
    BrnDialogContent,
    HlmDialog,
    HlmDialogContent,
    HlmDialogHeader,
    HlmDialogFooter,
    HlmDialogTitle,
    HlmDialogDescription,
    HlmDialogTrigger,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
    BrnSheetContent,
    HlmSheet,
    HlmSheetContent,
    HlmSheetHeader,
    HlmSheetTitle,
    HlmSheetDescription,
  ],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucidePencil,
      lucideTrash2,
      lucideUser,
      lucideMail,
      lucideShieldCheck,
      lucideMoreHorizontal,
      lucideCalendar,
      lucideSlidersHorizontal,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideLoaderCircle,
    }),
  ],
  template: `
    <div class="space-y-4 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">
            {{ 'IAM.TITLE' | translate }}
          </h1>
        </div>
        <hlm-dialog>
          <button hlmBtn hlmDialogTrigger class="inline-flex items-center gap-2">
            <ng-icon name="lucidePlus" class="h-4 w-4" />
            {{ 'IAM.ADD_USER' | translate }}
          </button>
          <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-lg">
            <hlm-dialog-header>
              <h3 hlmDialogTitle>{{ editingUser() ? 'Edit User' : 'Add New User' }}</h3>
              <p hlmDialogDescription>Fill in the user details below.</p>
            </hlm-dialog-header>
            <form [formGroup]="userForm" (ngSubmit)="onSubmit(ctx)" class="space-y-4 py-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label hlmLabel>First Name</label>
                  <input hlmInput formControlName="firstName" placeholder="Alice" class="w-full" />
                </div>
                <div class="space-y-1">
                  <label hlmLabel>Last Name</label>
                  <input hlmInput formControlName="lastName" placeholder="Johnson" class="w-full" />
                </div>
              </div>
              <div class="space-y-1">
                <label hlmLabel>Email</label>
                <input
                  hlmInput
                  type="email"
                  formControlName="email"
                  placeholder="alice@example.com"
                  class="w-full"
                />
              </div>
              <div class="space-y-1">
                <label hlmLabel>Phone Number</label>
                <input
                  hlmInput
                  formControlName="phoneNumber"
                  placeholder="+1-555-0100"
                  class="w-full"
                />
              </div>
              <div class="space-y-1">
                <label hlmLabel>Role</label>
                <hlm-select formControlName="role">
                  <hlm-select-trigger class="w-full">
                    <hlm-select-value placeholder="Select role" />
                  </hlm-select-trigger>
                  <hlm-select-content>
                    @for (role of availableRoles; track role) {
                      <hlm-select-item [value]="role">{{ role }}</hlm-select-item>
                    }
                  </hlm-select-content>
                </hlm-select>
              </div>
              <hlm-dialog-footer class="gap-2">
                <button
                  type="button"
                  hlmBtn
                  variant="outline"
                  (click)="ctx.close(); editingUser.set(null)"
                >
                  Cancel
                </button>
                <button type="submit" hlmBtn [disabled]="userForm.invalid">
                  {{ editingUser() ? 'Save Changes' : 'Create User' }}
                </button>
              </hlm-dialog-footer>
            </form>
          </hlm-dialog-content>
        </hlm-dialog>
      </div>

      @if (bannerMessage()) {
        <div
          class="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm"
        >
          {{ bannerMessage() | translate }}
        </div>
      }

      <!-- View details (React shows a right-side sheet). -->
      <hlm-sheet
        [state]="detailsOpen() ? 'open' : 'closed'"
        (stateChanged)="onDetailsStateChanged($event)"
      >
        <hlm-sheet-content *brnSheetContent="let ctx" side="right" class="w-full sm:min-w-[450px]">
          <hlm-sheet-header class="hidden">
            <h3 hlmSheetTitle></h3>
            <p hlmSheetDescription></p>
          </hlm-sheet-header>

          @if (detailsUser()) {
            <div class="flex h-full flex-col justify-between gap-6 p-6">
              <div class="flex flex-col">
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xl font-bold text-foreground shadow-sm"
                    >
                      {{ userInitials(detailsUser()!) }}
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold text-foreground">
                        {{ displayName(detailsUser()!) }}
                      </h2>
                      <div class="mt-1 flex items-center gap-2">
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [class.bg-construct-success-fg]="detailsUser()!.active"
                          [class.bg-destructive]="!detailsUser()!.active"
                        ></span>
                        <span
                          class="text-sm"
                          [class.text-construct-success-fg]="detailsUser()!.active"
                          [class.text-destructive]="!detailsUser()!.active"
                        >
                          {{ detailsUser()!.active ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="h-px w-full bg-border mb-6"></div>

                <div class="space-y-5">
                  <div class="flex items-start gap-4">
                    <div class="w-24 text-base font-thin text-muted-foreground">Email</div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <ng-icon name="lucideMail" class="h-5 w-5 text-foreground shrink-0" />
                        <div class="break-words text-base font-normal text-foreground">
                          {{ detailsUser()!.email }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="w-24 text-base font-thin text-muted-foreground">Joined On</div>
                    <div class="flex-1 text-base text-foreground">
                      {{ formatDate(detailsUser()!.createdDate ?? detailsUser()!.createdAt) }}
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="w-24 text-base font-thin text-muted-foreground">Last Login</div>
                    <div class="flex-1 text-base text-foreground">
                      {{ formatLastLogin(detailsUser()!.lastLoggedInTime) }}
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="w-24 text-base font-thin text-muted-foreground">MFA</div>
                    <div class="flex-1 text-base text-foreground">
                      {{ detailsUser()!.mfaEnabled ? 'Enabled' : 'Disabled' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex w-full flex-col gap-2">
                <button hlmBtn variant="outline" class="w-full" type="button" (click)="ctx.close()">
                  Close
                </button>
              </div>
            </div>
          }
        </hlm-sheet-content>
      </hlm-sheet>

      <!-- Toolbar (React IamTableToolbar layout) -->
      <div
        class="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm"
      >
        <div class="relative min-w-[200px] flex-1 max-w-md">
          <ng-icon
            [name]="searchMode() === 'email' ? 'lucideMail' : 'lucideUser'"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            hlmInput
            [(ngModel)]="searchDraft"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="searchChanged($event)"
            [placeholder]="searchMode() === 'email' ? 'Search by email...' : 'Search by name...'"
            class="h-9 w-full rounded-lg bg-background pl-9 pr-12 text-sm"
          />
          <button
            type="button"
            hlmBtn
            variant="ghost"
            size="sm"
            class="absolute right-1 top-1/2 h-7 -translate-y-1/2"
            (click)="toggleSearchMode()"
            aria-label="Toggle search mode"
          >
            <ng-icon
              [name]="searchMode() === 'email' ? 'lucideUser' : 'lucideMail'"
              class="h-4 w-4"
            />
          </button>
        </div>
        <button
          type="button"
          hlmBtn
          variant="outline"
          size="sm"
          class="h-9 gap-1 rounded-full border-dashed px-3 text-xs font-medium"
        >
          <span class="text-muted-foreground">+</span> Status
        </button>
        <button
          type="button"
          hlmBtn
          variant="outline"
          size="sm"
          class="h-9 gap-1 rounded-full border-dashed px-3 text-xs font-medium"
        >
          <span class="text-muted-foreground">+</span> Mfa
        </button>
        <button
          type="button"
          hlmBtn
          variant="outline"
          size="sm"
          class="h-9 gap-1 px-3 text-xs font-medium"
        >
          <ng-icon name="lucideCalendar" class="h-3.5 w-3.5" />
          Joined On
        </button>
        <button
          type="button"
          hlmBtn
          variant="outline"
          size="sm"
          class="h-9 gap-1 px-3 text-xs font-medium"
        >
          <ng-icon name="lucideCalendar" class="h-3.5 w-3.5" />
          Last Login
        </button>
        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            hlmBtn
            variant="outline"
            size="sm"
            class="h-9 gap-1.5 px-3 text-xs font-medium"
          >
            <ng-icon name="lucideSlidersHorizontal" class="h-3.5 w-3.5" />
            View
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <ng-icon name="lucideLoaderCircle" class="h-6 w-6 animate-spin" />
            <span class="text-sm">Loading users…</span>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/40">
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Name
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Email
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Mfa
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Joined On
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Last Login
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Status
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (user of displayedUsers(); track user.ItemId) {
                  <tr class="border-b border-border/80 transition-colors hover:bg-muted/30">
                    <td class="px-4 py-3">
                      <div class="flex max-w-[280px] items-center gap-2">
                        <div
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                        >
                          {{ userInitials(user) }}
                        </div>
                        <span class="truncate font-medium text-foreground">{{
                          displayName(user)
                        }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="block max-w-[260px] truncate text-foreground">{{
                        user.email
                      }}</span>
                    </td>
                    <td class="px-4 py-3 text-foreground">
                      {{ user.mfaEnabled ? 'Enabled' : 'Disabled' }}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">
                      {{ formatDate(user.createdDate ?? user.createdAt) }}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">
                      {{ formatLastLogin(user.lastLoggedInTime) }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                        [ngClass]="statusBadgeClass(user)"
                      >
                        {{ statusLabel(user) }}
                      </span>
                    </td>
                    <td class="relative px-4 py-3 text-right" data-iam-row-actions>
                      <button
                        type="button"
                        hlmBtn
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0"
                        (click)="toggleRowMenu(user.ItemId); $event.stopPropagation()"
                        aria-label="Row actions"
                        data-iam-row-actions
                      >
                        <ng-icon name="lucideMoreHorizontal" class="h-4 w-4" />
                      </button>
                      @if (openMenuUserId() === user.ItemId) {
                        <div
                          data-iam-row-actions
                          class="absolute right-2 top-full z-20 mt-1 w-40 rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
                        >
                          <button
                            type="button"
                            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                            (click)="viewDetails(user); openMenuUserId.set(null)"
                          >
                            <ng-icon name="lucideUser" class="h-4 w-4" />
                            {{ 'IAM.VIEW_DETAILS' | translate }}
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-14 text-center text-sm text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Pagination -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <hlm-select [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
            <hlm-select-trigger class="h-8 w-[4.5rem]">
              <hlm-select-value />
            </hlm-select-trigger>
            <ng-template hlmSelectPortal>
              <hlm-select-content>
                @for (n of pageSizeOptions; track n) {
                  <hlm-select-item [value]="n">{{ n }}</hlm-select-item>
                }
              </hlm-select-content>
            </ng-template>
          </hlm-select>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-muted-foreground">
            Page {{ pageIndex() + 1 }} of {{ totalPages() }}
          </span>
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0"
              [disabled]="pageIndex() === 0 || loading()"
              (click)="goFirstPage()"
              aria-label="First page"
            >
              <ng-icon name="lucideChevronsLeft" class="h-4 w-4" />
            </button>
            <button
              type="button"
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0"
              [disabled]="pageIndex() === 0 || loading()"
              (click)="goPrevPage()"
              aria-label="Previous page"
            >
              <ng-icon name="lucideChevronLeft" class="h-4 w-4" />
            </button>
            <button
              type="button"
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0"
              [disabled]="pageIndex() >= totalPages() - 1 || loading()"
              (click)="goNextPage()"
              aria-label="Next page"
            >
              <ng-icon name="lucideChevronRight" class="h-4 w-4" />
            </button>
            <button
              type="button"
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0"
              [disabled]="pageIndex() >= totalPages() - 1 || loading()"
              (click)="goLastPage()"
              aria-label="Last page"
            >
              <ng-icon name="lucideChevronsRight" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsersTableComponent implements OnInit {
  private readonly iamService = inject(IamService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  private readonly searchSubject = new Subject<string>();

  readonly users = signal<IamUser[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly editingUser = signal<IamUser | null>(null);
  readonly openMenuUserId = signal<string | null>(null);
  readonly detailsUser = signal<IamUser | null>(null);
  readonly detailsOpen = signal(false);
  readonly bannerMessage = signal('');

  searchDraft = '';
  readonly searchMode = signal<'name' | 'email'>('name');
  private readonly _filters = signal<{ name: string; email: string }>({ name: '', email: '' });
  readonly pageSizeOptions = [10, 20, 50];

  readonly availableRoles = ['Admin', 'Manager', 'Developer', 'User', 'Viewer'];

  readonly userForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    role: ['', Validators.required],
  });

  readonly totalPages = computed(() => {
    const tc = this.totalCount();
    const ps = this.pageSize();
    return Math.max(1, Math.ceil(tc / ps) || 1);
  });

  readonly displayedUsers = computed(() => this.users());

  constructor() {
    this.searchSubject
      .pipe(debounceTime(450), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((raw) => {
        const v = (raw ?? '').trim();
        const cur = this._filters();
        const next =
          this.searchMode() === 'email' ? { ...cur, email: v } : { ...cur, name: v };
        this._filters.set(next);
        this.pageIndex.set(0);
        this.loadUsers(next);
      });
  }

  ngOnInit(): void {
    this.loadUsers(this._filters());
  }

  searchChanged(value: string): void {
    this.searchSubject.next((value ?? '').trim());
  }

  toggleSearchMode(): void {
    const next = this.searchMode() === 'email' ? 'name' : 'email';
    const curFilters = this._filters();
    this.searchMode.set(next);
    // Keep the current typed value, but move it to the other field like React.
    const typed = (this.searchDraft ?? '').trim();
    const swapped =
      next === 'email'
        ? { name: '', email: typed || curFilters.email }
        : { email: '', name: typed || curFilters.name };
    this._filters.set(swapped);
    this.searchDraft = swapped[next];
    this.pageIndex.set(0);
    this.loadUsers(swapped);
  }

  loadUsers(filters: { name: string; email: string }): void {
    this.loading.set(true);
    this.openMenuUserId.set(null);
    this.iamService
      .getUsers({
        page: this.pageIndex(),
        pageSize: this.pageSize(),
        filter: { name: filters.name, email: filters.email },
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.items);
          this.totalCount.set(res.totalCount);
          this.loading.set(false);
        },
        error: () => {
          this.users.set([]);
          this.totalCount.set(0);
          this.loading.set(false);
        },
      });
  }

  onPageSizeChange(raw: unknown): void {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    this.pageSize.set(n);
    this.pageIndex.set(0);
    this.loadUsers(this._filters());
  }

  goFirstPage(): void {
    this.pageIndex.set(0);
    this.loadUsers(this._filters());
  }

  goPrevPage(): void {
    this.pageIndex.update((i) => Math.max(0, i - 1));
    this.loadUsers(this._filters());
  }

  goNextPage(): void {
    this.pageIndex.update((i) => Math.min(this.totalPages() - 1, i + 1));
    this.loadUsers(this._filters());
  }

  goLastPage(): void {
    this.pageIndex.set(this.totalPages() - 1);
    this.loadUsers(this._filters());
  }

  toggleRowMenu(id: string): void {
    this.openMenuUserId.update((cur) => (cur === id ? null : id));
  }

  displayName(user: IamUser): string {
    const n = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return n || '—';
  }

  userInitials(user: IamUser): string {
    const a = user.firstName?.trim()?.charAt(0) ?? '';
    const b = user.lastName?.trim()?.charAt(0) ?? '';
    const s = `${a}${b}`.toUpperCase();
    return s || '?';
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  formatLastLogin(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1) return '—';
    return this.formatDate(iso);
  }

  statusLabel(user: IamUser): string {
    return user.active ? 'Active' : 'Inactive';
  }

  statusBadgeClass(user: IamUser): string {
    return user.active
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300';
  }

  onSubmit(ctx: { close: () => void }): void {
    if (this.userForm.invalid) return;
    const val = this.userForm.getRawValue();
    const input: CreateUserInput = {
      firstName: val.firstName!,
      lastName: val.lastName!,
      email: val.email!,
      phoneNumber: val.phoneNumber ?? undefined,
      roles: [val.role!],
    };

    if (this.editingUser()) {
      this.iamService.updateUser(this.editingUser()!.ItemId, input).subscribe((updated) => {
        this.users.update((list) =>
          list.map((u) => (u.ItemId === updated.ItemId ? { ...u, ...updated } : u))
        );
        this.editingUser.set(null);
        this.userForm.reset();
        ctx.close();
      });
    } else {
      this.iamService.createUser(input).subscribe((newUser) => {
        this.users.update((list) => [newUser, ...list]);
        this.userForm.reset();
        ctx.close();
      });
    }
  }

  editUser(user: IamUser): void {
    this.editingUser.set(user);
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.roles[0] ?? '',
    });
  }

  deleteUser(user: IamUser): void {
    const confirmed = window.confirm(`Delete user ${this.displayName(user)}?`);
    if (!confirmed) return;
    this.iamService.deleteUser(user.ItemId).subscribe(() => {
      this.loadUsers(this._filters());
    });
  }

  viewDetails(user: IamUser): void {
    this.detailsUser.set(user);
    this.detailsOpen.set(true);
  }

  onDetailsStateChanged(state: 'open' | 'closed'): void {
    const open = state === 'open';
    this.detailsOpen.set(open);
    if (!open) {
      this.detailsUser.set(null);
    }
  }

  resetPassword(user: IamUser): void {
    const email = user?.email?.trim();
    if (!email) return;
    this.bannerMessage.set('');
    this.authService.forgotPassword(email, '').subscribe({
      next: () => {
        this.bannerMessage.set('IAM.RESET_LINK_SENT');
      },
      error: () => {
        this.bannerMessage.set('Could not send reset email.');
      },
    });
  }

  deactivateUser(user: IamUser): void {
    if (!user?.ItemId || !user.active) return;
    const confirmed = window.confirm(`Deactivate user ${this.displayName(user)}?`);
    if (!confirmed) return;
    this.iamService.updateUser(user.ItemId, { active: false }).subscribe({
      next: (updated) => {
        this.users.update((list) =>
          list.map((u) => (u.ItemId === updated.ItemId ? { ...u, active: false } : u))
        );
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (!t?.closest('[data-iam-row-actions]')) {
      this.openMenuUserId.set(null);
    }
  }
}
