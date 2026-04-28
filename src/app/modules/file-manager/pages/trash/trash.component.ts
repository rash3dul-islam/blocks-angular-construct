// ─── Trash Component ──────────────────────────────────────────────────────────
// Mirrors: react_Constract/src/modules/file-manager/pages/trash/trash.tsx
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrash2,
  lucideRefreshCw,
  lucideFolder,
  lucideFile,
  lucideFileText,
  lucideImage,
  lucideAlertTriangle,
  lucideLayoutGrid,
  lucideAlignJustify,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { FileManagerService } from '../../services/file-manager.service';
import { FileItem, FileViewMode } from '../../../../models/file-manager.model';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, HlmButton, HlmInput],
  viewProviders: [
    provideIcons({
      lucideTrash2,
      lucideRefreshCw,
      lucideFolder,
      lucideFile,
      lucideFileText,
      lucideImage,
      lucideAlertTriangle,
      lucideLayoutGrid,
      lucideAlignJustify,
    }),
  ],
  template: `
    <div class="p-6 flex flex-col gap-4 min-h-0 text-foreground">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Trash</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Items in trash will be permanently deleted after 30 days.
          </p>
        </div>
      </div>

      <!-- Toolbar (React TrashHeaderToolbar - simplified) -->
      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div class="relative w-full lg:flex-1 lg:max-w-md min-w-0">
          <input
            hlmInput
            [(ngModel)]="searchQuery"
            placeholder="Search trash..."
            class="h-9 w-full rounded-lg text-sm"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
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

          @if (selectedIds().size > 0) {
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              class="h-9"
              (click)="restoreSelected()"
            >
              Restore selected ({{ selectedIds().size }})
            </button>
          }

          @if (files().length > 0) {
            <button
              hlmBtn
              variant="destructive"
              size="sm"
              type="button"
              class="h-9"
              (click)="emptyTrash()"
            >
              Empty Trash
            </button>
          }
        </div>
      </div>

      <!-- ── Warning Banner ─────────────────────────────────────── -->
      <div
        class="flex items-start gap-3 p-4 rounded-lg bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      >
        <ng-icon
          name="lucideAlertTriangle"
          size="18"
          class="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
        ></ng-icon>
        <p class="text-sm text-amber-700 dark:text-amber-300">
          Files in trash are still taking up storage space. Permanently delete them to free up
          space.
        </p>
      </div>

      @if (filteredFiles().length === 0) {
        <div class="flex flex-col items-center justify-center h-full min-h-[320px] p-12 text-center">
          <div class="text-6xl mb-6">🗑️</div>
          <h3 class="text-xl font-medium text-foreground mb-2">Trash is empty</h3>
          <p class="text-muted-foreground max-w-sm">
            All items have been permanently deleted
          </p>
        </div>
      } @else {
        @if (viewMode() === 'list') {
          <div class="rounded-lg border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[320px]">
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[640px]">
                <thead class="bg-muted/40 border-b border-border">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <input type="checkbox" [checked]="allSelected()" (change)="toggleAll($event)" />
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Name
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Type
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Deleted
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of filteredFiles(); track item.fileId) {
                    <tr class="hover:bg-muted/30 transition-colors">
                      <td class="px-4 py-3">
                        <input
                          type="checkbox"
                          [checked]="isSelected(item.fileId)"
                          (change)="toggleSelected(item.fileId, $event)"
                        />
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3 min-w-0">
                          <ng-icon [name]="getFileIcon(item)" class="h-4 w-4 text-muted-foreground"></ng-icon>
                          <span class="font-medium text-muted-foreground line-through truncate">{{ item.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-muted-foreground capitalize">{{ item.itemKind }}</td>
                      <td class="px-4 py-3 text-muted-foreground text-xs">
                        {{ item.updatedAt ?? item.createdAt | date: 'mediumDate' }}
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            hlmBtn
                            variant="ghost"
                            size="sm"
                            class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                            (click)="restoreFile(item)"
                          >
                            <ng-icon name="lucideRefreshCw" class="h-3.5 w-3.5"></ng-icon>
                            Restore
                          </button>
                          <button
                            hlmBtn
                            variant="ghost"
                            size="sm"
                            class="flex items-center gap-1 text-xs text-destructive"
                            (click)="permanentDelete(item)"
                          >
                            <ng-icon name="lucideTrash2" class="h-3.5 w-3.5"></ng-icon>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            @for (item of filteredFiles(); track item.fileId) {
              <div class="group relative rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
                <div class="flex items-start justify-between gap-2">
                  <input
                    type="checkbox"
                    [checked]="isSelected(item.fileId)"
                    (change)="toggleSelected(item.fileId, $event)"
                  />
                  <div class="flex items-center gap-1">
                    <button
                      hlmBtn
                      variant="ghost"
                      size="sm"
                      class="h-8 px-2 text-xs text-emerald-600 dark:text-emerald-400"
                      (click)="restoreFile(item)"
                    >
                      Restore
                    </button>
                    <button
                      hlmBtn
                      variant="ghost"
                      size="sm"
                      class="h-8 px-2 text-xs text-destructive"
                      (click)="permanentDelete(item)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-center pt-2">
                  <ng-icon [name]="getFileIcon(item)" class="h-10 w-10 text-muted-foreground"></ng-icon>
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-medium text-muted-foreground line-through truncate">{{ item.name }}</div>
                  <div class="text-[11px] text-muted-foreground mt-0.5">
                    Deleted {{ item.updatedAt ?? item.createdAt | date: 'mediumDate' }}
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class TrashComponent implements OnInit {
  private readonly fileService = inject(FileManagerService);

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly files = signal<FileItem[]>([]);
  readonly viewMode = signal<FileViewMode>('list');
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  searchQuery = '';

  readonly filteredFiles = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.files();
    return this.files().filter((f) => f.name.toLowerCase().includes(q));
  });

  readonly allSelected = computed(() => {
    const ids = this.selectedIds();
    const list = this.filteredFiles();
    return list.length > 0 && list.every((x) => ids.has(x.fileId));
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.fileService.getFiles({ pageNo: 1, pageSize: 50 }).subscribe((res) => {
      // Simulate deleted files by marking them
      const deletedItems = res.items.map((f) => ({ ...f, isDeleted: true })).slice(0, 3);
      this.files.set(deletedItems);
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  restoreFile(item: FileItem): void {
    this.fileService.restoreFile(item.fileId).subscribe(() => {
      this.files.update((list) => list.filter((f) => f.fileId !== item.fileId));
      this.selectedIds.update((s) => {
        const next = new Set(s);
        next.delete(item.fileId);
        return next;
      });
    });
  }

  permanentDelete(item: FileItem): void {
    this.fileService.deleteFile(item.fileId).subscribe(() => {
      this.files.update((list) => list.filter((f) => f.fileId !== item.fileId));
      this.selectedIds.update((s) => {
        const next = new Set(s);
        next.delete(item.fileId);
        return next;
      });
    });
  }

  emptyTrash(): void {
    const confirmed = confirm('Permanently delete all items in trash? This cannot be undone.');
    if (!confirmed) return;
    const ids = this.files().map((f) => f.fileId);
    ids.forEach((id) => this.fileService.deleteFile(id).subscribe());
    this.files.set([]);
    this.selectedIds.set(new Set());
  }

  restoreSelected(): void {
    const selected = Array.from(this.selectedIds());
    selected.forEach((id) => this.fileService.restoreFile(id).subscribe());
    this.files.update((list) => list.filter((f) => !this.selectedIds().has(f.fileId)));
    this.selectedIds.set(new Set());
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelected(id: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.selectedIds.update((s) => {
      const next = new Set(s);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  toggleAll(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (!checked) {
      this.selectedIds.set(new Set());
      return;
    }
    const next = new Set<string>();
    this.filteredFiles().forEach((f) => next.add(f.fileId));
    this.selectedIds.set(next);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getFileIcon(item: FileItem): string {
    if (item.type === 'folder') return 'lucideFolder';
    const mime = item.mimeType ?? '';
    if (mime.startsWith('image/')) return 'lucideImage';
    if (mime.includes('pdf') || mime.includes('text')) return 'lucideFileText';
    return 'lucideFile';
  }

  getIconColor(_item: FileItem): string {
    return 'text-muted-foreground';
  }
}
