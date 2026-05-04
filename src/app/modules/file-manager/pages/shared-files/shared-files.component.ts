// ─── Shared Files Component ────────────────────────────────────────────────────
// Mirrors: react_Constract/src/modules/file-manager/pages/shared-files/shared-files.tsx
import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutGrid,
  lucideAlignJustify,
  lucideFolder,
  lucideFile,
  lucideFileText,
  lucideImage,
  lucideTrash2,
  lucideChevronRight,
  lucideShare2,
  lucideSearch,
  lucidePlusCircle,
  lucideUpload,
  lucideFolderPlus,
  lucideInfo,
  lucideMoreVertical,
  lucideChevronLeft,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideArrowDownWideNarrow,
  lucideChevronDown,
  lucideChevronUp,
  lucideX,
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

@Component({
  selector: 'app-shared-files',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    NgIconComponent,
    HlmButton,
    HlmInput,
  ],
  viewProviders: [
    provideIcons({
      lucideLayoutGrid,
      lucideAlignJustify,
      lucideFolder,
      lucideFile,
      lucideFileText,
      lucideImage,
      lucideTrash2,
      lucideChevronRight,
      lucideShare2,
      lucideSearch,
      lucidePlusCircle,
      lucideUpload,
      lucideFolderPlus,
      lucideInfo,
      lucideMoreVertical,
      lucideChevronLeft,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideArrowDownWideNarrow,
      lucideChevronDown,
      lucideChevronUp,
      lucideX,
    }),
  ],
  template: `
    <div class="p-6 flex flex-col gap-4 min-h-0 min-h-full text-foreground bg-[#F8F9FB]">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold tracking-tight">Share with me</h1>
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
          <div class="relative">
            <button
              hlmBtn
              type="button"
              class="h-10 cursor-pointer gap-1.5 bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium"
              (click)="$event.stopPropagation(); addMenuOpen.update((v) => !v)"
            >
              <ng-icon name="lucidePlusCircle" class="h-4 w-4" />
              Add new
            </button>
            @if (addMenuOpen()) {
              <div
                class="absolute right-0 z-50 mt-1 min-w-[220px] rounded-lg border border-border bg-popover py-1 shadow-md"
                (click)="$event.stopPropagation()"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  (click)="triggerUpload()"
                >
                  <ng-icon name="lucideUpload" class="h-4 w-4 shrink-0" />
                  File upload
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  (click)="addMenuOpen.set(false); createFolderOpen.set(true)"
                >
                  <ng-icon name="lucideFolderPlus" class="h-4 w-4 shrink-0" />
                  Create new folder
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      <nav class="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button type="button" class="hover:text-foreground" (click)="navigateToRoot()">
          Share with me
        </button>
        @for (crumb of breadcrumbs(); track crumb.id) {
          <ng-icon name="lucideChevronRight" class="h-3 w-3" />
          <button type="button" class="hover:text-foreground" (click)="navigateTo(crumb.id)">
            {{ crumb.name }}
          </button>
        }
      </nav>

      <!-- Toolbar (aligned with Trash filters / chips) -->
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
              class="h-10 w-full rounded-lg border-border bg-background pl-9 text-sm shadow-sm"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <button
                hlmBtn
                variant="outline"
                size="sm"
                type="button"
                class="h-10 cursor-pointer gap-1.5 border-dashed bg-background text-sm shadow-sm"
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
                type="button"
                class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted/50"
                (click)="toggleDatePanel($event)"
                [attr.aria-expanded]="datePanelOpen()"
                aria-haspopup="dialog"
              >
                <ng-icon
                  name="lucidePlusCircle"
                  class="h-4 w-4 shrink-0 text-slate-900 dark:text-foreground"
                  style="--ng-icon__stroke-width: 1.5px"
                  aria-hidden="true"
                />
                <span>Modified Date</span>
              </button>
              @if (datePanelOpen()) {
                <div
                  class="absolute left-0 z-50 mt-1.5 w-[min(100vw-2rem,340px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-border dark:bg-card dark:shadow-xl"
                  (click)="$event.stopPropagation()"
                  role="dialog"
                  aria-label="Modified date range"
                >
                  <div
                    class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-border"
                  >
                    <span class="text-base font-medium leading-none text-slate-900 dark:text-foreground">Modified Date</span>
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
                class="inline-flex max-w-[min(100%,420px)] cursor-pointer items-center gap-1.5 rounded-full bg-[hsl(202,68%,53%)] px-3 py-1.5 text-left text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[hsl(202,68%,45%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(202,68%,53%)] focus-visible:ring-offset-2 dark:bg-[hsl(202,68%,53%)] dark:hover:bg-[hsl(202,68%,60%)]"
                (click)="clearDatesOnly()"
                aria-label="Remove date filter"
              >
                <span class="min-w-0 truncate">{{ dateFilterChipLabel() }}</span>
                <ng-icon name="lucideX" class="h-3.5 w-3.5 shrink-0 opacity-90" />
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

      <input type="file" multiple class="hidden" (change)="onFilesPicked($event)" />

      @if (uploadOpen()) {
        <div class="fixed inset-0 z-40 bg-black/60" (click)="closeUploadModal()" aria-hidden="true"></div>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div class="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl pointer-events-auto">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Upload files</h2>
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                (click)="closeUploadModal()"
                aria-label="Close upload dialog"
              >
                <ng-icon name="lucideX" class="h-4 w-4" />
              </button>
            </div>
            <div class="mt-4">
              <button
                type="button"
                class="w-full rounded-md border border-dashed border-border bg-muted/10 px-5 py-10 text-center hover:bg-muted/20"
                (click)="pickFiles()"
              >
                <div class="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background">
                  <ng-icon name="lucideUpload" class="h-5 w-5 text-muted-foreground" />
                </div>
                <p class="text-sm text-foreground">Drag & drop files here, or click to select files</p>
                <p class="mt-1 text-xs text-muted-foreground">PDF, DOCX, JPG, PNG | Max size: 25MB per file</p>
              </button>

              @if (pendingUploads().length > 0) {
                <div class="mt-3 max-h-40 overflow-auto rounded-md border border-border divide-y divide-border">
                  @for (f of pendingUploads(); track f.name) {
                    <div class="flex items-center justify-between gap-3 p-3 text-sm">
                      <div class="min-w-0">
                        <div class="truncate font-medium text-foreground">{{ f.name }}</div>
                        <div class="text-xs text-muted-foreground">{{ formatBytes(f.size) }}</div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="mt-5 flex items-center justify-end gap-2">
              <button hlmBtn variant="outline" size="sm" type="button" (click)="closeUploadModal()">
                Cancel
              </button>
              <button
                hlmBtn
                size="sm"
                type="button"
                class="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                [disabled]="pendingUploads().length === 0 || uploading()"
                (click)="confirmUpload()"
              >
                @if (uploading()) { Uploading... } @else { Upload }
              </button>
            </div>
          </div>
        </div>
      }

      @if (createFolderOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          (click)="createFolderOpen.set(false)"
        >
          <div
            class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-semibold">Create new folder</h2>
            <div class="mt-4 space-y-2">
              <label class="text-sm font-medium">Folder name</label>
              <input
                hlmInput
                class="h-10"
                [ngModel]="newFolderName()"
                (ngModelChange)="newFolderName.set($event)"
                (keydown.enter)="createFolderOpen.set(false)"
              />
              <p class="text-xs text-muted-foreground">
                (Demo) This screen doesn’t persist folder creation yet.
              </p>
            </div>
            <div class="mt-6 flex items-center justify-end gap-2">
              <button hlmBtn variant="outline" type="button" (click)="createFolderOpen.set(false)">
                Cancel
              </button>
              <button hlmBtn type="button" (click)="createFolderOpen.set(false)">Create</button>
            </div>
          </div>
        </div>
      }

      <!-- ── Grid View ───────────────────────────────────────────── -->
      @if (viewMode() === 'grid') {
        <div
          cdkDropList
          (cdkDropListDropped)="onDrop($event)"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4"
        >
          @for (item of paginatedFiles(); track item.fileId) {
            <div
              cdkDrag
              (dblclick)="onItemDoubleClick(item)"
              class="group relative rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-teal-500/50 hover:shadow-md transition-all"
            >
              <div
                class="w-14 h-14 flex items-center justify-center rounded-lg"
                [class]="getIconBg(item)"
              >
                <ng-icon
                  [name]="getFileIcon(item)"
                  class="h-7 w-7"
                  [class]="getIconColor(item)"
                ></ng-icon>
              </div>
              <span class="text-xs font-medium text-center truncate w-full">{{ item.name }}</span>
              <div class="flex items-center gap-1">
                <ng-icon name="lucideShare2" class="h-3 w-3 text-muted-foreground"></ng-icon>
                <span class="text-xs text-muted-foreground">Shared</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── List View ───────────────────────────────────────────── -->
      @if (viewMode() === 'list') {
        <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-muted/40">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  <button type="button" class="inline-flex items-center gap-1 hover:text-foreground">
                    Name
                    <ng-icon name="lucideArrowDownWideNarrow" class="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Shared by
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  <button type="button" class="inline-flex items-center gap-1 hover:text-foreground">
                    Shared Date
                    <ng-icon name="lucideArrowDownWideNarrow" class="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  <button type="button" class="inline-flex items-center gap-1 hover:text-foreground">
                    Last Modified
                    <ng-icon name="lucideArrowDownWideNarrow" class="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-foreground">
                    Size
                    <ng-icon name="lucideArrowDownWideNarrow" class="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th class="w-12 px-2 py-3 text-center align-middle">
                  <span class="inline-flex w-full items-center justify-center">
                    <ng-icon name="lucideInfo" class="h-5 w-5 text-teal-600" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (item of paginatedFiles(); track item.fileId) {
                <tr
                  (dblclick)="onItemDoubleClick(item)"
                  class="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <ng-icon [name]="getFileIcon(item)" class="h-5 w-5 shrink-0" [class]="getIconColor(item)" />
                      <span class="font-medium truncate">{{ item.name }}</span>
                      @if (item.isShared) {
                        <ng-icon name="lucideShare2" class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground"
                      >
                        {{ sharedByInitials(item) }}
                      </span>
                      <span class="text-xs text-foreground">{{ sharedByName(item) }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {{ item.createdAt | date: 'shortDate' }}
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {{ item.lastModifiedAt ?? item.createdAt | date: 'shortDate' }}
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{{ displaySize(item) }}</td>
                  <td class="px-2 py-3 text-center align-middle">
                    <span class="inline-flex w-full items-center justify-center">
                      <ng-icon
                        name="lucideMoreVertical"
                        class="h-4 w-4 text-muted-foreground"
                        (click)="$event.stopPropagation()"
                      />
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-16 text-center text-muted-foreground">No shared files found.</td>
                </tr>
              }
            </tbody>
          </table>
          <div
            class="flex flex-col items-end sm:flex-row sm:items-center sm:justify-end gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground"
          >
            <div class="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                class="h-8 rounded-md border border-input bg-background px-2 text-sm"
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
                class="h-8 w-8 p-0"
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
                class="h-8 w-8 p-0"
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
                class="h-8 w-8 p-0"
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
                class="h-8 w-8 p-0"
                [disabled]="currentPage() >= totalPages()"
                (click)="goLast()"
                title="Last page"
              >
                <ng-icon name="lucideChevronsRight" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SharedFilesComponent implements OnInit {
  private readonly fileService = inject(FileManagerService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly viewMode = signal<FileViewMode>('list');
  readonly files = signal<FileItem[]>([]);
  readonly breadcrumbs = signal<{ id: string; name: string }[]>([]);
  readonly searchQuery = signal('');
  readonly itemKindFilter = signal<FileItemKind | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  /** Month shown in the Modified Date calendar popover. */
  readonly calendarViewMonth = signal<Date>(new Date());
  readonly typePanelOpen = signal(false);
  readonly datePanelOpen = signal(false);
  readonly addMenuOpen = signal(false);
  readonly uploadOpen = signal(false);
  readonly pendingUploads = signal<File[]>([]);
  readonly uploading = signal(false);
  readonly createFolderOpen = signal(false);
  readonly newFolderName = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  readonly typeOptions: { value: FileItemKind | ''; label: string }[] = [
    { value: '', label: 'All types' },
    { value: 'Folder', label: 'Folder' },
    { value: 'File', label: 'File' },
    { value: 'Image', label: 'Image' },
    { value: 'Audio', label: 'Audio' },
    { value: 'Video', label: 'Video' },
  ];

  private readonly _closeMenus = (): void => {
    this.typePanelOpen.set(false);
    this.datePanelOpen.set(false);
    this.addMenuOpen.set(false);
    this.createFolderOpen.set(false);
  };

  readonly filteredFiles = computed(() => {
    const raw = this.searchQuery();
    const q = (raw == null ? '' : String(raw)).toLowerCase().trim();
    const kind = this.itemKindFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    let out = this.files();
    if (q) out = out.filter((f) => f.name.toLowerCase().includes(q));
    if (kind) out = out.filter((f) => f.itemKind === kind);
    if (from || to) {
      out = out.filter((f) => {
        const t = this.lastModifiedMs(f);
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
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredFiles().length / this.pageSize()) || 1)
  );
  readonly paginatedFiles = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredFiles().slice(start, start + size);
  });

  readonly hasActiveFilters = computed(() => {
    const kind = this.itemKindFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    const q = (this.searchQuery() == null ? '' : String(this.searchQuery())).trim();
    return Boolean(kind || from || to || q);
  });

  readonly typeFilterButtonLabel = computed(() => {
    const v = this.itemKindFilter();
    if (!v) return 'All types';
    return v.toUpperCase();
  });

  readonly typeFilterChipLabel = computed(() => {
    const v = this.itemKindFilter();
    if (!v) return '';
    return this.typeOptions.find((o) => o.value === v)?.label ?? v;
  });

  readonly dateFilterChipLabel = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    const fmt = (s: string) => format(parseISO(`${s}T12:00:00`), 'M/d/yyyy');
    if (from && to) {
      const lo = from < to ? from : to;
      const hi = from < to ? to : from;
      return `Modified Date: ${fmt(lo)} - ${fmt(hi)}`;
    }
    if (from) return `Modified Date: ${fmt(from)}`;
    if (to) return `Modified Date: ${fmt(to)}`;
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

  ngOnInit(): void {
    document.addEventListener('click', this._closeMenus);
    this.destroyRef.onDestroy(() => document.removeEventListener('click', this._closeMenus));
    const folderId = this.route.snapshot.paramMap.get('folderId');
    this.fileService
      .getFiles({ pageNo: 1, pageSize: 50, parentId: folderId ?? undefined })
      .subscribe((res) => {
        // Show only shared files
        this.files.set(res.items.filter((f) => f.isShared));
      });
  }

  navigateToRoot(): void {
    this.breadcrumbs.set([]);
    this.fileService
      .getFiles({ pageNo: 1, pageSize: 50 })
      .subscribe((res) => this.files.set(res.items.filter((f) => f.isShared)));
  }

  navigateTo(folderId: string): void {
    const idx = this.breadcrumbs().findIndex((b) => b.id === folderId);
    if (idx >= 0) this.breadcrumbs.update((list) => list.slice(0, idx + 1));
    this.fileService
      .getFiles({ pageNo: 1, pageSize: 50, parentId: folderId })
      .subscribe((res) => this.files.set(res.items.filter((f) => f.isShared)));
  }

  onItemDoubleClick(item: FileItem): void {
    if (item.type === 'folder') {
      this.breadcrumbs.update((list) => [...list, { id: item.fileId, name: item.name }]);
      this.fileService
        .getFiles({ pageNo: 1, pageSize: 50, parentId: item.fileId })
        .subscribe((res) => this.files.set(res.items.filter((f) => f.isShared)));
    }
  }

  onDrop(event: CdkDragDrop<FileItem[]>): void {
    const arr = [...this.files()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.files.set(arr);
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

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.datePanelOpen.set(false);
    this.currentPage.set(1);
  }

  clearDatesOnly(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  clearTypeFilter(): void {
    this.itemKindFilter.set('');
    this.typePanelOpen.set(false);
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

  private lastModifiedMs(item: FileItem): number {
    return new Date(item.lastModifiedAt ?? item.createdAt).getTime();
  }

  openUploadModal(): void {
    this.uploadOpen.set(true);
    this.pendingUploads.set([]);
    this.uploading.set(false);
  }

  closeUploadModal(): void {
    this.uploadOpen.set(false);
    this.pendingUploads.set([]);
    this.uploading.set(false);
  }

  pickFiles(): void {
    document.querySelector<HTMLInputElement>('app-shared-files input[type=file]')?.click();
  }

  triggerUpload(): void {
    this.addMenuOpen.set(false);
    this.openUploadModal();
  }

  onFilesPicked(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.pendingUploads.set(files);
    input.value = '';
  }

  confirmUpload(): void {
    // Shared-with-me normally doesn't upload, but React toolbar supports upload/create callbacks.
    // We keep a lightweight demo implementation that uploads into root.
    const files = this.pendingUploads();
    if (!files.length) return;
    this.uploading.set(true);
    let remaining = files.length;
    for (const file of files) {
      this.fileService.uploadFile({ file }).subscribe({
        next: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.uploading.set(false);
            this.closeUploadModal();
            this.navigateToRoot();
          }
        },
        error: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.uploading.set(false);
            this.closeUploadModal();
            this.navigateToRoot();
          }
        },
      });
    }
  }

  onSearchChange(value: string | null | undefined): void {
    const s = value == null ? '' : String(value);
    this.searchQuery.set(s);
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

  getFileIcon(item: FileItem): string {
    if (item.type === 'folder') return 'lucideFolder';
    const mime = item.mimeType ?? '';
    if (mime.startsWith('image/')) return 'lucideImage';
    if (mime.includes('pdf') || mime.includes('text')) return 'lucideFileText';
    return 'lucideFile';
  }

  getIconBg(item: FileItem): string {
    if (item.type === 'folder') return 'bg-amber-50 dark:bg-amber-900/20';
    if (item.mimeType?.startsWith('image/')) return 'bg-purple-50 dark:bg-purple-900/20';
    return 'bg-blue-50 dark:bg-blue-900/20';
  }

  getIconColor(item: FileItem): string {
    if (item.type === 'folder') return 'text-amber-500';
    if (item.mimeType?.startsWith('image/')) return 'text-purple-500';
    return 'text-blue-500';
  }

  sharedByName(item: FileItem): string {
    return item.sharedWith?.[0] ?? 'Unknown User';
  }

  sharedByInitials(item: FileItem): string {
    const name = this.sharedByName(item);
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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
