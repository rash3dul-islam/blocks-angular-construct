// ─── Sidebar Menu Constants ────────────────────────────────────────────────────
// Mirrors: react_Constract/src/constant/sidebar-menu.ts + app-sidebar sections
// (`CLOUD_INTEGRATED` vs `DESIGN_ONLY` via `isIntegrated`)

export interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: SidebarMenuItem[];
  roles?: string[];
  badge?: number;
  /** Same as React `MenuItem.isIntegrated` — shown under "CLOUD INTEGRATED" */
  isIntegrated?: boolean;
}

/**
 * Order matches React `menuItems` so filtering by `isIntegrated` preserves
 * IAM → Inventory → Invoices → Task Manager under integrated, and the rest under design-only.
 */
export const SIDEBAR_MENU: SidebarMenuItem[] = [
  { label: 'Dashboard', icon: 'lucideLayoutDashboard', route: '/dashboard' },
  { label: 'Finance', icon: 'lucideChartNoAxesCombined', route: '/finance', roles: ['admin'] },
  { label: 'IAM', icon: 'lucideUsers', route: '/identity-management', isIntegrated: true },
  { label: 'Inventory', icon: 'lucideStore', route: '/inventory', isIntegrated: true },
  { label: 'Invoices', icon: 'lucideReceiptText', route: '/invoices', isIntegrated: true },
  {
    label: 'Task Manager',
    icon: 'lucidePresentation',
    route: '/task-manager',
    isIntegrated: true,
  },
  { label: 'Mail', icon: 'lucideInbox', route: '/mail/inbox' },
  { label: 'Calendar', icon: 'lucideCalendar', route: '/calendar' },
  { label: 'Activity log', icon: 'lucideFileClock', route: '/activity-log' },
  { label: 'Timeline', icon: 'lucideHistory', route: '/timeline' },
  { label: 'Chat', icon: 'lucideMessageSquareText', route: '/chat' },
  {
    label: 'File Manager',
    icon: 'lucideFolder',
    route: '/file-manager/my-files',
    children: [
      { label: 'My Files', icon: 'lucideFile', route: '/file-manager/my-files' },
      { label: 'Shared With Me', icon: 'lucideShare2', route: '/file-manager/shared-files' },
      { label: 'Trash', icon: 'lucideTrash2', route: '/file-manager/trash' },
    ],
  },
  { label: 'Error 404', icon: 'lucideSearchX', route: '/404' },
  { label: 'Error 503', icon: 'lucideTriangleAlert', route: '/503' },
];
