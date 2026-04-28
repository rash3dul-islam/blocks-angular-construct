// ─── Activity Log Page ─────────────────────────────────────────────────────────
// Mirrors: react_Constract/src/modules/activity-log/pages/activity-log/activity-log.tsx
// + v1 timeline / toolbar (not the table layout).

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucidePlusCircle, lucideCheck, lucideX } from '@ng-icons/lucide';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  HlmPopover,
  HlmPopoverContent,
  HlmPopoverPortal,
  HlmPopoverTrigger,
} from '../../../../components/ui-kit/popover/src';
import { BrnCommandInput } from '@spartan-ng/brain/command';
import {
  HlmCommand,
  HlmCommandEmpty,
  HlmCommandGroup,
  HlmCommandItem,
  HlmCommandList,
} from '../../../../components/ui-kit/command/src';
import { getFormattedDateLabel } from '../../utils/activity-date-label.util';
import {
  TIMELINE_ACTIVITIES_DATA,
  TIMELINE_MODULE_FILTER_IDS,
} from '../../data/timeline-activities.data';
import { ActivityGroup } from '../../types/activity-timeline.model';
import { ActivityLogService } from '../../services/activity-log.service';
import { groupActivityLogsByDate, mergeActivityGroups } from '../../utils/map-activity-logs.util';

