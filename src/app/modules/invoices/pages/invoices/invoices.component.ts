import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucideTrash2,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideLoaderCircle,
} from '@ng-icons/lucide';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan-ng/helm/select';
import { FormsModule } from '@angular/forms';
import { InvoicesService } from '../../services/invoices.service';
import type { InvoiceItem } from '../../types/invoices.types';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmInput,
    HlmButton,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
  ],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucideTrash2,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideLoaderCircle,
    }),
  ],
  template: `
    <div class="flex w-full flex-col gap-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-semibold text-foreground">Invoices</h1>
        <button hlmBtn class="inline-flex items-center gap-2" (click)="goNew()">
          <ng-icon name="lucidePlus" class="h-4 w-4" /> New invoice
        </button>
      </div>

      <!-- Filters (matches screenshot layout) -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative min-w-[240px] flex-1 max-w-md">
          <ng-icon
            name="lucideSearch"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            hlmInput
            [(ngModel)]="searchDraft"
            [ngModelOptions]="{ standalone: true }"
            placeholder="Search by customer name..."
            class="h-9 w-full pl-9 pr-3 text-sm"
            (ngModelChange)="applyFilters()"
          />
        </div>

        <button hlmBtn variant="outline" size="sm" class="h-9 text-xs font-medium">
          Date issued
        </button>
        <button hlmBtn variant="outline" size="sm" class="h-9 text-xs font-medium">Due date</button>
        <button hlmBtn variant="outline" size="sm" class="h-9 text-xs font-medium">Status</button>
      </div>

      <!-- Overview cards -->
      <div class="rounded-lg border border-border bg-card shadow-sm">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-sm font-medium text-foreground">Overview</div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 p-4">
          @for (c of overviewCards(); track c.label) {
            <div class="rounded-lg border border-border/60 bg-background px-4 py-3">
              <div class="text-xs text-muted-foreground">{{ c.label }}</div>
              <div class="mt-2 text-xl font-semibold text-foreground">{{ c.count }}</div>
              <div class="text-xs text-muted-foreground uppercase">
                {{ currency() }} {{ c.amount.toFixed(2) }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <ng-icon name="lucideLoaderCircle" class="h-6 w-6 animate-spin" />
            <span class="text-sm">Loading invoices…</span>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/40">
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Invoice ID
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Customer
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Date issued
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Amount
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Due date
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Status
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (inv of filteredItems(); track inv.ItemId) {
                  <tr
                    class="border-b border-border/80 transition-colors hover:bg-muted/30 cursor-pointer"
                    (click)="openDetails(inv)"
                  >
                    <td class="px-4 py-3 font-medium text-foreground">{{ inv.ItemId }}</td>
                    <td class="px-4 py-3 text-foreground">
                      {{ inv.Customer[0]?.CustomerName ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{{ fmtDate(inv.DateIssued) }}</td>
                    <td class="px-4 py-3 text-muted-foreground uppercase">
                      {{ inv.Currency ?? currency() }} {{ (inv.Amount ?? 0).toFixed(2) }}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{{ fmtDate(inv.DueDate) }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                      >
                        {{ inv.Status ?? 'Draft' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        hlmBtn
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0 text-destructive"
                        (click)="deleteInvoice(inv); $event.stopPropagation()"
                        aria-label="Delete"
                      >
                        <ng-icon name="lucideTrash2" class="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-14 text-center text-sm text-muted-foreground">
                      No invoices found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Pagination -->
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-3"
        >
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
                hlmBtn
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0"
                [disabled]="pageIndex() === 0 || loading()"
                (click)="goFirstPage()"
              >
                <ng-icon name="lucideChevronsLeft" class="h-4 w-4" />
              </button>
              <button
                hlmBtn
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0"
                [disabled]="pageIndex() === 0 || loading()"
                (click)="goPrevPage()"
              >
                <ng-icon name="lucideChevronLeft" class="h-4 w-4" />
              </button>
              <button
                hlmBtn
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0"
                [disabled]="pageIndex() >= totalPages() - 1 || loading()"
                (click)="goNextPage()"
              >
                <ng-icon name="lucideChevronRight" class="h-4 w-4" />
              </button>
              <button
                hlmBtn
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0"
                [disabled]="pageIndex() >= totalPages() - 1 || loading()"
                (click)="goLastPage()"
              >
                <ng-icon name="lucideChevronsRight" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InvoicesComponent {
  private readonly _svc = inject(InvoicesService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly items = signal<InvoiceItem[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);

  searchDraft = '';
  readonly pageSizeOptions = [10, 20, 50];
  readonly currency = computed(() => {
    const list = this.filteredItems();
    return String(list[0]?.Currency ?? 'CHF').toUpperCase();
  });

  readonly totalPages = computed(() => {
    const tc = this.totalCount();
    const ps = this.pageSize();
    return Math.max(1, Math.ceil(tc / ps) || 1);
  });

  readonly filteredItems = computed(() => {
    const q = (this.searchDraft ?? '').trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter((inv) =>
      (inv.Customer[0]?.CustomerName ?? '').toLowerCase().includes(q)
    );
  });

  readonly overviewCards = computed(() => {
    const list = this.filteredItems();

    const sum = (pred: (i: InvoiceItem) => boolean) => {
      const rows = list.filter(pred);
      const count = rows.length;
      const amount = rows.reduce((acc, r) => acc + (Number(r.Amount) || 0), 0);
      return { count, amount };
    };

    const all = sum(() => true);
    const paid = sum((i) => (i.Status ?? '').toLowerCase() === 'paid');
    const pending = sum((i) => (i.Status ?? '').toLowerCase() === 'pending');
    const overdue = sum((i) => (i.Status ?? '').toLowerCase() === 'overdue');
    const draft = sum((i) => (i.Status ?? '').toLowerCase() === 'draft');

    return [
      { label: 'Total Invoices', ...all },
      { label: 'Paid', ...paid },
      { label: 'Pending', ...pending },
      { label: 'Overdue', ...overdue },
      { label: 'Draft', ...draft },
    ];
  });

  constructor() {
    this.load();
  }

  applyFilters(): void {
    // Filters are local for now (React does client-side toolbar filtering too).
  }

  fmtDate(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  load(): void {
    this.loading.set(true);
    this._svc
      .getInvoiceItems({ pageNo: this.pageIndex() + 1, pageSize: this.pageSize() })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.totalCount.set(res.totalCount ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.items.set([]);
          this.totalCount.set(0);
          this.loading.set(false);
        },
      });
  }

  goNew(): void {
    this._router.navigate(['/invoices/new']);
  }

  openDetails(inv: InvoiceItem): void {
    this._router.navigate(['/invoices', inv.ItemId]);
  }

  deleteInvoice(inv: InvoiceItem): void {
    const confirmed = window.confirm(`Delete invoice ${inv.ItemId}?`);
    if (!confirmed) return;
    this._svc
      .deleteInvoiceItem({ filter: `{"_id": "${inv.ItemId}"}`, input: { isHardDelete: true } })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => this.load(),
        error: () => this.load(),
      });
  }

  onPageSizeChange(raw: unknown): void {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    this.pageSize.set(n);
    this.pageIndex.set(0);
    this.load();
  }

  goFirstPage(): void {
    this.pageIndex.set(0);
    this.load();
  }
  goPrevPage(): void {
    this.pageIndex.update((i) => Math.max(0, i - 1));
    this.load();
  }
  goNextPage(): void {
    this.pageIndex.update((i) => Math.min(this.totalPages() - 1, i + 1));
    this.load();
  }
  goLastPage(): void {
    this.pageIndex.set(this.totalPages() - 1);
    this.load();
  }
}
