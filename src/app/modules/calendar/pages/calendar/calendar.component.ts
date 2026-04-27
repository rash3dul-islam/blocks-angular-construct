// ─── Calendar Component ────────────────────────────────────────────────────────
// Mirrors: src/modules/calendar/pages/CalendarPage.tsx in React project
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideX,
  lucideCalendar,
  lucideSearch,
  lucideListFilter,
  lucideSettings,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import {
  HlmDialog,
  HlmDialogContent,
  HlmDialogHeader,
  HlmDialogTitle,
  HlmDialogDescription,
  HlmDialogTrigger,
} from '@spartan-ng/helm/dialog';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent, CreateEventInput } from '../../../../models/calendar.model';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import {
  HlmSheet,
  HlmSheetContent,
  HlmSheetHeader,
  HlmSheetTitle,
  HlmSheetDescription,
} from '../../../../components/ui-kit/sheet/src';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
    NgIconComponent,
    HlmButton,
    HlmInput,
    HlmLabel,
    BrnDialogContent,
    HlmDialog,
    HlmDialogContent,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmDialogDescription,
    HlmDialogTrigger,
    BrnSheetContent,
    HlmSheet,
    HlmSheetContent,
    HlmSheetHeader,
    HlmSheetTitle,
    HlmSheetDescription,
  ],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideX,
      lucideCalendar,
      lucideSearch,
      lucideListFilter,
      lucideSettings,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header (React-like: search + filters + settings + add) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 class="text-2xl font-bold leading-9 text-foreground">Calendar</h1>

        <div class="flex items-center w-full sm:w-auto gap-2 sm:justify-end">
          <div class="relative w-full sm:w-[45%] min-w-[220px]">
            <ng-icon
              name="lucideSearch"
              class="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
            />
            <input
              hlmInput
              class="h-8 w-full rounded-lg bg-background pl-8"
              placeholder="Search"
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilters()"
            />
          </div>

          <button
            hlmBtn
            variant="outline"
            size="sm"
            class="text-sm font-bold sm:min-w-[116px]"
            type="button"
            (click)="filtersOpen.set(true)"
          >
            <ng-icon name="lucideListFilter" class="w-5 h-5" />
            <span class="sr-only sm:not-sr-only">Filters</span>
          </button>

          <button
            hlmBtn
            variant="outline"
            size="sm"
            class="text-sm font-bold sm:min-w-[116px]"
            type="button"
            (click)="settingsOpen.set(true)"
          >
            <ng-icon name="lucideSettings" class="w-5 h-5" />
            <span class="sr-only sm:not-sr-only">Settings</span>
          </button>

          <hlm-dialog>
            <button hlmBtn hlmDialogTrigger size="sm" class="text-sm font-bold sm:min-w-[116px]">
              <ng-icon name="lucidePlus" class="w-5 h-5"></ng-icon>
              <span class="sr-only sm:not-sr-only">Add event</span>
            </button>

            <hlm-dialog-content *brnDialogContent="let ctx" class="w-full sm:max-w-[720px] max-h-[96vh] overflow-y-auto">
              <hlm-dialog-header>
                <h3 hlmDialogTitle>Add Event</h3>
                <p hlmDialogDescription></p>
              </hlm-dialog-header>

              <form [formGroup]="eventForm" (ngSubmit)="onSubmitEvent(ctx)" class="space-y-4 py-4">
                <div class="space-y-1.5">
                  <label hlmLabel for="title" class="font-normal text-sm">Title*</label>
                  <input
                    hlmInput
                    id="title"
                    formControlName="title"
                    placeholder="Enter event title"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1.5">
                  <label hlmLabel for="meetingLink" class="font-normal text-sm">Meeting Link</label>
                  <input
                    hlmInput
                    id="meetingLink"
                    formControlName="meetingLink"
                    placeholder="Enter your meeting link"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1.5">
                  <label hlmLabel class="font-normal text-sm">Participants</label>
                  <div class="flex items-start gap-3">
                    <button
                      type="button"
                      class="h-11 w-11 rounded-md border border-dashed border-border text-foreground hover:bg-accent"
                      (click)="addParticipant()"
                      aria-label="Add participant"
                    >
                      +
                    </button>
                    <div class="flex-1">
                      <input
                        hlmInput
                        [(ngModel)]="participantDraft"
                        [ngModelOptions]="{ standalone: true }"
                        placeholder="Type email and press Enter"
                        (keydown.enter)="$event.preventDefault(); addParticipantFromDraft()"
                        class="w-full"
                      />
                      @if (participants().length > 0) {
                        <div class="mt-2 flex flex-wrap gap-2">
                          @for (p of participants(); track p) {
                            <span class="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-foreground">
                              {{ p }}
                              <button type="button" class="text-muted-foreground hover:text-foreground" (click)="removeParticipant(p)">×</button>
                            </span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row w-full gap-4">
                  <div class="w-full sm:w-[60%]">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="flex flex-col gap-[6px]">
                        <label class="font-normal text-sm text-foreground">Start date</label>
                        <div class="relative">
                          <input hlmInput type="date" formControlName="startDate" class="w-full pr-10" />
                          <ng-icon name="lucideCalendar" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      @if (!eventForm.value.allDay) {
                        <div class="flex flex-col gap-[6px]">
                          <label class="font-normal text-sm text-foreground">Start time</label>
                          <select
                            class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                            formControlName="startTime"
                          >
                            @for (t of timeOptions; track t) {
                              <option [value]="t">{{ formatTimeLabel(t) }}</option>
                            }
                          </select>
                        </div>
                      }
                      <div class="flex flex-col gap-[6px]">
                        <label class="font-normal text-sm text-foreground">End date</label>
                        <div class="relative">
                          <input hlmInput type="date" formControlName="endDate" class="w-full pr-10" />
                          <ng-icon name="lucideCalendar" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      @if (!eventForm.value.allDay) {
                        <div class="flex flex-col gap-[6px]">
                          <label class="font-normal text-sm text-foreground">End time</label>
                          <select
                            class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                            formControlName="endTime"
                          >
                            @for (t of timeOptions; track t) {
                              <option [value]="t">{{ formatTimeLabel(t) }}</option>
                            }
                          </select>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="hidden sm:block w-px bg-border"></div>

                  <div class="w-full sm:w-[40%] flex flex-col gap-4 pt-1">
                    <label class="flex items-center gap-4">
                      <input type="checkbox" class="h-5 w-10" formControlName="allDay" />
                      <span class="text-sm text-foreground">All day</span>
                    </label>
                    <label class="flex items-center gap-4">
                      <input type="checkbox" class="h-5 w-10" formControlName="recurring" />
                      <span class="text-sm text-foreground">Recurring Event</span>
                    </label>
                    @if (eventForm.value.recurring) {
                      <button
                        type="button"
                        class="underline text-primary text-base cursor-pointer font-semibold hover:text-primary/80 bg-transparent border-none p-0 text-left"
                      >
                        Occurs on {{ weekdayLabel() }}
                      </button>
                    }
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <p class="font-semibold text-base text-foreground">Description</p>
                  <textarea
                    formControlName="description"
                    class="min-h-32 w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                    placeholder="Write description (max 100 words)"
                  ></textarea>
                </div>

                <div class="flex flex-col gap-2">
                  <p class="font-semibold text-base text-foreground">Colors</p>
                  <div class="flex flex-wrap gap-3">
                    @for (c of colorOptions; track c) {
                      <button
                        type="button"
                        class="h-7 w-7 rounded-full border"
                        [style.background]="c"
                        [class.ring-2]="selectedColor() === c"
                        [class.ring-ring]="selectedColor() === c"
                        [class.border-border]="selectedColor() !== c"
                        (click)="selectedColor.set(c); eventForm.patchValue({ color: c })"
                        aria-label="Pick color"
                      ></button>
                    }
                  </div>
                </div>

                <div class="flex justify-end w-full gap-4 !mt-6">
                  <button hlmBtn variant="outline" type="button" (click)="onDiscard(ctx)">Discard</button>
                  <button hlmBtn type="submit" [disabled]="eventForm.invalid">Save</button>
                </div>
              </form>
          </hlm-dialog-content>
        </hlm-dialog>
      </div>

      <!-- Calendar toolbar (React-like) -->
      <div class="flex justify-between flex-col sm:flex-row items-center border border-border bg-card rounded-md py-3 px-3 gap-2 sm:px-6">
        <div class="flex items-center gap-4">
          <button hlmBtn variant="outline" size="sm" type="button" class="text-sm font-bold" (click)="goToday()">
            Today
          </button>
          <div class="flex items-center gap-2">
            <button hlmBtn variant="ghost" size="icon" type="button" (click)="goPrev()">
              <ng-icon name="lucideChevronLeft" class="h-5 w-5" />
            </button>
            <button hlmBtn variant="ghost" size="icon" type="button" (click)="goNext()">
              <ng-icon name="lucideChevronRight" class="h-5 w-5" />
            </button>
          </div>
          <p class="text-foreground text-base sm:text-2xl font-semibold">{{ calendarTitle() }}</p>
        </div>

        <div class="flex items-center gap-1 rounded-[4px] bg-muted p-1">
          @for (v of viewTabs; track v.key) {
            <button
              type="button"
              class="h-8 px-3 text-sm capitalize rounded-[4px] transition-colors"
              [ngClass]="activeView() === v.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              (click)="setView(v.key)"
            >
              {{ v.label }}
            </button>
          }
        </div>
      </div>

      <!-- ── Calendar ────────────────────────────────────────────── -->
      <div
        class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4"
      >
        <full-calendar [options]="calendarOptions()"></full-calendar>
      </div>

      <!-- ── Event Detail Dialog (click) ────────────────────────── -->
      @if (selectedEvent()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          (click)="selectedEvent.set(null)"
        >
          <div
            class="bg-card text-card-foreground rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-border"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  [style.background-color]="selectedEvent()!.color ?? '#4f46e5'"
                ></div>
                <h3 class="text-lg font-semibold text-foreground">
                  {{ selectedEvent()!.title }}
                </h3>
              </div>
              <button
                (click)="selectedEvent.set(null)"
                class="text-muted-foreground hover:text-foreground"
              >
                <ng-icon name="lucideX" size="18"></ng-icon>
              </button>
            </div>
            @if (selectedEvent()!.description) {
              <p class="text-sm text-muted-foreground mb-3">
                {{ selectedEvent()!.description }}
              </p>
            }
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <ng-icon name="lucideCalendar" size="14"></ng-icon>
              <span>{{ selectedEvent()!.start | date: 'medium' }}</span>
            </div>
          </div>
        </div>
      }

      <!-- Filters sheet -->
      <hlm-sheet
        [state]="filtersOpen() ? 'open' : 'closed'"
        (stateChanged)="filtersOpen.set($event === 'open')"
      >
        <hlm-sheet-content *brnSheetContent="let ctx" side="right" class="w-full sm:min-w-[450px]">
          <hlm-sheet-header>
            <h3 hlmSheetTitle class="!text-left">Filters</h3>
            <p hlmSheetDescription></p>
          </hlm-sheet-header>
          <div class="p-6 flex flex-col gap-6">
            <div class="space-y-2">
              <p class="text-sm font-semibold text-foreground">Date range</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs text-muted-foreground">From</label>
                  <input
                    hlmInput
                    type="date"
                    class="w-full"
                    [(ngModel)]="filterFrom"
                    (ngModelChange)="applyFilters()"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-muted-foreground">To</label>
                  <input
                    hlmInput
                    type="date"
                    class="w-full"
                    [(ngModel)]="filterTo"
                    (ngModelChange)="applyFilters()"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-semibold text-foreground">Color</p>
              <input
                type="color"
                class="h-9 w-full rounded-md border border-input cursor-pointer"
                [(ngModel)]="filterColor"
                (ngModelChange)="applyFilters()"
              />
              <button
                hlmBtn
                variant="outline"
                size="sm"
                type="button"
                class="w-full"
                (click)="resetFilters()"
              >
                Reset
              </button>
            </div>

            <button hlmBtn type="button" class="w-full" (click)="ctx.close()">Apply</button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>

      <!-- Settings sheet -->
      <hlm-sheet
        [state]="settingsOpen() ? 'open' : 'closed'"
        (stateChanged)="settingsOpen.set($event === 'open')"
      >
        <hlm-sheet-content *brnSheetContent="let ctx" side="right" class="w-full sm:min-w-[450px]">
          <hlm-sheet-header>
            <h3 hlmSheetTitle class="!text-left">Settings</h3>
            <p hlmSheetDescription></p>
          </hlm-sheet-header>
          <div class="p-6 flex flex-col gap-4">
            <p class="text-sm text-muted-foreground">
              Calendar settings are UI-only for now (parity scaffold).
            </p>
            <button hlmBtn variant="outline" type="button" class="w-full" (click)="ctx.close()">
              Close
            </button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private readonly calendarService = inject(CalendarService);
  private readonly fb = inject(FormBuilder);
  @ViewChild(FullCalendarComponent) private readonly _fc?: FullCalendarComponent;

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly events = signal<EventInput[]>([]);
  readonly selectedEvent = signal<CalendarEvent | null>(null);
  readonly filtersOpen = signal(false);
  readonly settingsOpen = signal(false);

  searchTerm = '';
  filterFrom = '';
  filterTo = '';
  filterColor = '';

  readonly activeView = signal<'week' | 'month' | 'day' | 'agenda' | 'year'>('month');
  readonly calendarTitle = signal('');
  readonly viewTabs: Array<{ key: 'week' | 'month' | 'day' | 'agenda' | 'year'; label: string }> = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'day', label: 'Day' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'year', label: 'Year' },
  ];

  participantDraft = '';
  readonly participants = signal<string[]>([]);
  readonly selectedColor = signal<string>('#0ea5e9');
  readonly colorOptions: string[] = [
    '#0f766e',
    '#0ea5e9',
    '#7c3aed',
    '#dc2626',
    '#f59e0b',
    '#14b8a6',
    '#38bdf8',
    '#c084fc',
    '#f9a8d4',
  ];

  readonly timeOptions: string[] = Array.from({ length: 24 * 2 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  // ── Calendar Options (signal) ──────────────────────────────────────────────
  readonly calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    headerToolbar: false,
    events: [],
    eventClick: (arg: EventClickArg) => this._onEventClick(arg),
    dateClick: (arg: DateClickArg) => this._onDateClick(arg),
    datesSet: () => this._syncTitle(),
  });

  // ── Event Form ─────────────────────────────────────────────────────────────
  readonly eventForm = this.fb.group({
    title: ['', Validators.required],
    meetingLink: [''],
    startDate: ['', Validators.required],
    startTime: ['09:00', Validators.required],
    endDate: ['', Validators.required],
    endTime: ['10:00', Validators.required],
    allDay: [false],
    recurring: [false],
    description: [''],
    color: ['#0ea5e9'],
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.calendarService.getEvents().subscribe((events) => {
      const calEvents: EventInput[] = events.map((e) => ({
        id: e.eventId,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay ?? false,
        color: e.color ?? '#4f46e5',
        extendedProps: { description: e.description, original: e },
      }));
      this.events.set(calEvents);
      this.applyFilters();
      queueMicrotask(() => this._syncTitle());
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterFrom = '';
    this.filterTo = '';
    this.filterColor = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const q = (this.searchTerm ?? '').trim().toLowerCase();
    const from = this.filterFrom ? new Date(`${this.filterFrom}T00:00:00`) : null;
    const to = this.filterTo ? new Date(`${this.filterTo}T23:59:59`) : null;
    const color = (this.filterColor ?? '').trim().toLowerCase();

    const filtered = this.events().filter((e) => {
      const title = String(e.title ?? '').toLowerCase();
      if (q && !title.includes(q)) return false;
      if (color && String(e.color ?? '').toLowerCase() !== color) return false;

      const start = e.start ? new Date(String(e.start)) : null;
      if (from && start && start < from) return false;
      if (to && start && start > to) return false;
      return true;
    });

    this.calendarOptions.update((opts) => ({ ...opts, events: filtered }));
  }

  // ── Submit New Event ───────────────────────────────────────────────────────
  onSubmitEvent(ctx: { close: () => void }): void {
    if (this.eventForm.invalid) return;
    const val = this.eventForm.getRawValue();
    const start = this._combineDateTime(val.startDate!, val.startTime!, !!val.allDay);
    const end = this._combineDateTime(val.endDate!, val.endTime!, !!val.allDay, true);
    const input: CreateEventInput = {
      title: val.title!,
      start: start.toISOString(),
      end: end.toISOString(),
      description: val.description ?? undefined,
      color: val.color ?? this.selectedColor(),
    };
    this.calendarService.createEvent(input).subscribe((newEvent) => {
      const calEvent: EventInput = {
        id: newEvent.eventId,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color ?? '#4f46e5',
        extendedProps: { description: newEvent.description, original: newEvent },
      };
      this.events.update((list) => [...list, calEvent]);
      this.calendarOptions.update((opts) => ({ ...opts, events: this.events() }));
      this.eventForm.reset({
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '10:00',
        allDay: false,
        recurring: false,
        color: this.selectedColor(),
      });
      this.participants.set([]);
      this.participantDraft = '';
      ctx.close();
    });
  }

  // ── Event Click Handler ────────────────────────────────────────────────────
  private _onEventClick(arg: EventClickArg): void {
    const original = arg.event.extendedProps['original'] as CalendarEvent;
    this.selectedEvent.set(original ?? null);
  }

  // ── Date Click Handler ─────────────────────────────────────────────────────
  private _onDateClick(arg: DateClickArg): void {
    const d = arg.date;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    this.eventForm.patchValue({
      startDate: dateStr,
      endDate: dateStr,
      startTime: '09:00',
      endTime: '10:00',
    });
  }

  formatTimeLabel(t: string): string {
    const [hh, mm] = t.split(':').map(Number);
    const h12 = ((hh + 11) % 12) + 1;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  weekdayLabel(): string {
    const sd = this.eventForm.value.startDate;
    if (!sd) return 'Monday';
    const d = new Date(`${sd}T00:00:00`);
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }

  addParticipant(): void {
    // focus UX: user can type into the input; keep "+" for parity with React.
  }

  addParticipantFromDraft(): void {
    const v = (this.participantDraft ?? '').trim();
    if (!v) return;
    this.participants.update((cur) => (cur.includes(v) ? cur : [...cur, v]));
    this.participantDraft = '';
  }

  removeParticipant(p: string): void {
    this.participants.update((cur) => cur.filter((x) => x !== p));
  }

  onDiscard(ctx: { close: () => void }): void {
    this.eventForm.reset({
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      allDay: false,
      recurring: false,
      color: this.selectedColor(),
      title: '',
      meetingLink: '',
      description: '',
    });
    this.participants.set([]);
    this.participantDraft = '';
    ctx.close();
  }

  goToday(): void {
    this._fc?.getApi().today();
    this._syncTitle();
  }

  goPrev(): void {
    this._fc?.getApi().prev();
    this._syncTitle();
  }

  goNext(): void {
    this._fc?.getApi().next();
    this._syncTitle();
  }

  setView(v: 'week' | 'month' | 'day' | 'agenda' | 'year'): void {
    this.activeView.set(v);
    const api = this._fc?.getApi();
    if (!api) return;
    const viewMap: Record<typeof v, string> = {
      week: 'timeGridWeek',
      month: 'dayGridMonth',
      day: 'timeGridDay',
      agenda: 'listWeek',
      year: 'multiMonthYear',
    } as const;
    api.changeView(viewMap[v]);
    this._syncTitle();
  }

  private _syncTitle(): void {
    const api = this._fc?.getApi();
    if (!api) return;
    this.calendarTitle.set(api.view.title);
  }

  private _combineDateTime(dateStr: string, timeStr: string, allDay: boolean, isEnd = false): Date {
    const base = new Date(`${dateStr}T00:00:00`);
    if (allDay) {
      if (isEnd) base.setHours(23, 59, 59, 999);
      else base.setHours(0, 0, 0, 0);
      return base;
    }
    const [hh, mm] = String(timeStr ?? '00:00')
      .split(':')
      .map((x) => Number(x));
    base.setHours(hh || 0, mm || 0, 0, 0);
    return base;
  }
}
