// ─── App Sidebar Component ─────────────────────────────────────────────────────
// Mirrors: react_Constract/src/components/core/app-sidebar/app-sidebar.tsx
// — `MenuSection` ×2: CLOUD INTEGRATED vs DESIGN ONLY (`isIntegrated` on menu items)

import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideChartNoAxesCombined,
  lucideUsers,
  lucideStore,
  lucideReceiptText,
  lucidePresentation,
  lucideInbox,
  lucideCalendar,
  lucideFileClock,
  lucideHistory,
  lucideMessageSquareText,
  lucideFolder,
  lucideFile,
  lucideShare2,
  lucideTrash2,
  lucideSearchX,
  lucideTriangleAlert,
  lucideChevronRight,
  lucideChevronLeft,
  lucideChevronDown,
} from '@ng-icons/lucide';
import { AuthStore } from '../../../state/store/auth/auth.store';
import { SIDEBAR_MENU, SidebarMenuItem } from '../../../constant/sidebar-menu.constant';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, NgFor, NgIf, NgIconComponent],
  viewProviders: [
    provideIcons({
      lucideLayoutDashboard,
      lucideChartNoAxesCombined,
      lucideUsers,
      lucideStore,
      lucideReceiptText,
      lucidePresentation,
      lucideInbox,
      lucideCalendar,
      lucideFileClock,
      lucideHistory,
      lucideMessageSquareText,
      lucideFolder,
      lucideFile,
      lucideShare2,
      lucideTrash2,
      lucideSearchX,
      lucideTriangleAlert,
      lucideChevronRight,
      lucideChevronLeft,
      lucideChevronDown,
    }),
  ],
  template: `
    <aside
      class="fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border
             flex flex-col z-40 transition-all duration-300 ease-in-out"
      [ngClass]="collapsed ? 'w-16' : 'w-64'"
    >
      <div class="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span class="text-primary-foreground font-bold text-sm">B</span>
          </div>
          <span
            class="text-sidebar-foreground font-semibold text-xs tracking-wide whitespace-nowrap
                   transition-opacity duration-200"
            [ngClass]="collapsed ? 'opacity-0 w-0' : 'opacity-100'"
          >
            BLOCKS CONSTRUCT
          </span>
        </div>
        <button
          *ngIf="!collapsed"
          class="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60
                 hover:text-sidebar-foreground transition-colors"
          (click)="onCollapse()"
        >
          <ng-icon name="lucideChevronLeft" class="w-4 h-4" />
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-2">
        <ng-container *ngFor="let section of menuSections()">
          <p
            *ngIf="!collapsed"
            class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50"
          >
            {{ section.title }}
          </p>
          <ul class="space-y-1 mb-5 last:mb-0">
            <li *ngFor="let item of section.items">
              <ng-container *ngIf="item.children">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-sans
                         text-[#0F0F0F] hover:bg-sidebar-accent hover:text-[#0F0F0F]
                         dark:text-sidebar-foreground dark:hover:text-sidebar-accent-foreground
                         transition-colors"
                  (click)="toggleExpanded(item.label)"
                >
                  <ng-icon [name]="item.icon" class="w-4 h-4 shrink-0" />
                  <span
                    class="flex-1 truncate text-left whitespace-nowrap transition-opacity duration-200"
                    [ngClass]="collapsed ? 'opacity-0 hidden' : 'opacity-100'"
                    >{{ item.label }}</span
                  >
                  <span
                    *ngIf="!collapsed && shouldShowAdminBadge(item)"
                    class="ml-1.5 text-[10px] px-1.5 py-0 rounded border border-primary/30 bg-primary/10 text-primary font-semibold"
                    >Admin</span
                  >
                  <ng-icon
                    *ngIf="!collapsed"
                    name="lucideChevronDown"
                    class="w-3 h-3 transition-transform duration-200"
                    [ngClass]="isExpanded(item.label) ? 'rotate-180' : ''"
                  />
                </button>
                <ul
                  *ngIf="isExpanded(item.label) && !collapsed"
                  class="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-3"
                >
                  <li *ngFor="let child of item.children">
                    <a
                      [routerLink]="child.route"
                      routerLinkActive="bg-sidebar-accent text-[#0F0F0F] dark:text-sidebar-foreground font-semibold"
                      class="flex items-center gap-3 px-3 py-2 rounded-md text-base font-sans
                             text-[#0F0F0F] hover:bg-sidebar-accent hover:text-[#0F0F0F]
                             dark:text-sidebar-foreground dark:hover:text-sidebar-accent-foreground
                             transition-colors"
                    >
                      <ng-icon [name]="child.icon" class="w-4 h-4 shrink-0" />
                      <span class="truncate">{{ child.label }}</span>
                    </a>
                  </li>
                </ul>
              </ng-container>

              <ng-container *ngIf="!item.children">
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-sidebar-accent text-[#0F0F0F] dark:text-sidebar-foreground font-semibold"
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-base font-sans
                         text-[#0F0F0F] hover:bg-sidebar-accent hover:text-[#0F0F0F]
                         dark:text-sidebar-foreground dark:hover:text-sidebar-accent-foreground
                         transition-colors group"
                >
                  <ng-icon [name]="item.icon" class="w-4 h-4 shrink-0" />
                  <span
                    class="truncate whitespace-nowrap transition-opacity duration-200"
                    [ngClass]="collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'"
                    >{{ item.label }}</span
                  >
                  <span
                    *ngIf="!collapsed && shouldShowAdminBadge(item)"
                    class="ml-auto text-[10px] px-1.5 py-0 rounded border border-primary/30 bg-primary/10 text-primary font-semibold shrink-0"
                    >Admin</span
                  >
                </a>
              </ng-container>
            </li>
          </ul>
        </ng-container>
      </nav>

      <div *ngIf="collapsed" class="p-2 border-t border-sidebar-border">
        <button
          class="w-full flex items-center justify-center p-2 rounded-md
                 hover:bg-sidebar-accent text-sidebar-foreground/60
                 hover:text-sidebar-foreground transition-colors"
          (click)="onExpand()"
        >
          <ng-icon name="lucideChevronRight" class="w-4 h-4" />
        </button>
      </div>
    </aside>
  `,
})
export class AppSidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  private readonly _authStore = inject(AuthStore);

  /** Same grouping as React `integratedMenuItems` / `designOnlyMenuItems` */
  readonly menuSections = computed(() => [
    {
      title: 'CLOUD INTEGRATED',
      items: SIDEBAR_MENU.filter((i) => i.isIntegrated === true),
    },
    {
      title: 'DESIGN ONLY',
      items: SIDEBAR_MENU.filter((i) => i.isIntegrated !== true),
    },
  ]);

  private readonly _isAdmin = computed(() => this._authStore.userRoles().includes('admin'));

  shouldShowAdminBadge(item: SidebarMenuItem): boolean {
    const needsAdmin = item.roles?.includes('admin') ?? false;
    return needsAdmin && !this._isAdmin();
  }

  private readonly _expandedItems = signal<Set<string>>(new Set());

  isExpanded(label: string): boolean {
    return this._expandedItems().has(label);
  }

  toggleExpanded(label: string): void {
    this._expandedItems.update((set) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  onCollapse(): void {
    this.collapsedChange.emit(true);
  }

  onExpand(): void {
    this.collapsedChange.emit(false);
  }
}
