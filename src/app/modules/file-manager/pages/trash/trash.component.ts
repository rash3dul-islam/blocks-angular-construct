// ─── Trash Component ──────────────────────────────────────────────────────────
// UI aligned with product trash screen (list/grid, filters, sortable table, pagination).
import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrash2,
  lucideRefreshCw,
  lucideRecycle,
  lucideFolder,
  lucideFile,
  lucideFileText,
  lucideImage,
  lucideLayoutGrid,
  lucideAlignJustify,
  lucideSearch,
  lucidePlusCircle,
  lucideChevronRight,
  lucideShare2,
  lucideInfo,
  lucideMoreVertical,
  lucideChevronLeft,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideChevronUp,
  lucideChevronDown,
  lucideX,
  lucideVideo,
  lucideMusic,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { FileManagerService } from '../../services/file-manager.service';
import { FileItem, FileItemKind, FileViewMode } from '../../../../models/file-manager.model';

type TrashSortKey = 'name' | 'deleted' | 'type' | 'size';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, HlmButton, HlmInput],
  viewProviders: [
    provideIcons({
      lucideTrash2,
      lucideRefreshCw,
      lucideRecycle,
      lucideFolder,
      lucideFile,
      lucideFileText,
      lucideImage,
      lucideLayoutGrid,
      lucideAlignJustify,
      lucideSearch,
      lucidePlusCircle,
      lucideChevronRight,
      lucideShare2,
      lucideInfo,
      lucideMoreVertical,
      lucideChevronLeft,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideChevronUp,
      lucideChevronDown,
      lucideX,
      lucideVideo,
      lucideMusic,
    }),
  ],
  template: `
    <div class="p-6 flex flex-col gap-4 min-h-0 min-h-full text-foreground bg-[#F8F9FB]">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Trash</h1>
        <div class="flex flex-shrink-0 flex-wrap items-center gap-2">
          <div class="flex rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <button
              hlmBtn
              variant="ghost"
              type="button"
              class="h-10 w-10 cursor-pointer rounded-none px-0"
              [class.bg-muted]="viewMode() === 'list'"
              (click)="viewMode.set('list')"
              title="List view"
            >
              <ng-icon name="lucideAlignJustify" class="h-3.5 w-3.5" />
            </button>
            <button
              hlmBtn
              variant="ghost"
              type="button"
              class="h-10 w-10 cursor-pointer rounded-none border-l border-border px-0"
              [class.bg-muted]="viewMode() === 'grid'"
              (click)="viewMode.set('grid')"
              title="Grid view"
            >
              <ng-icon name="lucideLayoutGrid" class="h-3.5 w-3.5" />
            </button>
          </div>
          
            <button
              type="button"
              class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted/50"
              (click)="clearTrash()"
            >
              <ng-icon
                name="lucideRecycle"
                class="h-[1.125rem] w-[1.125rem] shrink-0 text-slate-900 dark:text-foreground"
                style="--ng-icon__stroke-width: 1.5px"
                aria-hidden="true"
              />
              <span class="font-bold tracking-tight">Clear trash</span>
            </button>
          
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div class="relative w-full lg:flex-1 lg:max-w-md min-w-0">
          <ng-icon
            name="lucideSearch"
            class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            hlmInput
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search by file or folder name"
            class="h-9 w-full rounded-lg border-border bg-background pl-9 text-sm shadow-sm"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              class="h-9 cursor-pointer gap-1.5 border-dashed bg-background text-sm shadow-sm"
              (click)="$event.stopPropagation(); typePanelOpen.update((v) => !v)"
            >
              <ng-icon name="lucidePlusCircle" class="h-3.5 w-3.5 shrink-0 opacity-70" />
              {{ typeFilterButtonLabel() }}
              <ng-icon name="lucideChevronDown" class="h-3 w-3 shrink-0 opacity-60" />
            </button>
            @if (typePanelOpen()) {
              <div
                class="absolute left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-md"
                (click)="$event.stopPropagation()"
              >
                @for (opt of typeOptions; track opt.value) {
                  <button
                    type="button"
                    class="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    (click)="setItemKindFilter(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                }
              </div>
            }
          </div>

          <div class="relative">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              class="h-9 cursor-pointer gap-1.5 border border-slate-200 bg-background text-sm font-medium text-foreground shadow-sm dark:border-border"
              (click)="toggleDatePanel($event)"
            >
              <ng-icon name="lucidePlusCircle" class="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-muted-foreground" />
              <span>Trashed Date</span>
              @if (datePanelOpen()) {
                <ng-icon name="lucideChevronUp" class="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-muted-foreground" />
              } @else {
                <ng-icon name="lucideChevronDown" class="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-muted-foreground" />
              }
            </button>
            @if (datePanelOpen()) {
              <div
                class="absolute left-0 z-50 mt-1.5 w-[min(100vw-2rem,340px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-border dark:bg-card dark:shadow-xl"
                (click)="$event.stopPropagation()"
                role="dialog"
                aria-label="Trashed date range"
              >
                <div
                  class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-border"
                >
                  <span class="text-base font-medium leading-none text-slate-900 dark:text-foreground">Trashed Date</span>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
                    (click)="closeDatePanel($event)"
                    title="Close"
                    aria-label="Close calendar"
                  >
                    <ng-icon name="lucideX" class="h-4 w-4" />
                  </button>
                </div>
                <div class="flex items-center gap-2 px-4 pb-3 pt-1">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-foreground transition-colors hover:bg-slate-50 dark:border-border dark:bg-card dark:hover:bg-muted/80"
                    (click)="prevCalendarMonth($event)"
                    title="Previous month"
                    aria-label="Previous month"
                  >
                    <ng-icon name="lucideChevronLeft" class="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span class="min-w-0 flex-1 text-center text-base font-medium text-slate-900 dark:text-foreground">
                    {{ calendarMonthTitle() }}
                  </span>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-foreground transition-colors hover:bg-slate-50 dark:border-border dark:bg-card dark:hover:bg-muted/80"
                    (click)="nextCalendarMonth($event)"
                    title="Next month"
                    aria-label="Next month"
                  >
                    <ng-icon name="lucideChevronRight" class="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div class="px-4 pb-1 pt-0">
                  <div
                    class="grid grid-cols-7 gap-y-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500"
                  >
                    <span class="py-1.5">Su</span>
                    <span class="py-1.5">Mo</span>
                    <span class="py-1.5">Tu</span>
                    <span class="py-1.5">We</span>
                    <span class="py-1.5">Th</span>
                    <span class="py-1.5">Fr</span>
                    <span class="py-1.5">Sa</span>
                  </div>
                  <div class="grid grid-cols-7 gap-x-0 gap-y-1 pb-1 pt-0.5 text-center text-sm">
                    @for (cell of calendarCells(); track cell.key) {
                      <button
                        type="button"
                        class="relative flex h-9 min-w-0 cursor-pointer items-center justify-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                        [class.w-full]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.w-9]="!calendarDayInRange(cell.iso) || calendarDayIsEndpoint(cell.iso)"
                        [class.mx-auto]="!calendarDayInRange(cell.iso) || calendarDayIsEndpoint(cell.iso)"
                        [class.rounded-md]="!calendarDayInRange(cell.iso) || calendarDayIsEndpoint(cell.iso)"
                        [class.rounded-none]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.text-slate-400]="cell.outside && !calendarDayInRange(cell.iso)"
                        [class.text-slate-900]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.text-white]="calendarDayIsEndpoint(cell.iso)"
                        [class.font-semibold]="calendarDayIsEndpoint(cell.iso)"
                        [class.text-foreground]="!cell.outside && !calendarDayInRange(cell.iso)"
                        [class.bg-slate-100]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.dark:bg-slate-800/50]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.bg-teal-600]="calendarDayIsEndpoint(cell.iso)"
                        [class.shadow-sm]="calendarDayIsEndpoint(cell.iso)"
                        [class.hover:bg-teal-700]="calendarDayIsEndpoint(cell.iso)"
                        [class.dark:bg-teal-600]="calendarDayIsEndpoint(cell.iso)"
                        [class.dark:hover:bg-teal-500]="calendarDayIsEndpoint(cell.iso)"
                        [class.hover:bg-slate-200]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.dark:hover:bg-slate-700/60]="calendarDayInRange(cell.iso) && !calendarDayIsEndpoint(cell.iso)"
                        [class.hover:bg-slate-100]="!cell.outside && !calendarDayInRange(cell.iso)"
                        [class.dark:hover:bg-muted/60]="!cell.outside && !calendarDayInRange(cell.iso)"
                        (click)="selectCalendarDay(cell.date, $event)"
                      >
                        {{ cell.dayOfMonth }}
                      </button>
                    }
                  </div>
                </div>
                <div class="border-t border-slate-100 px-4 pb-4 pt-2 dark:border-border">
                  <button
                    type="button"
                    class="w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-2.5 text-center text-sm font-normal text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,68%,53%)] focus-visible:ring-offset-2 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted/50"
                    (click)="clearDates()"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
        </div>
        @if (hasActiveFilters()) {
          <div class="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-2.5 dark:border-border lg:border-t-0 lg:pt-0">
            @if (itemKindFilter()) {
              <button
                type="button"
                class="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[hsl(202,68%,53%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[hsl(202,68%,45%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,68%,53%)] focus-visible:ring-offset-2 dark:bg-[hsl(202,68%,53%)] dark:hover:bg-[hsl(202,68%,60%)]"
                (click)="clearTypeFilter()"
                aria-label="Remove type filter"
              >
                {{ typeFilterChipLabel() }}
                <ng-icon name="lucideX" class="h-3.5 w-3.5 shrink-0 opacity-90" />
              </button>
            }
            @if (dateFrom() || dateTo()) {
              <button
                type="button"
                class="inline-flex max-w-[min(100%,420px)] cursor-pointer items-center gap-1.5 rounded-full bg-[hsl(202,68%,53%)] px-3 py-1.5 text-left text-xs font-semibold text-slate-900 shadow-sm transition-colors hover:bg-[hsl(202,68%,45%)] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,68%,53%)] focus-visible:ring-offset-2 dark:bg-[hsl(202,68%,53%)] dark:text-slate-950 dark:hover:bg-[hsl(202,68%,60%)]"
                (click)="clearDatesOnly()"
                aria-label="Remove date filter"
              >
                <span class="min-w-0 truncate">{{ dateFilterChipLabel() }}</span>
                <ng-icon name="lucideX" class="h-3.5 w-3.5 shrink-0 text-slate-900 dark:text-slate-950" />
              </button>
            }
            @if (searchQuery().trim()) {
              <button
                type="button"
                class="inline-flex max-w-[min(100%,280px)] cursor-pointer items-center gap-1.5 rounded-full bg-[hsl(202,68%,53%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[hsl(202,68%,45%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,68%,53%)] focus-visible:ring-offset-2 dark:bg-[hsl(202,68%,53%)] dark:hover:bg-[hsl(202,68%,60%)]"
                (click)="clearSearchFilter()"
                aria-label="Clear search"
              >
                <span class="truncate">"{{ searchQuery() }}"</span>
                <ng-icon name="lucideX" class="h-3.5 w-3.5 shrink-0 opacity-90" />
              </button>
            }
            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-foreground/85 hover:text-foreground"
              (click)="resetAllFilters()"
            >
              Reset
              <ng-icon name="lucideX" class="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        }
      </div>

      @if (filteredFiles().length === 0) {
        <div
          class="flex flex-col items-center justify-center bg-transparent min-h-[320px] p-12 text-center mt-8 md:mt-45"
        >
          <div class="text-6xl mb-6">🗑️</div>
          <h3 class="text-xl font-medium text-foreground mb-2">Trash is empty</h3>
          <p class="text-muted-foreground max-w-sm">Deleted items will appear here.</p>
        </div>
      } @else {
        @if (viewMode() === 'list') {
          <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[280px]">
            <div class="overflow-x-auto">
              <table class="w-full table-fixed min-w-[720px] text-sm">
                <colgroup>
                  <col class="min-w-0 w-[48%]" />
                  <col class="w-[8.25rem]" />
                  <col class="w-[6.75rem]" />
                  <col class="w-[5.5rem]" />
                  <col class="w-14" />
                </colgroup>
                <thead class="bg-background border-b border-border">
                  <tr>
                    <th
                      class="min-w-0 px-6 py-3.5 text-left align-middle"
                      [attr.aria-sort]="sortKey() === 'name' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null"
                    >
                      <button
                        type="button"
                        class="inline-flex min-w-0 max-w-full cursor-pointer select-none flex-nowrap items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-left transition-colors hover:border-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
                        (click)="cycleSortColumn('name', $event)"
                        title="Sort by name (click to toggle A–Z / Z–A)"
                      >
                        <span class="min-w-0 truncate text-sm font-medium text-slate-600 dark:text-slate-400">Name</span>
                        <span
                          class="inline-flex h-[26px] w-7 shrink-0 flex-col items-center justify-center gap-0 text-slate-400 dark:text-slate-500"
                          aria-hidden="true"
                        >
                          <ng-icon
                            name="lucideChevronUp"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('name', 'asc')"
                            [class.dark:text-teal-400]="sortArrowActive('name', 'asc')"
                          />
                          <ng-icon
                            name="lucideChevronDown"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('name', 'desc')"
                            [class.dark:text-teal-400]="sortArrowActive('name', 'desc')"
                          />
                        </span>
                      </button>
                    </th>
                    <th
                      class="py-3.5 pl-4 pr-3 text-center align-middle"
                      [attr.aria-sort]="sortKey() === 'deleted' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null"
                    >
                      <button
                        type="button"
                        class="mx-auto inline-flex w-max max-w-full cursor-pointer select-none flex-nowrap items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent py-1 pl-2 pr-1 transition-colors hover:border-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
                        (click)="cycleSortColumn('deleted', $event)"
                        title="Sort by deleted date (click to toggle oldest / newest first)"
                      >
                        <span class="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">Deleted date</span>
                        <span
                          class="inline-flex h-[26px] w-7 shrink-0 flex-col items-center justify-center gap-0 text-slate-400 dark:text-slate-500"
                          aria-hidden="true"
                        >
                          <ng-icon
                            name="lucideChevronUp"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('deleted', 'asc')"
                            [class.dark:text-teal-400]="sortArrowActive('deleted', 'asc')"
                          />
                          <ng-icon
                            name="lucideChevronDown"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('deleted', 'desc')"
                            [class.dark:text-teal-400]="sortArrowActive('deleted', 'desc')"
                          />
                        </span>
                      </button>
                    </th>
                    <th
                      class="py-3.5 pl-4 pr-3 text-center align-middle"
                      [attr.aria-sort]="sortKey() === 'type' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null"
                    >
                      <button
                        type="button"
                        class="mx-auto inline-flex w-max max-w-full cursor-pointer select-none flex-nowrap items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent py-1 pl-2 pr-1 transition-colors hover:border-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
                        (click)="cycleSortColumn('type', $event)"
                        title="Sort by file type (click to toggle A–Z / Z–A)"
                      >
                        <span class="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">File Type</span>
                        <span
                          class="inline-flex h-[26px] w-7 shrink-0 flex-col items-center justify-center gap-0 text-slate-400 dark:text-slate-500"
                          aria-hidden="true"
                        >
                          <ng-icon
                            name="lucideChevronUp"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('type', 'asc')"
                            [class.dark:text-teal-400]="sortArrowActive('type', 'asc')"
                          />
                          <ng-icon
                            name="lucideChevronDown"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('type', 'desc')"
                            [class.dark:text-teal-400]="sortArrowActive('type', 'desc')"
                          />
                        </span>
                      </button>
                    </th>
                    <th
                      class="py-3.5 pl-3 pr-4 text-right align-middle"
                      [attr.aria-sort]="sortKey() === 'size' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null"
                    >
                      <button
                        type="button"
                        class="ml-auto inline-flex w-max max-w-full cursor-pointer select-none flex-nowrap items-center justify-end gap-2 rounded-lg border border-transparent bg-transparent py-1 pl-1 pr-2 text-right transition-colors hover:border-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
                        (click)="cycleSortColumn('size', $event)"
                        title="Sort by size (click to toggle smallest / largest first)"
                      >
                        <span class="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">Size</span>
                        <span
                          class="inline-flex h-[26px] w-7 shrink-0 flex-col items-center justify-center gap-0 text-slate-400 dark:text-slate-500"
                          aria-hidden="true"
                        >
                          <ng-icon
                            name="lucideChevronUp"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('size', 'asc')"
                            [class.dark:text-teal-400]="sortArrowActive('size', 'asc')"
                          />
                          <ng-icon
                            name="lucideChevronDown"
                            class="h-3 w-3"
                            [class.text-teal-600]="sortArrowActive('size', 'desc')"
                            [class.dark:text-teal-400]="sortArrowActive('size', 'desc')"
                          />
                        </span>
                      </button>
                    </th>
                    <th class="w-14 px-2 py-3.5 text-center align-middle">
                      <div class="flex w-full items-center justify-center">
                        <button
                          type="button"
                          class="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:bg-slate-800/80 dark:focus-visible:ring-slate-600"
                          title="Row menu: restore items to their original location, or delete them permanently. Items stay in trash until you remove them."
                          aria-label="About trash row actions"
                        >
                          <ng-icon
                            name="lucideInfo"
                            class="h-5 w-5 shrink-0"
                            style="--ng-icon__stroke-width: 1.5px"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of paginatedFiles(); track item.fileId) {
                    <tr class="border-t border-border hover:bg-muted/25 transition-colors">
                      <td class="min-w-0 px-6 py-3">
                        <div class="flex min-w-0 items-center gap-3">
                          <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            [class]="iconBgFor(item)"
                          >
                            <ng-icon
                              [name]="iconFor(item)"
                              class="h-4 w-4"
                              [class]="iconColorFor(item)"
                            ></ng-icon>
                          </div>
                          <span class="font-medium truncate text-foreground">{{ item.name }}</span>
                          @if (item.isShared) {
                            <ng-icon
                              name="lucideShare2"
                              class="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                              title="Shared"
                            />
                          }
                        </div>
                      </td>
                      <td class="py-3 pl-4 pr-3 text-center text-xs text-muted-foreground whitespace-nowrap align-middle">
                        {{ trashedAt(item) | date: 'MM/dd/yyyy' }}
                      </td>
                      <td class="py-3 pl-4 pr-3 text-center whitespace-nowrap capitalize text-muted-foreground align-middle">
                        {{ item.itemKind }}
                      </td>
                      <td class="py-3 pl-3 pr-4 text-right whitespace-nowrap align-middle tabular-nums text-muted-foreground">
                        {{ displaySize(item) }}
                      </td>
                      <td class="px-2 py-3 text-center align-middle">
                        <div class="relative inline-flex items-center justify-center">
                          <button
                            type="button"
                            class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            (click)="toggleRowMenu($event, item.fileId)"
                            aria-label="Row actions"
                          >
                            <ng-icon name="lucideMoreVertical" class="h-4 w-4" />
                          </button>
                          @if (openRowMenuId() === item.fileId) {
                            <div
                              class="absolute right-0 top-full z-50 mt-1 min-w-[208px] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-border dark:bg-popover"
                              (click)="$event.stopPropagation()"
                            >
                              <ng-container *ngTemplateOutlet="trashRowActionsMenu; context: { $implicit: item }" />
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <ng-container *ngTemplateOutlet="paginationTpl" />
          </div>
        }

        @if (viewMode() === 'grid') {
          <div class="rounded-xl border border-border bg-card shadow-sm overflow-visible flex flex-col">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
              @for (item of paginatedFiles(); track item.fileId) {
                <div class="group relative rounded-xl border border-border bg-background p-4 flex flex-col gap-2 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      [class]="iconBgFor(item)"
                    >
                      <ng-icon [name]="iconFor(item)" class="h-5 w-5" [class]="iconColorFor(item)"></ng-icon>
                    </div>
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      (click)="toggleRowMenu($event, item.fileId)"
                      aria-label="Row actions"
                    >
                      <ng-icon name="lucideMoreVertical" class="h-4 w-4" />
                    </button>
                    @if (openRowMenuId() === item.fileId) {
                      <div
                        class="absolute right-3 top-11 z-50 min-w-[208px] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-border dark:bg-popover"
                        (click)="$event.stopPropagation()"
                      >
                        <ng-container *ngTemplateOutlet="trashRowActionsMenu; context: { $implicit: item }" />
                      </div>
                    }
                  </div>
                  <div class="min-w-0 pt-1">
                    <div class="flex items-center gap-1 min-w-0">
                      <span class="text-xs font-medium truncate text-foreground">{{ item.name }}</span>
                      @if (item.isShared) {
                        <ng-icon name="lucideShare2" class="h-3 w-3 shrink-0 text-muted-foreground" />
                      }
                    </div>
                    <div class="text-[11px] text-muted-foreground mt-1">
                      {{ trashedAt(item) | date: 'MM/dd/yyyy' }} · {{ item.itemKind }} · {{ displaySize(item) }}
                    </div>
                  </div>
                </div>
              }
            </div>
            <ng-container *ngTemplateOutlet="paginationTpl" />
          </div>
        }
      }

      @if (detailsItem(); as d) {
        <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          (click)="closeTrashDetails()"
          role="presentation"
        >
          <div
            class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-border dark:bg-card"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trash-details-title"
          >
            <h2 id="trash-details-title" class="text-lg font-semibold text-slate-900 dark:text-foreground">{{ d.name }}</h2>
            <dl class="mt-4 space-y-2 text-sm text-muted-foreground">
              <div>
                <dt class="inline font-medium text-foreground">Type:</dt>
                {{ d.itemKind }}
              </div>
              <div>
                <dt class="inline font-medium text-foreground">Size:</dt>
                {{ displaySize(d) }}
              </div>
              <div>
                <dt class="inline font-medium text-foreground">Trashed:</dt>
                {{ trashedAt(d) | date: 'medium' }}
              </div>
              <div class="break-words">
                <dt class="inline font-medium text-foreground">Path:</dt>
                {{ d.path }}
              </div>
              @if (d.isShared) {
                <div>
                  <dt class="inline font-medium text-foreground">Shared:</dt>
                  Yes
                </div>
              }
            </dl>
            <button
              hlmBtn
              variant="outline"
              type="button"
              class="mt-6 w-full"
              (click)="closeTrashDetails()"
            >
              Close
            </button>
          </div>
        </div>
      }

      <ng-template #trashRowActionsMenu let-item>
        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-inset dark:text-foreground dark:hover:bg-muted/80"
          (click)="openTrashDetails($event, item)"
        >
          <ng-icon
            name="lucideInfo"
            class="h-4 w-4 shrink-0 text-slate-900 dark:text-foreground"
            style="--ng-icon__stroke-width: 1.5px"
            aria-hidden="true"
          />
          <span>View Details</span>
        </button>
        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-inset dark:text-foreground dark:hover:bg-muted/80"
          (click)="restoreFile(item)"
        >
          <ng-icon
            name="lucideRefreshCw"
            class="h-4 w-4 shrink-0 text-slate-900 dark:text-foreground"
            style="--ng-icon__stroke-width: 1.5px"
            aria-hidden="true"
          />
          <span>Restore</span>
        </button>
        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left text-sm leading-snug text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-inset dark:text-rose-400 dark:hover:bg-rose-950/30"
          (click)="permanentDelete(item)"
        >
          <ng-icon
            name="lucideTrash2"
            class="h-4 w-4 shrink-0 text-rose-700 dark:text-rose-400"
            style="--ng-icon__stroke-width: 1.5px"
            aria-hidden="true"
          />
          <span>Delete forever</span>
        </button>
      </ng-template>

      <ng-template #paginationTpl>
        <div
          class="flex flex-col items-end sm:flex-row sm:items-center sm:justify-end gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              class="h-8 cursor-pointer rounded-md border border-input bg-background px-2 text-sm"
              [ngModel]="pageSize()"
              (ngModelChange)="setPageSize($event)"
            >
              @for (n of pageSizeOptions; track n) {
                <option [ngValue]="n">{{ n }}</option>
              }
            </select>
          </div>
          <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
          <div class="flex items-center gap-1">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 cursor-pointer p-0 disabled:cursor-not-allowed"
              [disabled]="currentPage() <= 1"
              (click)="goFirst()"
              title="First page"
            >
              <ng-icon name="lucideChevronsLeft" class="h-4 w-4" />
            </button>
            <button
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 cursor-pointer p-0 disabled:cursor-not-allowed"
              [disabled]="currentPage() <= 1"
              (click)="goPrev()"
              title="Previous"
            >
              <ng-icon name="lucideChevronLeft" class="h-4 w-4" />
            </button>
            <button
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 cursor-pointer p-0 disabled:cursor-not-allowed"
              [disabled]="currentPage() >= totalPages()"
              (click)="goNext()"
              title="Next"
            >
              <ng-icon name="lucideChevronRight" class="h-4 w-4" />
            </button>
            <button
              hlmBtn
              variant="outline"
              size="sm"
              class="h-8 w-8 cursor-pointer p-0 disabled:cursor-not-allowed"
              [disabled]="currentPage() >= totalPages()"
              (click)="goLast()"
              title="Last page"
            >
              <ng-icon name="lucideChevronsRight" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class TrashComponent implements OnInit {
  private readonly fileService = inject(FileManagerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly files = signal<FileItem[]>([]);
  readonly viewMode = signal<FileViewMode>('list');
  readonly searchQuery = signal('');
  readonly itemKindFilter = signal<FileItemKind | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  /** Month shown in the Trashed Date calendar popover. */
  readonly calendarViewMonth = signal<Date>(new Date());
  readonly typePanelOpen = signal(false);
  readonly datePanelOpen = signal(false);
  readonly openRowMenuId = signal<string | null>(null);
  /** Row “View details” modal (list + grid use the same flow). */
  readonly detailsItem = signal<FileItem | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];
  readonly sortKey = signal<TrashSortKey>('deleted');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly typeOptions: { value: FileItemKind | ''; label: string }[] = [
    { value: '', label: 'All types' },
    { value: 'Folder', label: 'Folder' },
    { value: 'File', label: 'File' },
    { value: 'Image', label: 'Image' },
    { value: 'Audio', label: 'Audio' },
    { value: 'Video', label: 'Video' },
  ];

  private readonly _closePanels = (): void => {
    this.typePanelOpen.set(false);
    this.datePanelOpen.set(false);
    this.openRowMenuId.set(null);
  };

  readonly hasActiveFilters = computed(() => {
    const kind = this.itemKindFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    const q = this.searchQuery().trim();
    return !!kind || !!from || !!to || !!q;
  });

  /** Toolbar trigger: uppercase kind (e.g. FILE) or “All types”. */
  readonly typeFilterButtonLabel = computed(() => {
    const v = this.itemKindFilter();
    if (!v) return 'All types';
    return v.toUpperCase();
  });

  /** Chip text: human-readable label from type options. */
  readonly typeFilterChipLabel = computed(() => {
    const v = this.itemKindFilter();
    if (!v) return '';
    return this.typeOptions.find((o) => o.value === v)?.label ?? v;
  });

  /** Active filter chip: `Trashed Date: 5/3/2026 - 5/16/2026` (no leading zeros). */
  readonly dateFilterChipLabel = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    const fmt = (s: string) => format(parseISO(`${s}T12:00:00`), 'M/d/yyyy');
    if (from && to) {
      const lo = from < to ? from : to;
      const hi = from < to ? to : from;
      return `Trashed Date: ${fmt(lo)} - ${fmt(hi)}`;
    }
    if (from) return `Trashed Date: ${fmt(from)}`;
    if (to) return `Trashed Date: ${fmt(to)}`;
    return '';
  });

  readonly calendarCells = computed(() => {
    const cursor = this.calendarViewMonth();
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
      date,
      key: format(date, 'yyyy-MM-dd'),
      iso: format(date, 'yyyy-MM-dd'),
      outside: !isSameMonth(date, cursor),
      dayOfMonth: format(date, 'd'),
    }));
  });

  readonly filteredFiles = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const kind = this.itemKindFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    let out = this.files();
    if (q) out = out.filter((f) => f.name.toLowerCase().includes(q));
    if (kind) out = out.filter((f) => f.itemKind === kind);
    if (from || to) {
      out = out.filter((f) => {
        const t = this.trashedAtMs(f);
        if (from) {
          const fromMs = new Date(from + 'T00:00:00').getTime();
          if (t < fromMs) return false;
        }
        if (to) {
          const toMs = new Date(to + 'T23:59:59.999').getTime();
          if (t > toMs) return false;
        }
        return true;
      });
    }
    return out;
  });

  readonly sortedFiles = computed(() => {
    const list = [...this.filteredFiles()];
    const key = this.sortKey();
    const dir = this.sortDir();
    const mul = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case 'name':
          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'deleted':
          cmp = this.trashedAtMs(a) - this.trashedAtMs(b);
          break;
        case 'type':
          cmp = a.itemKind.localeCompare(b.itemKind);
          break;
        case 'size':
          cmp = this.sizeBytes(a) - this.sizeBytes(b);
          break;
      }
      return cmp * mul;
    });
    return list;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedFiles().length / this.pageSize()) || 1)
  );

  readonly paginatedFiles = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.sortedFiles().slice(start, start + size);
  });

  ngOnInit(): void {
    document.addEventListener('click', this._closePanels);
    this.destroyRef.onDestroy(() => document.removeEventListener('click', this._closePanels));

    this.fileService.getFiles({ pageNo: 1, pageSize: 100 }).subscribe((res) => {
      const demo = res.items.slice(0, 18).map((f) => ({ ...f, isDeleted: true }));
      this.files.set(demo);
    });
  }

  sortArrowActive(key: TrashSortKey, dir: 'asc' | 'desc'): boolean {
    return this.sortKey() === key && this.sortDir() === dir;
  }

  setSort(key: TrashSortKey, dir: 'asc' | 'desc', ev?: Event): void {
    ev?.stopPropagation();
    this.sortKey.set(key);
    this.sortDir.set(dir);
    this.currentPage.set(1);
  }

  /** One control for label + chevrons: new column → asc; same column → toggle asc/desc. */
  cycleSortColumn(key: TrashSortKey, ev?: Event): void {
    if (this.sortKey() !== key) {
      this.setSort(key, 'asc', ev);
      return;
    }
    this.setSort(key, this.sortDir() === 'asc' ? 'desc' : 'asc', ev);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  setItemKindFilter(v: FileItemKind | ''): void {
    this.itemKindFilter.set(v);
    this.typePanelOpen.set(false);
    this.currentPage.set(1);
  }

  setDateFrom(v: string): void {
    this.dateFrom.set(v);
    this.currentPage.set(1);
  }

  setDateTo(v: string): void {
    this.dateTo.set(v);
    this.currentPage.set(1);
  }

  calendarMonthTitle(): string {
    return format(this.calendarViewMonth(), 'MMMM yyyy');
  }

  toggleDatePanel(ev: Event): void {
    ev.stopPropagation();
    const open = !this.datePanelOpen();
    if (open) {
      const from = this.dateFrom();
      try {
        if (from) {
          this.calendarViewMonth.set(parseISO(`${from}T12:00:00`));
        } else {
          this.calendarViewMonth.set(new Date());
        }
      } catch {
        this.calendarViewMonth.set(new Date());
      }
    }
    this.datePanelOpen.set(open);
  }

  closeDatePanel(ev: Event): void {
    ev.stopPropagation();
    this.datePanelOpen.set(false);
  }

  prevCalendarMonth(ev: Event): void {
    ev.stopPropagation();
    this.calendarViewMonth.update((d) => subMonths(d, 1));
  }

  nextCalendarMonth(ev: Event): void {
    ev.stopPropagation();
    this.calendarViewMonth.update((d) => addMonths(d, 1));
  }

  selectCalendarDay(date: Date, ev: Event): void {
    ev.stopPropagation();
    const iso = format(date, 'yyyy-MM-dd');
    const from = this.dateFrom();
    const to = this.dateTo();
    if (!from || (from && to)) {
      this.setDateFrom(iso);
      this.setDateTo('');
    } else if (iso < from) {
      this.setDateFrom(iso);
      this.setDateTo('');
    } else {
      this.setDateTo(iso);
    }
  }

  calendarDayInRange(iso: string): boolean {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (!from) return false;
    if (!to) return iso === from;
    const lo = from < to ? from : to;
    const hi = from < to ? to : from;
    return iso >= lo && iso <= hi;
  }

  calendarDayIsEndpoint(iso: string): boolean {
    const from = this.dateFrom();
    const to = this.dateTo();
    return (!!from && iso === from) || (!!to && iso === to);
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.datePanelOpen.set(false);
    this.currentPage.set(1);
  }

  clearTypeFilter(): void {
    this.itemKindFilter.set('');
    this.typePanelOpen.set(false);
    this.currentPage.set(1);
  }

  /** Clear date range only (e.g. from chip); leave calendar panel state as-is. */
  clearDatesOnly(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  clearSearchFilter(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  resetAllFilters(): void {
    this.searchQuery.set('');
    this.itemKindFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.typePanelOpen.set(false);
    this.datePanelOpen.set(false);
    this.currentPage.set(1);
  }

  setPageSize(value: number): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  goFirst(): void {
    this.currentPage.set(1);
  }

  goPrev(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  goNext(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  goLast(): void {
    this.currentPage.set(this.totalPages());
  }

  toggleRowMenu(ev: Event, id: string): void {
    ev.stopPropagation();
    this.openRowMenuId.update((cur) => (cur === id ? null : id));
  }

  openTrashDetails(ev: Event, item: FileItem): void {
    ev.stopPropagation();
    this.openRowMenuId.set(null);
    this.detailsItem.set(item);
  }

  closeTrashDetails(): void {
    this.detailsItem.set(null);
  }

  trashedAt(item: FileItem): string {
    return item.updatedAt ?? item.lastModifiedAt ?? item.createdAt;
  }

  private trashedAtMs(item: FileItem): number {
    return new Date(this.trashedAt(item)).getTime();
  }

  private sizeBytes(item: FileItem): number {
    return item.size ?? 0;
  }

  restoreFile(item: FileItem): void {
    this.openRowMenuId.set(null);
    this.fileService.restoreFile(item.fileId).subscribe(() => {
      this.files.update((list) => list.filter((f) => f.fileId !== item.fileId));
    });
  }

  permanentDelete(item: FileItem): void {
    this.openRowMenuId.set(null);
    this.fileService.deleteFile(item.fileId).subscribe(() => {
      this.files.update((list) => list.filter((f) => f.fileId !== item.fileId));
    });
  }

  clearTrash(): void {
    const ids = this.files().map((f) => f.fileId);
    ids.forEach((id) => this.fileService.deleteFile(id).subscribe());
    this.files.set([]);
    this.openRowMenuId.set(null);
    this.detailsItem.set(null);
    this.currentPage.set(1);
  }

  iconFor(item: FileItem): string {
    switch (item.itemKind) {
      case 'Folder':
        return 'lucideFolder';
      case 'Image':
        return 'lucideImage';
      case 'Audio':
        return 'lucideMusic';
      case 'Video':
        return 'lucideVideo';
      case 'File':
      default:
        return item.mimeType?.includes('pdf') || item.name.toLowerCase().endsWith('.pdf')
          ? 'lucideFileText'
          : 'lucideFile';
    }
  }

  iconColorFor(item: FileItem): string {
    switch (item.itemKind) {
      case 'Folder':
        return 'text-amber-500';
      case 'Image':
        return 'text-rose-500';
      case 'Audio':
        return 'text-violet-500';
      case 'Video':
        return 'text-sky-600';
      case 'File':
      default:
        return 'text-teal-600';
    }
  }

  iconBgFor(item: FileItem): string {
    switch (item.itemKind) {
      case 'Folder':
        return 'bg-amber-50 dark:bg-amber-950/40';
      case 'Image':
        return 'bg-rose-50 dark:bg-rose-950/30';
      case 'Audio':
        return 'bg-violet-50 dark:bg-violet-950/30';
      case 'Video':
        return 'bg-sky-50 dark:bg-sky-950/30';
      default:
        return 'bg-teal-50 dark:bg-teal-950/30';
    }
  }

  displaySize(item: FileItem): string {
    return item.sizeLabel ?? (item.size ? this.formatBytes(item.size) : '—');
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
