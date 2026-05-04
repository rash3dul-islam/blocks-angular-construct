// ─── Dashboard Component ───────────────────────────────────────────────────────
// Mirrors: src/modules/dashboard/pages/DashboardPage.tsx in React project
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideDollarSign,
  lucideUsers,
  lucideShoppingCart,
  lucidePackage,
  lucideTrendingUp,
  lucideTrendingDown,
  lucideDownload,
  lucideRefreshCcw,
} from '@ng-icons/lucide';
import { HlmCard, HlmCardContent, HlmCardHeader, HlmCardTitle } from '@spartan-ng/helm/card';
import { HlmButton } from '../../../../components/ui-kit/button/src/lib/hlm-button';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, UserActivityData } from '../../../../models/dashboard.model';

// Register Chart.js globally
Chart.register(...registerables);

// ─── Metric Card Interface ─────────────────────────────────────────────────────
interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  prefix?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    NgIconComponent,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardContent,
    HlmButton,
  ],
  viewProviders: [
    provideIcons({
      lucideDollarSign,
      lucideUsers,
      lucideShoppingCart,
      lucidePackage,
      lucideTrendingUp,
      lucideTrendingDown,
      lucideDownload,
      lucideRefreshCcw,
    }),
  ],
  hostDirectives: [],
  template: `
    <main class="flex w-full flex-col p-6" role="main" aria-label="Dashboard Content">
      <!-- Header -->
      <div class="mb-[18px] flex items-center justify-between md:mb-[32px]">
        <h3 class="text-2xl font-bold tracking-tight text-foreground">Dashboard</h3>
        <div class="flex items-center gap-3">
          <button
            hlmBtn
            variant="outline"
            type="button"
            class="h-9 gap-2 !rounded-[6px] border-border bg-white px-3.5 font-medium text-foreground shadow-none hover:bg-muted/60 dark:bg-card dark:hover:bg-muted/40"
            aria-label="Sync dashboard data"
            (click)="sync()"
          >
            <ng-icon name="lucideRefreshCcw" class="h-4 w-4 shrink-0 text-foreground" />
            <span class="whitespace-nowrap text-sm font-medium">Sync</span>
          </button>
          <button
            hlmBtn
            variant="default"
            type="button"
            class="h-9 gap-2 !rounded-[6px] border-transparent bg-primary px-3.5 font-medium text-primary-foreground shadow-none hover:bg-primary/90"
            aria-label="Export dashboard data"
            (click)="exportDashboard()"
          >
            <ng-icon name="lucideDownload" class="h-4 w-4 shrink-0 text-primary-foreground" />
            <span class="whitespace-nowrap text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Overview -->
        <div hlmCard class="border-none rounded-[8px] shadow-sm bg-card text-card-foreground">
          <div hlmCardHeader class="flex flex-row items-center justify-between">
            <h2 hlmCardTitle class="text-xl text-foreground">Overview</h2>
            <select
              class="h-7 rounded-md border border-input bg-background px-2 text-sm text-foreground"
              [value]="overviewRange()"
              (change)="onOverviewRangeChanged($any($event.target).value)"
              aria-label="Overview range"
            >
              <option value="this_month">This month</option>
              <option value="last_month">Last month</option>
            </select>
          </div>
          <div hlmCardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              @for (card of metricCards(); track card.title) {
                <div class="rounded-[8px] border border-border bg-background p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-medium text-muted-foreground">{{ card.title }}</p>
                      <div class="mt-1 text-2xl font-bold text-foreground">
                        {{ card.prefix }}{{ card.value | number }}
                      </div>
                      <div class="mt-1 flex items-center gap-1">
                        <ng-icon
                          [name]="card.change >= 0 ? 'lucideTrendingUp' : 'lucideTrendingDown'"
                          [class]="card.change >= 0 ? 'text-construct-success-fg' : 'text-destructive'"
                          size="14"
                        />
                        <span
                          class="text-xs font-medium"
                          [class.text-construct-success-fg]="card.change >= 0"
                          [class.text-destructive]="card.change < 0"
                        >
                          {{ card.change >= 0 ? '+' : '' }}{{ card.change }}% from last month
                        </span>
                      </div>
                    </div>
                    <div class="rounded-md bg-muted p-2">
                      <ng-icon [name]="card.icon" class="text-foreground/70" size="18" />
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <!-- Users by platform -->
          <div
            hlmCard
            class="w-full md:w-[40%] border-none rounded-[8px] shadow-sm bg-card text-card-foreground"
          >
            <div hlmCardHeader class="flex flex-row items-center justify-between">
              <h2 hlmCardTitle class="text-xl text-foreground">Users by platform</h2>
              <select
                class="h-7 w-[120px] rounded-md border border-input bg-background px-2 text-sm text-foreground"
                [value]="platformRange()"
                (change)="onPlatformRangeChanged($any($event.target).value)"
                aria-label="Users by platform range"
              >
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
              </select>
            </div>
            <div hlmCardContent>
              <div class="relative aspect-square max-h-[250px]">
                <canvas baseChart [data]="pieChartData" [options]="pieChartOptions" type="pie">
                </canvas>
              </div>
            </div>
          </div>

          <!-- User activity trends -->
          <div hlmCard class="flex-1 border-none rounded-[8px] shadow-sm bg-card text-card-foreground">
            <div hlmCardHeader class="flex flex-row items-center justify-between">
              <h2 hlmCardTitle class="text-xl text-foreground">User activity trends</h2>
              <select
                class="h-7 w-[120px] rounded-md border border-input bg-background px-2 text-sm text-foreground"
                [value]="activityRange()"
                (change)="onActivityRangeChanged($any($event.target).value)"
                aria-label="User activity range"
              >
                <option value="this_week">This week</option>
                <option value="last_week">Last week</option>
              </select>
            </div>
            <div hlmCardContent>
              <div class="relative h-64">
                <canvas
                  baseChart
                  [data]="userActivityChartData"
                  [options]="lineChartOptions"
                  type="line"
                ></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- System usage overview -->
        <div hlmCard class="border-none rounded-[8px] shadow-sm bg-card text-card-foreground">
          <div hlmCardHeader class="flex flex-row items-center justify-between">
            <h2 hlmCardTitle class="text-xl text-foreground">System usage overview</h2>
            <select
              class="h-7 rounded-md border border-input bg-background px-2 text-sm text-foreground"
              [value]="systemRange()"
              (change)="onSystemRangeChanged($any($event.target).value)"
              aria-label="System usage range"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
          </div>
          <div hlmCardContent class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="rounded-[8px] border border-border bg-background p-4">
              <h3 class="text-sm font-semibold text-foreground">Monthly revenue</h3>
              <div class="mt-3 relative h-64">
                <canvas baseChart [data]="revenueChartData" [options]="barChartOptions" type="bar">
                </canvas>
              </div>
            </div>
            <div class="rounded-[8px] border border-border bg-background p-4">
              <h3 class="text-sm font-semibold text-foreground">Quick stats</h3>
              <div class="mt-3 space-y-3">
                @if (stats()) {
                  <div class="flex items-center justify-between border-b border-border pb-3">
                    <span class="text-sm text-muted-foreground">Total Revenue</span>
                    <span class="text-sm font-semibold text-foreground"
                      >\${{ stats()!.totalRevenue | number }}</span
                    >
                  </div>
                  <div class="flex items-center justify-between border-b border-border pb-3">
                    <span class="text-sm text-muted-foreground">Total Users</span>
                    <span class="text-sm font-semibold text-foreground">{{
                      stats()!.totalUsers | number
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between border-b border-border pb-3">
                    <span class="text-sm text-muted-foreground">Total Orders</span>
                    <span class="text-sm font-semibold text-foreground">{{
                      stats()!.totalOrders | number
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">Total Products</span>
                    <span class="text-sm font-semibold text-foreground">{{
                      stats()!.totalProducts | number
                    }}</span>
                  </div>
                } @else {
                  <p class="text-sm text-muted-foreground">Loading…</p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly stats = signal<DashboardStats | null>(null);
  readonly metricCards = signal<MetricCard[]>([]);

  // UI ranges (React has dropdowns; here we keep it lightweight but aligned)
  readonly overviewRange = signal<'this_month' | 'last_month'>('this_month');
  readonly platformRange = signal<'this_month' | 'last_month'>('this_month');
  readonly activityRange = signal<'this_week' | 'last_week'>('this_week');
  readonly systemRange = signal<'today' | 'yesterday'>('today');

  // ── Chart Data: User Activity (Line) ───────────────────────────────────────
  userActivityChartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };

  // ── Chart Data: Revenue (Bar) ──────────────────────────────────────────────
  revenueChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  // ── Chart Data: Categories (Pie) ───────────────────────────────────────────
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [],
  };

  // ── Chart Options ──────────────────────────────────────────────────────────
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.sync();
  }

  sync(): void {
    this._loadStats();
    this._loadUserActivity();
    this._loadRevenueData();
    this._loadCategoryData();
  }

  exportDashboard(): void {
    const payload = {
      exportedAt: new Date().toISOString(),
      ranges: {
        overview: this.overviewRange(),
        platform: this.platformRange(),
        activity: this.activityRange(),
        system: this.systemRange(),
      },
      stats: this.stats(),
      metricCards: this.metricCards(),
      charts: {
        userActivity: this.userActivityChartData,
        revenue: this.revenueChartData,
        platform: this.pieChartData,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onOverviewRangeChanged(v: 'this_month' | 'last_month'): void {
    this.overviewRange.set(v);
  }

  onPlatformRangeChanged(v: 'this_month' | 'last_month'): void {
    this.platformRange.set(v);
  }

  onActivityRangeChanged(v: 'this_week' | 'last_week'): void {
    this.activityRange.set(v);
  }

  onSystemRangeChanged(v: 'today' | 'yesterday'): void {
    this.systemRange.set(v);
  }

  // ── Private Loaders ────────────────────────────────────────────────────────
  private _loadStats(): void {
    this.dashboardService.getStats().subscribe((data) => {
      this.stats.set(data);
      this.metricCards.set([
        {
          title: 'Total Revenue',
          value: data.totalRevenue,
          change: data.revenueChange,
          icon: 'lucideDollarSign',
          prefix: '$',
        },
        {
          title: 'Total Users',
          value: data.totalUsers,
          change: data.usersChange,
          icon: 'lucideUsers',
        },
        {
          title: 'Total Orders',
          value: data.totalOrders,
          change: data.ordersChange,
          icon: 'lucideShoppingCart',
        },
        { title: 'Total Products', value: data.totalProducts, change: 0, icon: 'lucidePackage' },
      ]);
    });
  }

  private _loadUserActivity(): void {
    this.dashboardService.getUserActivity().subscribe((data: UserActivityData[]) => {
      this.userActivityChartData = {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: 'Active Users',
            data: data.map((d) => d.activeUsers),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79,70,229,0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'New Users',
            data: data.map((d) => d.newUsers),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    });
  }

  private _loadRevenueData(): void {
    this.dashboardService.getRevenueData().subscribe((data) => {
      this.revenueChartData = {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: 'Revenue',
            data: data.map((d) => d.revenue),
            backgroundColor: 'rgba(79,70,229,0.8)',
            borderRadius: 6,
          },
          {
            label: 'Expense',
            data: data.map((d) => d.expense),
            backgroundColor: 'rgba(239,68,68,0.7)',
            borderRadius: 6,
          },
        ],
      };
    });
  }

  private _loadCategoryData(): void {
    this.dashboardService.getCategoryDistribution().subscribe((data) => {
      this.pieChartData = {
        labels: data.map((d) => d.category),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: ['#4f46e5', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444'],
            hoverOffset: 6,
          },
        ],
      };
    });
  }
}
