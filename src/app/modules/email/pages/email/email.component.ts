// ─── Email Page Component ──────────────────────────────────────────────────────
// Mirrors: src/modules/email/pages/ in React project
// Three-panel layout: Sidebar | Email List | Email Detail/Compose

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf, NgFor, NgClass, DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideInbox,
  lucideSend,
  lucideFileEdit,
  lucideAlertTriangle,
  lucideTrash2,
  lucideStar,
  lucideSearch,
  lucidePencil,
  lucideRefreshCw,
  lucideChevronLeft,
  lucideChevronRight,
  lucideMoreVertical,
  lucideReply,
  lucideForward,
  lucideTag,
  lucideX,
  lucideCheck,
  lucideLoader,
  lucidePaperclip,
  lucideMail,
  lucideMailOpen,
} from '@ng-icons/lucide';
import { EmailService } from '../../services/email.service';
import { Email, EmailCategory, EmailLabel } from '../../../../models/email.model';

type MailFolder = EmailCategory | 'starred';
type EmailTab = { key: MailFolder; label: string; icon: string };
type ListFilterMode = 'all' | 'unread';

@Component({
  selector: 'app-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgClass, DatePipe, UpperCasePipe, FormsModule, NgIconComponent],
  viewProviders: [
    provideIcons({
      lucideInbox,
      lucideSend,
      lucideFileEdit,
      lucideAlertTriangle,
      lucideTrash2,
      lucideStar,
      lucideSearch,
      lucidePencil,
      lucideRefreshCw,
      lucideChevronLeft,
      lucideChevronRight,
      lucideMoreVertical,
      lucideReply,
      lucideForward,
      lucideTag,
      lucideX,
      lucideCheck,
      lucideLoader,
      lucidePaperclip,
      lucideMail,
      lucideMailOpen,
    }),
  ],
  template: `
    <div class="-m-6 flex h-full flex-col bg-background">
      <!-- Top header (React-like) -->
      <div class="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <h2 class="text-2xl font-bold tracking-tight text-foreground">Mail</h2>
        <div class="relative w-[280px] md:w-[320px]">
          <ng-icon
            name="lucideSearch"
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            [(ngModel)]="globalSearch"
            (ngModelChange)="onGlobalSearchChanged()"
            placeholder="Search by name and subject"
            class="h-9 w-full rounded-md border border-input bg-muted/30 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
      <!-- ── Left: Category sidebar ─────────────────────────────────────── -->
      <aside class="w-52 border-r border-border flex flex-col shrink-0">
        <!-- Compose button -->
        <div class="p-3">
          <button
            (click)="openCompose()"
            class="w-full flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground
                   rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ng-icon name="lucidePencil" class="w-4 h-4" />
            Compose
          </button>
        </div>

        <!-- Categories -->
        <nav class="flex-1 px-2 pb-2 space-y-0.5">
          <button
            *ngFor="let tab of tabs"
            (click)="selectFolder(tab.key)"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
            [ngClass]="
              activeFolder() === tab.key
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            "
          >
            <ng-icon [name]="tab.icon" class="w-4 h-4" />
            <span class="flex-1 text-left">{{ tab.label }}</span>
            @if (tab.key !== 'starred' && unreadCount(tab.key) > 0) {
              <span
                class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
              >
                {{ unreadCount(tab.key) }}
              </span>
            }
          </button>

          <!-- Labels -->
          <div class="pt-3">
            <p class="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Labels
            </p>
            <div
              *ngFor="let label of labels()"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer
                        text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <span class="w-2 h-2 rounded-full shrink-0" [style.background]="label.color"></span>
              {{ label.name }}
            </div>
          </div>
        </nav>
      </aside>

      <!-- ── Middle: Email list ──────────────────────────────────────────── -->
      <div class="w-80 border-r border-border flex flex-col shrink-0">
        <!-- Header: folder title + filters + bulk toolbar -->
        <div class="border-b border-border">
          <div class="flex items-center justify-between px-4 py-2">
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-border"
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll()"
                />
                Select all
              </label>
              <div class="flex items-center overflow-hidden rounded-md border border-border bg-background">
                <button
                  type="button"
                  class="px-3 py-1 text-xs font-semibold"
                  [ngClass]="filterMode() === 'all' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
                  (click)="filterMode.set('all')"
                >
                  All
                </button>
                <button
                  type="button"
                  class="px-3 py-1 text-xs font-semibold"
                  [ngClass]="filterMode() === 'unread' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
                  (click)="filterMode.set('unread')"
                >
                  Unread
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="refresh()"
                class="p-1 rounded text-muted-foreground hover:text-foreground"
                aria-label="Refresh"
              >
                <ng-icon name="lucideRefreshCw" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Keep local list search, but make it minimal (React uses top search). -->
          <div class="px-3 pb-3">
            <input
              [(ngModel)]="searchQuery"
              placeholder="Search emails..."
              class="h-8 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          @if (checkedEmailIds().length > 0) {
            <div class="flex items-center gap-2 px-3 pb-3">
              <span class="text-xs font-semibold text-foreground">
                {{ checkedEmailIds().length }} selected
              </span>
              <button
                type="button"
                class="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                (click)="bulkMarkRead(true)"
              >
                <ng-icon name="lucideMailOpen" class="h-4 w-4" />
                Mark read
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                (click)="bulkMarkRead(false)"
              >
                <ng-icon name="lucideMail" class="h-4 w-4" />
                Mark unread
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                (click)="bulkMoveToSpam()"
              >
                <ng-icon name="lucideAlertTriangle" class="h-4 w-4" />
                Spam
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                (click)="bulkMoveToTrash()"
              >
                <ng-icon name="lucideTrash2" class="h-4 w-4" />
                Delete
              </button>
            </div>
          }
        </div>

        <!-- Email list -->
        <div class="flex-1 overflow-y-auto">
          <div *ngIf="isLoading()" class="flex items-center justify-center p-8">
            <ng-icon name="lucideLoader" class="w-6 h-6 animate-spin text-muted-foreground" />
          </div>

          <div
            *ngIf="!isLoading() && filteredEmails().length === 0"
            class="text-center text-muted-foreground p-8 text-sm"
          >
            No emails in this folder.
          </div>

          <div
            *ngFor="let email of filteredEmails()"
            (click)="selectEmail(email)"
            class="border-b border-border px-4 py-3 cursor-pointer transition-colors"
            [ngClass]="{
              'bg-accent/30': selectedEmail()?.emailId === email.emailId,
              'hover:bg-accent/20': selectedEmail()?.emailId !== email.emailId,
              'font-medium': !email.isRead,
            }"
          >
            <!-- Sender + date -->
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-border"
                  [checked]="isChecked(email.emailId)"
                  (click)="$event.stopPropagation()"
                  (change)="toggleChecked(email.emailId)"
                  aria-label="Select email"
                />
                <span
                  class="text-sm truncate"
                  [ngClass]="!email.isRead ? 'text-foreground font-semibold' : 'text-foreground'"
                >
                  {{ email.from.name || email.from.email }}
                </span>
              </div>
              <span class="text-xs text-muted-foreground shrink-0 ml-2">
                {{ email.createdAt | date: 'MMM d' }}
              </span>
            </div>

            <!-- Subject -->
            <div class="flex items-center gap-1.5">
              <ng-icon
                *ngIf="email.isStarred"
                name="lucideStar"
                class="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400"
              />
              <span
                class="text-sm truncate"
                [ngClass]="!email.isRead ? 'text-foreground' : 'text-muted-foreground'"
              >
                {{ email.subject }}
              </span>
            </div>

            <!-- Preview -->
            <p class="text-xs text-muted-foreground truncate mt-0.5">{{ email.bodyText }}</p>

            <!-- Labels -->
            <div *ngIf="email.labels?.length" class="flex gap-1 mt-1.5 flex-wrap">
              <span
                *ngFor="let label of email.labels"
                class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs text-white"
                [style.background]="label.color"
              >
                {{ label.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="border-t border-border px-4 py-2 flex items-center justify-between">
          <span class="text-xs text-muted-foreground"
            >1–{{ filteredEmails().length }} of {{ totalCount() }}</span
          >
          <div class="flex gap-1">
            <button
              type="button"
              class="mr-2 rounded px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              (click)="toggleSelectAll()"
            >
              {{ isAllSelected() ? 'Clear' : 'Select all' }}
            </button>
            <button
              class="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-40"
              [disabled]="page() <= 1"
              (click)="prevPage()"
            >
              <ng-icon name="lucideChevronLeft" class="w-4 h-4" />
            </button>
            <button class="p-1 rounded hover:bg-accent text-muted-foreground" (click)="nextPage()">
              <ng-icon name="lucideChevronRight" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── Right: Email detail ─────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <ng-template [ngIf]="true">
          <!-- Empty state -->
          <div
            *ngIf="!selectedEmail()"
            class="flex-1 flex flex-col items-center justify-center text-muted-foreground"
          >
            <ng-icon name="lucideInbox" class="w-12 h-12 mb-3" />
            <p class="text-sm">Select an email to read</p>
          </div>

          <!-- Email content -->
          <ng-container *ngIf="selectedEmail() as email">
            <!-- Email header/actions -->
            <div class="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="truncate text-base font-semibold text-foreground">{{ email.subject }}</h3>
                @if (email.labels?.length) {
                  <span
                    class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {{ email.labels?.[0]?.name }}
                    <span class="text-muted-foreground">×</span>
                  </span>
                }
              </div>
              <button
                (click)="selectedEmail.set(null)"
                class="p-1.5 rounded-md hover:bg-accent text-muted-foreground md:hidden"
              >
                <ng-icon name="lucideChevronLeft" class="w-4 h-4" />
              </button>
              <div class="flex items-center gap-2">
                <button
                  (click)="toggleStar(email)"
                  class="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <ng-icon
                    name="lucideStar"
                    class="w-4 h-4"
                    [ngClass]="email.isStarred ? 'fill-amber-400 text-amber-400' : ''"
                  />
                </button>
                <button
                  (click)="replyEmail(email)"
                  class="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <ng-icon name="lucideReply" class="w-4 h-4" />
                </button>
                <button
                  (click)="forwardEmail(email)"
                  class="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <ng-icon name="lucideForward" class="w-4 h-4" />
                </button>
                <button
                  (click)="trashEmail(email)"
                  class="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <ng-icon name="lucideTrash2" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Email body -->
            <div class="flex-1 overflow-y-auto p-6">
              <!-- From/To meta -->
              <div class="flex items-start gap-3 mb-6">
                <div
                  class="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0"
                >
                  <span class="text-primary-foreground text-sm font-medium">
                    {{ email.from.name?.[0] || email.from.email[0] | uppercase }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-medium text-foreground text-sm">{{
                        email.from.name || email.from.email
                      }}</span>
                      <span class="text-muted-foreground text-xs ml-1"
                        >&lt;{{ email.from.email }}&gt;</span
                      >
                    </div>
                    <span class="text-xs text-muted-foreground shrink-0 ml-2">
                      {{ email.createdAt | date: 'MMM d, y, h:mm a' }}
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    To: {{ email.to.map((t) => t.email).join(', ') }}
                  </p>
                </div>
              </div>

              <!-- Body -->
              <div
                class="prose prose-sm max-w-none text-foreground leading-relaxed"
                [innerHTML]="email.body"
              ></div>

              <!-- Attachments -->
              <div *ngIf="email.attachments?.length" class="mt-6 pt-4 border-t border-border">
                <p class="text-sm font-medium text-foreground mb-2">Attachments</p>
                <div class="flex flex-wrap gap-2">
                  <div
                    *ngFor="let att of email.attachments"
                    class="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-accent cursor-pointer"
                  >
                    <ng-icon name="lucidePaperclip" class="w-4 h-4" />
                    {{ att.fileName }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom reply actions (React-like) -->
            <div class="border-t border-border bg-background px-6 py-3">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  (click)="replyEmail(email)"
                >
                  <ng-icon name="lucideReply" class="h-4 w-4" />
                  Reply
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  (click)="replyAllEmail(email)"
                >
                  <ng-icon name="lucideReply" class="h-4 w-4" />
                  Reply All
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  (click)="forwardEmail(email)"
                >
                  <ng-icon name="lucideForward" class="h-4 w-4" />
                  Forward
                </button>
              </div>
            </div>
          </ng-container>
        </ng-template>
      </div>

      <!-- Floating compose panel (React-like) -->
      @if (composeOpen()) {
        <div class="fixed bottom-4 right-4 z-50 w-[520px] max-w-[92vw] rounded-md border border-border bg-background shadow-xl">
          <div class="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
            <div class="text-sm font-semibold text-foreground">New message</div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <button type="button" class="p-1 hover:text-foreground" (click)="composeOpen.set(false)">
                <ng-icon name="lucideX" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="p-4">
            <div class="flex items-center justify-between gap-3 border-b border-border pb-2">
              <div class="text-sm text-muted-foreground w-10">To</div>
              <input [(ngModel)]="composeTo" type="email" class="flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
              <div class="flex items-center gap-3 text-xs text-primary">
                <button type="button" class="hover:underline" (click)="showCc = !showCc">Cc</button>
                <button type="button" class="hover:underline" (click)="showBcc = !showBcc">Bcc</button>
              </div>
            </div>

            @if (showCc) {
              <div class="mt-2 flex items-center gap-3 border-b border-border pb-2">
                <div class="text-sm text-muted-foreground w-10">Cc</div>
                <input [(ngModel)]="composeCc" type="text" class="flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
              </div>
            }

            @if (showBcc) {
              <div class="mt-2 flex items-center gap-3 border-b border-border pb-2">
                <div class="text-sm text-muted-foreground w-10">Bcc</div>
                <input [(ngModel)]="composeBcc" type="text" class="flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
              </div>
            }

            <div class="mt-2 flex items-center gap-3 border-b border-border pb-2">
              <div class="text-sm text-muted-foreground w-10">Subject</div>
              <input [(ngModel)]="composeSubject" type="text" class="flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
            </div>

            <div class="mt-3">
              <textarea
                [(ngModel)]="composeBody"
                class="h-40 w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              ></textarea>
            </div>

            <div class="mt-4 flex items-center justify-end gap-3">
              <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent" (click)="discardCompose()">
                Discard
              </button>
              <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90" (click)="sendEmail()">
                Send
              </button>
            </div>
          </div>
        </div>
      }
      </div>
    </div>
  `,
})
export class EmailComponent implements OnInit {
  private readonly _emailService = inject(EmailService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  // ── State signals ──────────────────────────────────────────────────────────
  readonly activeFolder = signal<MailFolder>('inbox');
  readonly emails = signal<Email[]>([]);
  readonly selectedEmail = signal<Email | null>(null);
  readonly isLoading = signal(false);
  readonly composeOpen = signal(false);
  readonly labels = signal<EmailLabel[]>([]);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly filterMode = signal<ListFilterMode>('all');
  readonly checkedEmailIds = signal<string[]>([]);
  readonly unreadCounts = signal<Record<string, number>>({});

  globalSearch = '';
  // Compose form state
  composeTo = '';
  composeCc = '';
  composeBcc = '';
  showCc = false;
  showBcc = false;
  composeSubject = '';
  composeBody = '';
  searchQuery = '';

  // ── Category tabs ──────────────────────────────────────────────────────────
  readonly tabs: EmailTab[] = [
    { key: 'inbox', label: 'Inbox', icon: 'lucideInbox' },
    { key: 'starred', label: 'Starred', icon: 'lucideStar' },
    { key: 'sent', label: 'Sent', icon: 'lucideSend' },
    { key: 'draft', label: 'Draft', icon: 'lucideFileEdit' },
    { key: 'spam', label: 'Spam', icon: 'lucideAlertTriangle' },
    { key: 'trash', label: 'Trash', icon: 'lucideTrash2' },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredEmails = computed(() => {
    const base0 = this.emails();
    const base1 = this.filterMode() === 'unread' ? base0.filter((e) => !e.isRead) : base0;
    const base2 = this.globalSearch
      ? base1.filter((e) => {
          const q = this.globalSearch.toLowerCase();
          return (
            e.subject.toLowerCase().includes(q) ||
            (e.from.name ?? '').toLowerCase().includes(q) ||
            e.from.email.toLowerCase().includes(q)
          );
        })
      : base1;
    if (!this.searchQuery) return base2;
    const q = this.searchQuery.toLowerCase();
    return base2.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from.email.toLowerCase().includes(q) ||
        (e.from.name ?? '').toLowerCase().includes(q) ||
        (e.bodyText ?? '').toLowerCase().includes(q)
    );
  });

  readonly isAllSelected = computed(() => {
    const ids = this.filteredEmails().map((e) => e.emailId);
    const checked = new Set(this.checkedEmailIds());
    return ids.length > 0 && ids.every((id) => checked.has(id));
  });

  ngOnInit(): void {
    // Sync active category from route params
    this._route.params.subscribe((params) => {
      if (params['category']) {
        // keep route param in sync if used
        const c = params['category'] as MailFolder;
        this.activeFolder.set(c);
      }
      if (params['emailId']) {
        this._emailService.getEmail(params['emailId']).subscribe((e) => {
          if (e) this.selectedEmail.set(e);
        });
      }
      this._loadEmails();
    });

    this._emailService.getLabels().subscribe((l) => this.labels.set(l));
    this._loadEmails();
    this._loadUnreadCounts();
  }

  private _loadEmails(): void {
    this.isLoading.set(true);
    const folder = this.activeFolder();
    if (folder === 'starred') {
      this._loadStarred();
      return;
    }
    this._emailService
      .getEmails({ category: folder, pageNo: this.page(), pageSize: 20 })
      .subscribe((res) => {
        this.emails.set(res.items);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
        this.checkedEmailIds.set([]);
      });
  }

  private _loadStarred(): void {
    const cats: EmailCategory[] = ['inbox', 'sent', 'draft', 'spam', 'trash'];
    const all: Email[] = [];
    let remaining = cats.length;
    for (const c of cats) {
      this._emailService.getEmails({ category: c, pageNo: 1, pageSize: 200 }).subscribe({
        next: (res) => {
          all.push(...(res.items ?? []));
          remaining -= 1;
          if (remaining === 0) {
            const uniq = new Map<string, Email>();
            for (const e of all) uniq.set(e.emailId, e);
            const starred = Array.from(uniq.values()).filter((e) => e.isStarred);
            this.emails.set(starred);
            this.totalCount.set(starred.length);
            this.isLoading.set(false);
            this.checkedEmailIds.set([]);
          }
        },
        error: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.emails.set([]);
            this.totalCount.set(0);
            this.isLoading.set(false);
            this.checkedEmailIds.set([]);
          }
        },
      });
    }
  }

  private _loadUnreadCounts(): void {
    const categories: EmailCategory[] = ['inbox', 'sent', 'draft', 'spam', 'trash'];
    const next: Record<string, number> = {};
    let remaining = categories.length;
    for (const cat of categories) {
      this._emailService.getEmails({ category: cat, pageNo: 1, pageSize: 200 }).subscribe({
        next: (res) => {
          next[cat] = (res.items ?? []).filter((e) => !e.isRead).length;
          remaining -= 1;
          if (remaining === 0) this.unreadCounts.set(next);
        },
        error: () => {
          next[cat] = 0;
          remaining -= 1;
          if (remaining === 0) this.unreadCounts.set(next);
        },
      });
    }
  }

  selectFolder(folder: MailFolder): void {
    this.activeFolder.set(folder);
    this.selectedEmail.set(null);
    this.page.set(1);
    this._loadEmails();
    this._loadUnreadCounts();
  }

  selectEmail(email: Email): void {
    this.selectedEmail.set(email);
    this.composeOpen.set(false);
    // Mark as read
    if (!email.isRead) {
      this._emailService.markAsRead(email.emailId, true).subscribe();
      this.emails.update((list) =>
        list.map((e) => (e.emailId === email.emailId ? { ...e, isRead: true } : e))
      );
      this._loadUnreadCounts();
    }
  }

  openCompose(): void {
    this.composeOpen.set(true);
    this.composeTo = '';
    this.composeCc = '';
    this.composeBcc = '';
    this.showCc = false;
    this.showBcc = false;
    this.composeSubject = '';
    this.composeBody = '';
  }

  discardCompose(): void {
    this.composeOpen.set(false);
    this.composeTo = '';
    this.composeCc = '';
    this.composeBcc = '';
    this.showCc = false;
    this.showBcc = false;
    this.composeSubject = '';
    this.composeBody = '';
  }

  sendEmail(): void {
    this._emailService
      .sendEmail({
        subject: this.composeSubject,
        body: this.composeBody,
        to: [{ email: this.composeTo }],
      })
      .subscribe(() => {
        this.discardCompose();
        if (this.activeFolder() === 'sent') this._loadEmails();
      });
  }

  saveDraft(): void {
    this._emailService
      .saveDraft({
        subject: this.composeSubject,
        body: this.composeBody,
        to: [{ email: this.composeTo }],
      })
      .subscribe(() => this.composeOpen.set(false));
  }

  toggleStar(email: Email): void {
    this._emailService.toggleStar(email.emailId, !email.isStarred).subscribe();
    this.emails.update((list) =>
      list.map((e) => (e.emailId === email.emailId ? { ...e, isStarred: !e.isStarred } : e))
    );
  }

  replyEmail(email: Email): void {
    this.composeTo = email.from.email;
    this.composeSubject = `Re: ${email.subject}`;
    this.composeBody = `\n\n---\nOn ${email.createdAt}, ${email.from.email} wrote:\n${email.bodyText}`;
    this.composeOpen.set(true);
  }

  replyAllEmail(email: Email): void {
    const tos = [email.from.email, ...(email.to ?? []).map((t) => t.email)].filter(Boolean);
    this.composeTo = Array.from(new Set(tos)).join(', ');
    this.composeSubject = `Re: ${email.subject}`;
    this.composeBody = `\n\n---\nOn ${email.createdAt}, ${email.from.email} wrote:\n${email.bodyText}`;
    this.composeOpen.set(true);
  }

  forwardEmail(email: Email): void {
    this.composeTo = '';
    this.composeSubject = `Fwd: ${email.subject}`;
    this.composeBody = `\n\n---\nForwarded message from ${email.from.email}:\n${email.bodyText}`;
    this.composeOpen.set(true);
  }

  trashEmail(email: Email): void {
    this._emailService.moveToTrash(email.emailId).subscribe(() => {
      this.emails.update((list) => list.filter((e) => e.emailId !== email.emailId));
      this.selectedEmail.set(null);
      this._loadUnreadCounts();
    });
  }

  refresh(): void {
    this._loadEmails();
    this._loadUnreadCounts();
  }

  onGlobalSearchChanged(): void {
    // purely client-side filtering for parity UI
  }
  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this._loadEmails();
    }
  }
  nextPage(): void {
    this.page.update((p) => p + 1);
    this._loadEmails();
  }

  unreadCount(cat: EmailCategory): number {
    return Number(this.unreadCounts()?.[cat] ?? 0);
  }

  isChecked(id: string): boolean {
    return this.checkedEmailIds().includes(id);
  }

  toggleChecked(id: string): void {
    this.checkedEmailIds.update((cur) => {
      const set = new Set(cur);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    });
  }

  toggleSelectAll(): void {
    const ids = this.filteredEmails().map((e) => e.emailId);
    if (this.isAllSelected()) {
      this.checkedEmailIds.set([]);
      return;
    }
    this.checkedEmailIds.set(ids);
  }

  bulkMarkRead(isRead: boolean): void {
    const ids = this.checkedEmailIds();
    if (ids.length === 0) return;
    for (const id of ids) this._emailService.markAsRead(id, isRead).subscribe();
    this.emails.update((list) => list.map((e) => (ids.includes(e.emailId) ? { ...e, isRead } : e)));
    this.checkedEmailIds.set([]);
    this._loadUnreadCounts();
  }

  bulkMoveToTrash(): void {
    const ids = this.checkedEmailIds();
    if (ids.length === 0) return;
    for (const id of ids) this._emailService.moveToTrash(id).subscribe();
    this.emails.update((list) => list.filter((e) => !ids.includes(e.emailId)));
    this.checkedEmailIds.set([]);
    this.selectedEmail.set(null);
    this._loadUnreadCounts();
  }

  bulkMoveToSpam(): void {
    // Service is mock; mimic UX by removing from current list.
    const ids = this.checkedEmailIds();
    if (ids.length === 0) return;
    this.emails.update((list) => list.filter((e) => !ids.includes(e.emailId)));
    this.checkedEmailIds.set([]);
    this.selectedEmail.set(null);
    this._loadUnreadCounts();
  }
}