const transformCategory = (category: string) => category.toLowerCase().replace(/\s+/g, '_');

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmInput,
    HlmButton,
    HlmPopover,
    HlmPopoverTrigger,
    HlmPopoverPortal,
    HlmPopoverContent,
    HlmCommand,
    BrnCommandInput,
    HlmCommandList,
    HlmCommandEmpty,
    HlmCommandGroup,
    HlmCommandItem,
  ],
  viewProviders: [provideIcons({ lucideSearch, lucidePlusCircle, lucideCheck, lucideX })],
  template: `
    <div class="flex w-full flex-col p-6">
      <!-- Toolbar (React ActivityLogToolbar) -->
      <div
        class="mb-[18px] flex flex-col sm:flex-row sm:items-center sm:justify-between md:mb-8 gap-3"
      >
        <h3 class="text-2xl font-bold tracking-tight text-foreground">Activity log</h3>
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:justify-end w-full sm:w-auto"
        >
          <div class="relative w-full sm:w-64">
            <ng-icon
              name="lucideSearch"
              class="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground bg-background"
            />
            <input
              hlmInput
              class="h-8 w-full rounded-lg pl-8 text-sm"
              [ngModel]="searchValue()"
              (ngModelChange)="onSearchInput($event)"
              placeholder="Search by description..."
            />
          </div>

          <hlm-popover
            #datePopover="brnPopover"
            [autoFocus]="'dialog'"
            [closeOnOutsidePointerEvents]="true"
            [sideOffset]="6"
            align="end"
          >
            <button
              hlmBtn
              hlmPopoverTrigger
              [hlmPopoverTriggerFor]="datePopover"
              variant="outline"
              size="sm"
              type="button"
              class="h-8 border-dashed w-full sm:w-auto justify-center"
            >
              <ng-icon name="lucidePlusCircle" class="w-4 h-4 mr-1 shrink-0" />
              Date
            </button>
            <ng-template hlmPopoverPortal>
              <div hlmPopoverContent class="w-[min(100vw-2rem,320px)] p-0">
                <div class="p-3">
                  <p class="text-xs font-medium text-foreground mb-2">Date range</p>
                  <!-- React uses a calendar range picker; until we add a calendar component,
                       keep styled date inputs but match popover layout/spacing -->
                  <div class="flex flex-col gap-2">
                    <input
                      hlmInput
                      type="date"
                      class="h-8 text-sm"
                      [ngModel]="dateFrom()"
                      (ngModelChange)="setDateFrom($event)"
                    />
                    <input
                      hlmInput
                      type="date"
                      class="h-8 text-sm"
                      [ngModel]="dateTo()"
                      (ngModelChange)="setDateTo($event)"
                    />
                  </div>
                </div>
                <div class="border-t border-border p-2">
                  <button
                    hlmBtn
                    variant="ghost"
                    size="sm"
                    type="button"
                    class="w-full justify-center text-center"
                    (click)="clearDateRange()"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            </ng-template>
          </hlm-popover>

          <hlm-popover
            #modulePopover="brnPopover"
            [closeOnOutsidePointerEvents]="true"
            [sideOffset]="6"
            align="end"
          >
            <button
              hlmBtn
              hlmPopoverTrigger
              [hlmPopoverTriggerFor]="modulePopover"
              variant="outline"
              size="sm"
              type="button"
              class="h-8 border-dashed w-full sm:w-auto justify-center"
            >
              <ng-icon name="lucidePlusCircle" class="w-4 h-4 mr-1 shrink-0" />
              Module
            </button>
            <ng-template hlmPopoverPortal>
              <div hlmPopoverContent class="w-[min(100vw-2rem,240px)] p-0">
                <div hlmCommand class="p-0">
                  <div class="p-2">
                    <input
                      hlmInput
                      brnCommandInput
                      class="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                      placeholder="Enter module name..."
                      [ngModel]="moduleSearch()"
                      (ngModelChange)="moduleSearch.set($event)"
                    />
                  </div>
                  <div hlmCommandList class="max-h-72 overflow-y-auto">
                    <div hlmCommandEmpty>No modules found</div>
                    <div hlmCommandGroup>
                      @for (m of filteredModuleOptions(); track m.id) {
                        <button
                          type="button"
                          hlmCommandItem
                          [value]="m.id"
                          class="flex w-full items-center gap-2"
                          (click)="toggleModule(m.id)"
                        >
                          <div
                            class="mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-primary"
                            [class.bg-primary]="isModuleSelected(m.id)"
                            [class.text-primary-foreground]="isModuleSelected(m.id)"
                            [class.opacity-50]="!isModuleSelected(m.id)"
                          >
                            @if (isModuleSelected(m.id)) {
                              <ng-icon name="lucideCheck" class="h-3 w-3" />
                            }
                          </div>
                          <span>{{ m.label }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  @if (selectedModules().size > 0) {
                    <div class="border-t border-border p-2">
                      <button
                        hlmBtn
                        variant="ghost"
                        size="sm"
                        type="button"
                        class="w-full justify-center text-center"
                        (click)="clearModules()"
                      >
                        Clear all
                      </button>
                    </div>
                  }
                </div>
              </div>
            </ng-template>
          </hlm-popover>
        </div>
      </div>

      <!-- Timeline (React activity-log-v1 ActivityLogTimeline) -->
      @if (filteredGroups().length === 0) {
        <div
          class="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground"
        >
          <ng-icon name="lucideSearch" class="h-16 w-16 opacity-40" />
          <h3 class="text-xl font-medium text-foreground">Couldn&apos;t find anything matching</h3>
          <p class="text-sm">Try adjusting search, dates, or modules.</p>
        </div>
      } @else {
        <div class="w-full rounded-[8px] bg-card shadow-sm overflow-hidden border border-border">
          <div
            class="px-4 py-6 sm:px-12 sm:py-8 h-[min(800px,75vh)] overflow-y-auto scrollbar-thin"
            (scroll)="onScroll($event)"
          >
            <div class="relative">
              <div
                class="pointer-events-none absolute left-1.5 -ml-6 top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700"
              >
                <div class="absolute top-0 h-12 w-0.5 bg-card"></div>
                <div class="absolute bottom-0 h-8 w-0.5 bg-card"></div>
              </div>

              @for (group of visibleGroups(); track group.date; let gLast = $last) {
                <div class="mb-6 relative">
                  <div class="text-muted-foreground font-medium text-xs mb-2 pb-1">
                    {{ labelForGroup(group.date) }}
                  </div>
                  <div class="relative">
                    @for (activity of group.items; track activity.trackId; let lastItem = $last) {
                      <div class="flex relative" [class.mb-4]="!lastItem" [class.mb-0]="lastItem">
                        <div class="absolute left-1.5 -ml-8 top-1.5 z-10">
                          <div class="h-4 w-4 rounded-full bg-sky-400 dark:bg-sky-500"></div>
                        </div>
                        <div class="flex-1 min-w-0 pl-2 sm:pl-3">
                          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span class="font-normal text-muted-foreground">{{
                              formatTime(activity.time)
                            }}</span>
                            <span
                              class="h-2 w-2 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"
                            ></span>
                            <div
                              class="rounded px-2 py-0.5 text-sm font-semibold text-foreground bg-muted/80 border border-border/60"
                            >
                              {{ activity.category }}
                            </div>
                          </div>
                          <div class="mt-1 text-base text-foreground leading-snug">
                            {{ activity.description }}
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
                @if (!gLast) {
                  <hr class="mb-6 border-0 border-t border-border" />
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ActivityLogComponent implements OnInit, OnDestroy {
  private readonly _activityLogService = inject(ActivityLogService);

  protected readonly moduleFilterOptions = [...TIMELINE_MODULE_FILTER_IDS];

  protected readonly searchValue = signal('');
  protected readonly searchQuery = signal('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly selectedModules = signal<ReadonlySet<string>>(new Set());
  protected readonly moduleSearch = signal('');

  protected readonly baseGroups = signal<ActivityGroup[]>(TIMELINE_ACTIVITIES_DATA);
  private readonly _filtered = signal<ActivityGroup[]>([]);
  protected readonly visibleCount = signal(5);

  private _searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private _scrollDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly filteredGroups = computed(() => this._filtered());

  readonly visibleGroups = computed(() => {
    const all = this._filtered();
    const n = Math.min(this.visibleCount(), all.length);
    return all.slice(0, n);
  });

  ngOnInit(): void {
    this.recompute();
    this._activityLogService.getLogs({ pageNo: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        const apiGroups = groupActivityLogsByDate(res.items);
        this.baseGroups.set(mergeActivityGroups(TIMELINE_ACTIVITIES_DATA, apiGroups));
        this.recompute();
      },
      error: () => {
        this.baseGroups.set(TIMELINE_ACTIVITIES_DATA);
        this.recompute();
      },
    });
  }

  // No manual document click handlers needed; popovers handle outside click.
  ngOnDestroy(): void {
    if (this._searchDebounce) clearTimeout(this._searchDebounce);
    if (this._scrollDebounce) clearTimeout(this._scrollDebounce);
  }

  labelForGroup(d: string): string {
    return getFormattedDateLabel(d);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  onSearchInput(v: string): void {
    this.searchValue.set(v);
    if (this._searchDebounce) clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => {
      this.searchQuery.set(v);
      this.visibleCount.set(5);
      this.recompute();
    }, 500);
  }

  setDateFrom(d: string): void {
    this.dateFrom.set(d);
    this.visibleCount.set(5);
    this.recompute();
  }

  setDateTo(d: string): void {
    this.dateTo.set(d);
    this.visibleCount.set(5);
    this.recompute();
  }

  clearDateRange(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.visibleCount.set(5);
    this.recompute();
  }

  isModuleSelected(id: string): boolean {
    return this.selectedModules().has(id);
  }

  toggleModule(id: string): void {
    this.selectedModules.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.visibleCount.set(5);
    this.recompute();
  }

  clearModules(): void {
    this.selectedModules.set(new Set());
    this.moduleSearch.set('');
    this.visibleCount.set(5);
    this.recompute();
  }

  protected readonly filteredModuleOptions = computed(() => {
    const q = (this.moduleSearch() ?? '').trim().toLowerCase();
    if (!q) return this.moduleFilterOptions;
    return this.moduleFilterOptions.filter((m) => String(m.label).toLowerCase().includes(q));
  });

  onScroll(ev: Event): void {
    const container = ev.target as HTMLElement;
    if (this._scrollDebounce) clearTimeout(this._scrollDebounce);
    this._scrollDebounce = setTimeout(() => {
      const threshold = 200;
      const total = this._filtered().length;
      const loaded = this.visibleCount();
      if (loaded >= total) return;
      if (container.scrollHeight - container.scrollTop <= container.clientHeight + threshold) {
        this.visibleCount.update((c) => Math.min(c + 5, total));
      }
    }, 200);
  }

  private recompute(): void {
    const q = this.searchQuery().trim().toLowerCase();
    const fromStr = this.dateFrom();
    const toStr = this.dateTo();
    const mods = this.selectedModules();
    const hasRange = Boolean(fromStr && toStr);
    let fromMs = 0;
    let toMs = 0;
    if (hasRange) {
      fromMs = new Date(fromStr + 'T00:00:00').getTime();
      toMs = new Date(toStr + 'T23:59:59.999').getTime();
    }

    let out = this.baseGroups().map((g) => ({ ...g, items: [...g.items] }));

    if (hasRange) {
      out = out.filter((g) => {
        const t = new Date(g.date).getTime();
        return t >= fromMs && t <= toMs;
      });
    }

    if (q) {
      out = out
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => i.description.toLowerCase().includes(q)),
        }))
        .filter((g) => g.items.length > 0);
    }

    if (mods.size > 0) {
      out = out
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => mods.has(transformCategory(i.category))),
        }))
        .filter((g) => g.items.length > 0);
    }

    this._filtered.set(this.assignTrackIds(out));
  }

  private assignTrackIds(groups: ActivityGroup[]): ActivityGroup[] {
    return groups.map((g, gi) => ({
      ...g,
      items: g.items.map((item, ii) => ({
        ...item,
        trackId: `${g.date}|${gi}|${ii}|${item.time}|${item.description.slice(0, 24)}`,
      })),
    }));
  }
}
