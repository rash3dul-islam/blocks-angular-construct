// ─── My Files ──────────────────────────────────────────────────────────────────
// Mirrors: react_Constract/src/modules/file-manager/pages/my-files/my-files.tsx

import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutGrid,
  lucideAlignJustify,
  lucideUpload,
  lucideFolderPlus,
  lucideFolder,
  lucideFile,
  lucideFileText,
  lucideImage,
  lucideMusic,
  lucideVideo,
  lucideTrash2,
  lucideMoreVertical,
  lucideChevronRight,
  lucideSearch,
  lucidePlusCircle,
  lucideUsers,
  lucideInfo,
  lucideChevronLeft,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideArrowDownWideNarrow,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import {
  HlmDialog,
  HlmDialogContent,
  HlmDialogFooter,
  HlmDialogHeader,
} from '@spartan-ng/helm/dialog';
import { FileManagerService } from '../../services/file-manager.service';
import { FileItem, FileItemKind, FileViewMode } from '../../../../models/file-manager.model';

@Component({
  selector: 'app-my-files',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgIconComponent,
    HlmButton,
    HlmInput,
    BrnDialogContent,
    HlmDialog,
    HlmDialogContent,
    HlmDialogHeader,
    HlmDialogFooter,
  ],
  viewProviders: [
    provideIcons({
      lucideLayoutGrid,
      lucideAlignJustify,
      lucideUpload,
      lucideFolderPlus,
      lucideFolder,
      lucideFile,
      lucideFileText,
      lucideImage,
      lucideMusic,
      lucideVideo,
      lucideTrash2,
      lucideMoreVertical,
      lucideChevronRight,
      lucideSearch,
      lucidePlusCircle,
      lucideUsers,
      lucideInfo,
      lucideChevronLeft,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideArrowDownWideNarrow,
      lucideX,
    }),
  ],
  template: `
    <div class="p-6 flex flex-col gap-4 min-h-0 text-foreground">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <h1 class="text-2xl font-bold tracking-tight">My files</h1>
      </div>

      <!-- Toolbar (React BaseHeaderToolbar) -->
      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div class="relative w-full lg:flex-1 lg:max-w-md min-w-0">
          <ng-icon
            name="lucideSearch"
            class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            hlmInput
            class="h-9 w-full rounded-lg pl-9 text-sm"
            [ngModel]="searchValue()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search by file or folder name"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              class="h-9 border-dashed gap-1.5 text-sm"
              (click)="$event.stopPropagation(); typePanelOpen.update((v) => !v)"
            >
              <ng-icon name="lucidePlusCircle" class="h-3.5 w-3.5 shrink-0 opacity-70" />
              {{ typeFilterLabel() }}
            </button>
            @if (typePanelOpen()) {
              <div
                class="absolute left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-md"
                (click)="$event.stopPropagation()"
              >
                @for (opt of typeOptions; track opt.value) {
                  <button
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    (click)="setItemKindFilter(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                }
              </div>
            }
          </div>

          <div class="relative flex flex-wrap items-center gap-2">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              class="h-9 border-dashed gap-1.5 text-sm"
              (click)="$event.stopPropagation(); datePanelOpen.update((v) => !v)"
            >
              <ng-icon name="lucidePlusCircle" class="h-3.5 w-3.5 shrink-0 opacity-70" />
              Last Modified
            </button>
            @if (datePanelOpen()) {
              <div
                class="absolute left-0 z-50 mt-1 flex w-[min(100vw-2rem,260px)] flex-col gap-2 rounded-lg border border-border bg-popover p-3 shadow-md"
                (click)="$event.stopPropagation()"
              >
                <input
                  hlmInput
                  type="date"
                  class="h-9 text-sm"
                  [ngModel]="dateFrom()"
                  (ngModelChange)="setDateFrom($event)"
                />
                <input
                  hlmInput
                  type="date"
                  class="h-9 text-sm"
                  [ngModel]="dateTo()"
                  (ngModelChange)="setDateTo($event)"
                />
                <button
                  hlmBtn
                  variant="ghost"
                  size="sm"
                  type="button"
                  class="text-xs"
                  (click)="clearDates()"
                >
                  Clear filter
                </button>
              </div>
            }
          </div>

          <div class="flex-1 min-w-[8px] lg:flex-none"></div>

          <div class="flex rounded-lg border border-border bg-background overflow-hidden">
            <button
              hlmBtn
              variant="ghost"
              type="button"
              class="h-9 w-9 rounded-none px-0"
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
              class="h-9 w-9 rounded-none border-l border-border px-0"
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
              class="h-9 gap-1.5 bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium"
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
                  File/Folder upload
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  (click)="$event.stopPropagation(); openCreateFolderModal()"
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
        <button type="button" class="hover:text-foreground" (click)="goRoot()">My files</button>
        @for (c of breadcrumbs(); track c.id) {
          <ng-icon name="lucideChevronRight" class="h-3 w-3" />
          <button type="button" class="hover:text-foreground" (click)="goFolder(c.id)">
            {{ c.name }}
          </button>
        }
      </nav>

      <input #fileInput type="file" multiple class="hidden" (change)="onFilesPicked($event)" />

      <!-- Upload modal (React: file upload modal) -->
      @if (uploadOpen()) {
        <hlm-dialog state="open" (closed)="closeUploadModal()">
          <hlm-dialog-content class="sm:max-w-lg" *brnDialogContent="let ctx">
            <hlm-dialog-header>
              <h2 class="text-lg font-semibold">Upload files</h2>
              <p class="text-sm text-muted-foreground">Select one or more files to upload.</p>
            </hlm-dialog-header>

            <div class="mt-4 space-y-3">
              <button hlmBtn variant="outline" type="button" class="w-full" (click)="pickFiles()">
                Choose files
              </button>

              @if (pendingUploads().length === 0) {
                <div class="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  No files selected yet.
                </div>
              } @else {
                <div class="rounded-md border border-border divide-y divide-border">
                  @for (f of pendingUploads(); track f.name) {
                    <div class="flex items-center justify-between gap-3 p-3 text-sm">
                      <div class="min-w-0">
                        <div class="truncate font-medium text-foreground">{{ f.name }}</div>
                        <div class="text-xs text-muted-foreground">{{ formatBytes(f.size) }}</div>
                      </div>
                      <button
                        hlmBtn
                        variant="ghost"
                        size="sm"
                        type="button"
                        class="text-destructive"
                        (click)="removePendingUpload(f)"
                      >
                        Remove
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <hlm-dialog-footer class="mt-6">
              <button hlmBtn variant="outline" type="button" (click)="closeUploadModal()">
                Cancel
              </button>
              <button
                hlmBtn
                type="button"
                [disabled]="pendingUploads().length === 0 || uploading()"
                (click)="confirmUpload()"
              >
                @if (uploading()) { Uploading... } @else { Upload }
              </button>
            </hlm-dialog-footer>
          </hlm-dialog-content>
        </hlm-dialog>
      }

      <!-- Rename modal (React: RenameFile) -->
      @if (renameOpen() && renamingItem(); as it) {
        <hlm-dialog state="open" (closed)="closeRenameModal()">
          <hlm-dialog-content class="sm:max-w-md" *brnDialogContent="let ctx">
            <hlm-dialog-header>
              <h2 class="text-lg font-semibold">Rename</h2>
              <p class="text-sm text-muted-foreground">Change the name of “{{ it.name }}”.</p>
            </hlm-dialog-header>

            <div class="mt-4 space-y-2">
              <label class="text-sm font-medium">New name</label>
              <input
                hlmInput
                class="h-10"
                [ngModel]="renameDraft()"
                (ngModelChange)="renameDraft.set($event)"
                (keydown.enter)="confirmRename()"
              />
              @if (renameError()) {
                <div class="text-sm text-destructive">{{ renameError() }}</div>
              }
            </div>

            <hlm-dialog-footer class="mt-6">
              <button hlmBtn variant="outline" type="button" (click)="closeRenameModal()">
                Cancel
              </button>
              <button hlmBtn type="button" (click)="confirmRename()">Save</button>
            </hlm-dialog-footer>
          </hlm-dialog-content>
        </hlm-dialog>
      }

      @if (viewMode() === 'list') {
        <div
          class="rounded-lg border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[320px]"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[640px]">
              <thead class="bg-muted/40 border-b border-border">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-foreground"
                      (click)="toggleSort()"
                    >
                      Name
                      <ng-icon name="lucideArrowDownWideNarrow" class="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-foreground"
                      (click)="toggleSort()"
                    >
                      Last Modified
                      <ng-icon name="lucideArrowDownWideNarrow" class="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Type
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Size
                  </th>
                  <th class="px-4 py-3 w-10 text-center">
                    <span class="sr-only">Info</span>
                    <ng-icon
                      name="lucideInfo"
                      class="h-4 w-4 text-muted-foreground inline-block"
                      title="Details"
                    />
                  </th>
                  <th class="w-12 px-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (item of files(); track item.fileId) {
                  <tr
                    class="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    (dblclick)="openItem(item)"
                  >
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <ng-icon
                          [name]="iconFor(item)"
                          class="h-5 w-5 shrink-0"
                          [class]="iconColorFor(item)"
                        />
                        <span class="font-medium truncate">{{ item.name }}</span>
                        @if (item.isShared) {
                          <ng-icon
                            name="lucideUsers"
                            class="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            title="Shared"
                          />
                        }
                      </div>
                    </td>
                    <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {{ item.lastModifiedAt ?? item.createdAt | date: 'short' }}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{{ item.itemKind }}</td>
                    <td class="px-4 py-3 text-muted-foreground">{{ displaySize(item) }}</td>
                    <td class="px-4 py-3 text-center">
                      <button
                        type="button"
                        class="inline-flex p-1 rounded-md hover:bg-muted text-muted-foreground"
                        (click)="openDetails(item); $event.stopPropagation()"
                      >
                        <ng-icon name="lucideInfo" class="h-4 w-4" />
                      </button>
                    </td>
                    <td class="px-2 py-3 text-right relative">
                      <button
                        type="button"
                        class="inline-flex p-1 rounded-md hover:bg-muted"
                        (click)="$event.stopPropagation(); toggleRowMenu(item.fileId)"
                      >
                        <ng-icon name="lucideMoreVertical" class="h-4 w-4 text-muted-foreground" />
                      </button>
                      @if (rowMenuId() === item.fileId) {
                        <div
                          class="absolute right-2 top-full z-20 mt-0.5 min-w-[140px] rounded-md border border-border bg-popover py-1 shadow-md text-left"
                          (click)="$event.stopPropagation()"
                        >
                          <button
                            type="button"
                            class="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                            (click)="renameItem(item)"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            class="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
                            (click)="deleteItem(item)"
                          >
                            Delete
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-4 py-16 text-center text-muted-foreground">
                      No files found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground"
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

      @if (viewMode() === 'grid') {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          @for (item of files(); track item.fileId) {
            <button
              type="button"
              (dblclick)="openItem(item)"
              class="group relative rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 text-left hover:border-teal-500/50 hover:shadow-md transition-all"
            >
              <div
                class="w-14 h-14 flex items-center justify-center rounded-lg"
                [class]="iconBgFor(item)"
              >
                <ng-icon
                  [name]="iconFor(item)"
                  class="h-7 w-7"
                  [class]="iconColorFor(item)"
                ></ng-icon>
              </div>
              <span class="text-xs font-medium text-center truncate w-full">{{ item.name }}</span>
              @if (item.isShared) {
                <ng-icon name="lucideUsers" class="h-3 w-3 text-muted-foreground" />
              }
              <span class="text-xs text-muted-foreground">{{ displaySize(item) }}</span>
            </button>
          }
        </div>
      }

      @if (detailsItem(); as d) {
        <div
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          (click)="detailsItem.set(null)"
        >
          <div
            class="max-w-md w-full rounded-lg border border-border bg-card p-6 shadow-lg"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-semibold mb-2">{{ d.name }}</h2>
            <dl class="space-y-2 text-sm text-muted-foreground">
              <div>
                <dt class="inline font-medium text-foreground">Type:</dt>
                {{ d.itemKind }}
              </div>
              <div>
                <dt class="inline font-medium text-foreground">Size:</dt>
                {{ displaySize(d) }}
              </div>
              <div>
                <dt class="inline font-medium text-foreground">Modified:</dt>
                {{ d.lastModifiedAt ?? d.createdAt | date: 'medium' }}
              </div>
              <div>
                <dt class="inline font-medium text-foreground">Shared:</dt>
                {{ d.isShared ? 'Yes' : 'No' }}
              </div>
            </dl>
            <button
              hlmBtn
              class="mt-4 w-full"
              variant="outline"
              type="button"
              (click)="detailsItem.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      }

      <!-- Create new folder (React: file-manager-add-new-dropdown Dialog) -->
      @if (createFolderOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          (click)="closeCreateFolderModal()"
        >
          <div
            class="relative w-full max-w-[400px] rounded-lg border border-border bg-background p-6 shadow-xl"
            (click)="$event.stopPropagation()"
          >
            <button
              type="button"
              class="absolute end-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              (click)="closeCreateFolderModal()"
              aria-label="Close"
            >
              <ng-icon name="lucideX" class="h-4 w-4" />
            </button>
            <h2 class="text-xl font-semibold text-foreground pe-10">Create new folder</h2>
            <div class="mt-6 space-y-2">
              <label for="new-folder-name" class="text-sm font-medium text-foreground">
                Name of the folder<span class="text-destructive">*</span>
              </label>
              <input
                id="new-folder-name"
                hlmInput
                type="text"
                class="w-full border-teal-600/35 focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-500/25"
                [ngModel]="newFolderName()"
                (ngModelChange)="newFolderName.set($event)"
                (keydown.enter)="submitCreateFolder()"
                placeholder="Enter folder name"
                autofocus
              />
              @if (newFolderName().trim()) {
                <p class="text-xs text-muted-foreground">
                  Folder will be created as: &quot;{{ newFolderName().trim() }}&quot;
                </p>
              }
            </div>
            <div class="mt-6 flex justify-end gap-3 pt-2">
              <button hlmBtn variant="outline" type="button" (click)="closeCreateFolderModal()">
                Cancel
              </button>
              <button
                hlmBtn
                type="button"
                class="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                [disabled]="!newFolderName().trim()"
                (click)="submitCreateFolder()"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class MyFilesComponent {
  private readonly _fileService = inject(FileManagerService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly viewMode = signal<FileViewMode>('list');
  readonly breadcrumbs = signal<{ id: string; name: string }[]>([]);
  readonly files = signal<FileItem[]>([]);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly searchValue = signal('');
  readonly itemKindFilter = signal<FileItemKind | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly sortDesc = signal(true);
  readonly typePanelOpen = signal(false);
  readonly datePanelOpen = signal(false);
  readonly addMenuOpen = signal(false);
  readonly rowMenuId = signal<string | null>(null);
  readonly detailsItem = signal<FileItem | null>(null);
  readonly createFolderOpen = signal(false);
  readonly newFolderName = signal('');
  readonly uploadOpen = signal(false);
  readonly pendingUploads = signal<File[]>([]);
  readonly uploading = signal(false);
  readonly renameOpen = signal(false);
  readonly renamingItem = signal<FileItem | null>(null);
  readonly renameDraft = signal('');
  readonly renameError = signal('');

  readonly pageSizeOptions = [10, 25, 50];
  readonly typeOptions: { value: FileItemKind | ''; label: string }[] = [
    { value: '', label: 'All types' },
    { value: 'Folder', label: 'Folder' },
    { value: 'File', label: 'File' },
    { value: 'Image', label: 'Image' },
    { value: 'Audio', label: 'Audio' },
    { value: 'Video', label: 'Video' },
  ];

  private _searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize()) || 1)
  );

  readonly typeFilterLabel = computed(() => {
    const v = this.itemKindFilter();
    if (!v) return 'All types';
    return v;
  });

  constructor() {
    document.addEventListener('click', this._closeMenus);
    this._destroyRef.onDestroy(() => document.removeEventListener('click', this._closeMenus));

    this._route.paramMap
      .pipe(startWith(this._route.snapshot.paramMap), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.breadcrumbs.set(
          this._parseBreadcrumbParam(this._route.snapshot.paramMap.get('folderId'))
        );
        this.currentPage.set(1);
        this.load();
      });
  }

  private readonly _closeMenus = (): void => {
    this.typePanelOpen.set(false);
    this.datePanelOpen.set(false);
    this.addMenuOpen.set(false);
    this.rowMenuId.set(null);
    this.createFolderOpen.set(false);
    this.newFolderName.set('');
  };

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
    document.querySelector<HTMLInputElement>('app-my-files input[type=file]')?.click();
  }

  removePendingUpload(f: File): void {
    this.pendingUploads.update((list) => list.filter((x) => x !== f));
  }

  confirmUpload(): void {
    const parent = this._folderId();
    const files = this.pendingUploads();
    if (files.length === 0) return;
    this.uploading.set(true);
    let remaining = files.length;
    for (const file of files) {
      this._fileService.uploadFile({ file, parentId: parent }).subscribe({
        next: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.uploading.set(false);
            this.closeUploadModal();
            this.load();
          }
        },
        error: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.uploading.set(false);
            this.closeUploadModal();
            this.load();
          }
        },
      });
    }
  }

  closeRenameModal(): void {
    this.renameOpen.set(false);
    this.renamingItem.set(null);
    this.renameDraft.set('');
    this.renameError.set('');
  }

  confirmRename(): void {
    const it = this.renamingItem();
    if (!it) return;
    const next = (this.renameDraft() ?? '').trim();
    if (!next) {
      this.renameError.set('Name is required.');
      return;
    }
    if (next === it.name) {
      this.closeRenameModal();
      return;
    }
    this.files.update((list) => list.map((f) => (f.fileId === it.fileId ? { ...f, name: next } : f)));
    this.closeRenameModal();
  }

  private _parseBreadcrumbParam(folderId: string | null): { id: string; name: string }[] {
    if (!folderId) return [];
    const chain = folderId.split('/');
    const out: { id: string; name: string }[] = [];
    let acc = '';
    for (const seg of chain) {
      if (!seg) continue;
      acc = acc ? `${acc}/${seg}` : seg;
      out.push({ id: acc, name: seg });
    }
    return out;
  }

  private _folderId(): string | undefined {
    const raw = this._route.snapshot.paramMap.get('folderId');
    return raw ?? undefined;
  }

  onSearchChange(v: string): void {
    this.searchValue.set(v);
    if (this._searchDebounce) clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => {
      this.currentPage.set(1);
      this.load();
    }, 400);
  }

  setItemKindFilter(value: FileItemKind | ''): void {
    this.itemKindFilter.set(value);
    this.typePanelOpen.set(false);
    this.currentPage.set(1);
    this.load();
  }

  setDateFrom(v: string): void {
    this.dateFrom.set(v);
    this.currentPage.set(1);
    this.load();
  }

  setDateTo(v: string): void {
    this.dateTo.set(v);
    this.currentPage.set(1);
    this.load();
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.datePanelOpen.set(false);
    this.currentPage.set(1);
    this.load();
  }

  toggleSort(): void {
    this.sortDesc.update((v) => !v);
    this.load();
  }

  setPageSize(n: number): void {
    this.pageSize.set(Number(n));
    this.currentPage.set(1);
    this.load();
  }

  goFirst(): void {
    this.currentPage.set(1);
    this.load();
  }
  goPrev(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
    this.load();
  }
  goNext(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
    this.load();
  }
  goLast(): void {
    this.currentPage.set(this.totalPages());
    this.load();
  }

  goRoot(): void {
    this._router.navigate(['/file-manager/my-files']);
  }

  goFolder(id: string): void {
    this._router.navigate(['/file-manager/my-files', id]);
  }

  openItem(item: FileItem): void {
    if (item.itemKind === 'Folder') {
      const base = this._folderId();
      const next = base ? `${base}/${item.fileId}` : item.fileId;
      this._router.navigate(['/file-manager/my-files', next]);
    }
  }

  toggleRowMenu(id: string): void {
    this.rowMenuId.update((cur) => (cur === id ? null : id));
  }

  openDetails(item: FileItem): void {
    this.detailsItem.set(item);
    this.rowMenuId.set(null);
  }

  renameItem(item: FileItem): void {
    this.rowMenuId.set(null);
    this.renameError.set('');
    this.renamingItem.set(item);
    this.renameDraft.set(item.name);
    this.renameOpen.set(true);
  }

  deleteItem(item: FileItem): void {
    this.rowMenuId.set(null);
    this._fileService.deleteFile(item.fileId).subscribe(() => this.load());
  }

  openCreateFolderModal(): void {
    this.addMenuOpen.set(false);
    this.newFolderName.set('');
    this.createFolderOpen.set(true);
  }

  closeCreateFolderModal(): void {
    this.createFolderOpen.set(false);
    this.newFolderName.set('');
  }

  submitCreateFolder(): void {
    const name = this.newFolderName().trim();
    if (!name) return;
    this._fileService.createFolder({ name, parentId: this._folderId() }).subscribe(() => {
      this.closeCreateFolderModal();
      this.load();
    });
  }

  triggerUpload(): void {
    this.addMenuOpen.set(false);
    this.openUploadModal();
    this.pickFiles();
  }

  onFilesPicked(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.pendingUploads.set(files);
    input.value = '';
  }

  displaySize(item: FileItem): string {
    return item.sizeLabel ?? (item.size ? this._fmtBytes(item.size) : '—');
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

  load(): void {
    const search = this.searchValue();
    this._fileService
      .getFiles({
        parentId: this._folderId(),
        search: search || undefined,
        itemKind: this.itemKindFilter() || undefined,
        dateFrom: this.dateFrom() || undefined,
        dateTo: this.dateTo() || undefined,
        sortLastModified: this.sortDesc() ? 'desc' : 'asc',
        pageNo: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe((res) => {
        this.files.set(res.items);
        this.totalCount.set(res.totalCount);
      });
  }

  private _fmtBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  formatBytes(bytes: number): string {
    return this._fmtBytes(bytes);
  }
}
