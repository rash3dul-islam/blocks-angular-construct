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
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
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
    }),
  ],
  template: `
    <div class="p-6 flex flex-col gap-4 min-h-0 text-foreground">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <h1 class="text-2xl font-bold tracking-tight">Share with me</h1>
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

      <!-- Toolbar (React: SharedWithMeHeaderToolbar) -->
      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div class="relative w-full lg:flex-1 lg:max-w-md min-w-0">
          <ng-icon
            name="lucideSearch"
            class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            hlmInput
            [(ngModel)]="searchQuery"
            placeholder="Search shared files..."
            class="h-9 w-full rounded-lg pl-9 text-sm"
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

          <div class="relative">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              class="h-9 border-dashed gap-1.5 text-sm"
              (click)="$event.stopPropagation(); datePanelOpen.update((v) => !v)"
            >
              <ng-icon name="lucidePlusCircle" class="h-3.5 w-3.5 shrink-0 opacity-70" />
              Modified Date
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
                <button hlmBtn variant="ghost" size="sm" type="button" class="text-xs" (click)="clearDates()">
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
                  (click)="addMenuOpen.set(false); openUploadModal(); pickFiles()"
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

      <input type="file" multiple class="hidden" (change)="onFilesPicked($event)" />

      @if (uploadOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          (click)="closeUploadModal()"
        >
          <div
            class="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-semibold">Upload files</h2>
            <p class="text-sm text-muted-foreground mt-1">Select one or more files to upload.</p>

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
                        <div class="text-xs text-muted-foreground">{{ f.size }} bytes</div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="mt-6 flex items-center justify-end gap-2">
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
          @for (item of filteredFiles(); track item.fileId) {
            <div
              cdkDrag
              (dblclick)="onItemDoubleClick(item)"
              class="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <div
                class="w-14 h-14 flex items-center justify-center rounded-lg"
                [class]="getIconBg(item)"
              >
                <ng-icon
                  [name]="getFileIcon(item)"
                  size="28"
                  [class]="getIconColor(item)"
                ></ng-icon>
              </div>
              <span
                class="text-xs text-gray-700 dark:text-gray-300 font-medium text-center truncate w-full"
                >{{ item.name }}</span
              >
              <div class="flex items-center gap-1">
                <ng-icon name="lucideShare2" size="10" class="text-indigo-400"></ng-icon>
                <span class="text-xs text-indigo-400">Shared</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── List View ───────────────────────────────────────────── -->
      @if (viewMode() === 'list') {
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Shared
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
              </tr>
            </thead>
            <tbody cdkDropList (cdkDropListDropped)="onDrop($event)">
              @for (item of filteredFiles(); track item.fileId) {
                <tr
                  cdkDrag
                  (dblclick)="onItemDoubleClick(item)"
                  class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                >
                  <td class="px-6 py-3 flex items-center gap-3">
                    <ng-icon
                      [name]="getFileIcon(item)"
                      size="18"
                      [class]="getIconColor(item)"
                    ></ng-icon>
                    <span class="font-medium text-gray-800 dark:text-gray-200 truncate max-w-xs">{{
                      item.name
                    }}</span>
                  </td>
                  <td class="px-6 py-3 text-gray-500 capitalize">{{ item.type }}</td>
                  <td class="px-6 py-3">
                    <span
                      class="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400"
                    >
                      <ng-icon name="lucideShare2" size="12"></ng-icon> Shared
                    </span>
                  </td>
                  <td class="px-6 py-3 text-gray-500 text-xs">
                    {{ item.createdAt | date: 'mediumDate' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
  searchQuery = '';
  readonly itemKindFilter = signal<FileItemKind | ''>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly typePanelOpen = signal(false);
  readonly datePanelOpen = signal(false);
  readonly addMenuOpen = signal(false);
  readonly uploadOpen = signal(false);
  readonly pendingUploads = signal<File[]>([]);
  readonly uploading = signal(false);
  readonly createFolderOpen = signal(false);
  readonly newFolderName = signal('');

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
    const q = this.searchQuery.toLowerCase();
    const kind = this.itemKindFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    let out = this.files();
    if (q) out = out.filter((f) => f.name.toLowerCase().includes(q));
    if (kind) out = out.filter((f) => f.itemKind === kind);
    if (from && to) {
      const fromMs = new Date(from + 'T00:00:00').getTime();
      const toMs = new Date(to + 'T23:59:59.999').getTime();
      out = out.filter((f) => {
        const t = new Date((f.lastModifiedAt ?? f.createdAt) as any).getTime();
        return t >= fromMs && t <= toMs;
      });
    }
    return out;
  });

  readonly typeFilterLabel = computed(() => (this.itemKindFilter() ? this.itemKindFilter() : 'Types'));

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
  }

  setDateFrom(v: string): void {
    this.dateFrom.set(v);
  }

  setDateTo(v: string): void {
    this.dateTo.set(v);
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.datePanelOpen.set(false);
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
}
