import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucidePlus, lucideMoreHorizontal } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan-ng/helm/select';
import { InvoicesService } from '../../services/invoices.service';
import {
  InvoiceStatus,
  type InvoiceItemDetails,
  type AddInvoiceItemParams,
} from '../../types/invoices.types';
import { calculateInvoiceTotals } from '../../utils/invoice-utils';

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
  ],
  viewProviders: [provideIcons({ lucideChevronLeft, lucidePlus, lucideMoreHorizontal })],
  template: `
    <div class="flex flex-col w-full gap-4">
      <div
        class="flex items-start gap-2 md:gap-0 md:items-center md:justify-between flex-col md:flex-row"
      >
        <div class="flex items-center gap-2">
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            class="bg-card hover:bg-card/60 rounded-full h-9 w-9 p-0"
            type="button"
            (click)="back()"
          >
            <ng-icon name="lucideChevronLeft" class="h-4 w-4" />
          </button>
          <h1 class="text-xl font-semibold">Create a new invoice</h1>
        </div>

        <div class="flex items-center gap-3">
          <button hlmBtn variant="outline" type="button" (click)="preview()">Preview</button>
          <button hlmBtn variant="outline" type="button" (click)="submit('draft')">
            Save As Draft
          </button>
          <button hlmBtn type="button" (click)="submit('send')">Save & Send</button>
        </div>
      </div>

      @if (banner()) {
        <div
          class="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm"
        >
          {{ banner() }}
        </div>
      }

      <!-- General info -->
      <div class="w-full rounded-lg border border-border bg-card shadow-sm">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold">General info</h2>
        </div>
        <div class="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="space-y-1.5">
            <label hlmLabel for="customerName">Customer name</label>
            <input
              id="customerName"
              hlmInput
              class="h-11 w-full"
              formControlName="customerName"
              [formGroup]="form"
              placeholder="Enter customer name..."
            />
          </div>

          <div class="space-y-1.5">
            <label hlmLabel for="email">Email</label>
            <input
              id="email"
              hlmInput
              class="h-11 w-full"
              formControlName="email"
              [formGroup]="form"
              placeholder="Enter email address..."
            />
          </div>

          <div class="space-y-1.5">
            <label hlmLabel for="phoneNumber">Phone number</label>
            <input
              id="phoneNumber"
              hlmInput
              class="h-11 w-full"
              formControlName="phoneNumber"
              [formGroup]="form"
              placeholder="+41"
            />
          </div>

          <div class="space-y-1.5">
            <label hlmLabel for="billingAddress">Billing address</label>
            <input
              id="billingAddress"
              hlmInput
              class="h-11 w-full"
              formControlName="billingAddress"
              [formGroup]="form"
              placeholder="Enter billing address..."
            />
          </div>

          <div class="space-y-1.5">
            <label hlmLabel for="dueDate">Due date</label>
            <input
              id="dueDate"
              type="date"
              hlmInput
              class="h-11 w-full"
              formControlName="dueDate"
              [formGroup]="form"
            />
          </div>

          <div class="space-y-1.5">
            <label hlmLabel>Currency</label>
            <hlm-select formControlName="currency" [formGroup]="form">
              <hlm-select-trigger class="h-11 w-full">
                <hlm-select-value placeholder="Select" />
              </hlm-select-trigger>
              <ng-template hlmSelectPortal>
                <hlm-select-content>
                  <hlm-select-item value="chf">CHF</hlm-select-item>
                  <hlm-select-item value="usd">USD</hlm-select-item>
                  <hlm-select-item value="eur">EUR</hlm-select-item>
                </hlm-select-content>
              </ng-template>
            </hlm-select>
          </div>
        </div>
      </div>

      <!-- Item details -->
      <div class="w-full rounded-lg border border-border bg-card shadow-sm">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold">Item details</h2>
        </div>
        <div class="p-6 flex flex-col gap-4">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/40">
                  <th
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Item name
                  </th>
                  <th
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Category
                  </th>
                  <th
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Quantity
                  </th>
                  <th
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Unit price
                  </th>
                  <th
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Amount
                  </th>
                  <th
                    class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody formArrayName="items" [formGroup]="form">
                @for (row of items.controls; track row; let i = $index) {
                  <tr class="border-b border-border/80" [formGroupName]="i">
                    <td class="px-3 py-3">
                      <input
                        hlmInput
                        class="h-10 w-full"
                        formControlName="ItemName"
                        placeholder="Enter item name..."
                      />
                    </td>
                    <td class="px-3 py-3">
                      <hlm-select formControlName="Category">
                        <hlm-select-trigger class="h-10 w-full">
                          <hlm-select-value placeholder="Select category" />
                        </hlm-select-trigger>
                        <ng-template hlmSelectPortal>
                          <hlm-select-content>
                            <hlm-select-item value="electronics">Electronics</hlm-select-item>
                            <hlm-select-item value="furniture">Furniture</hlm-select-item>
                            <hlm-select-item value="accessories">Accessories</hlm-select-item>
                            <hlm-select-item value="apparel">Apparel</hlm-select-item>
                          </hlm-select-content>
                        </ng-template>
                      </hlm-select>
                    </td>
                    <td class="px-3 py-3">
                      <input
                        hlmInput
                        type="number"
                        class="h-10 w-24"
                        formControlName="Quantity"
                        (input)="recalc(i)"
                      />
                    </td>
                    <td class="px-3 py-3">
                      <input
                        hlmInput
                        type="number"
                        class="h-10 w-32"
                        formControlName="UnitPrice"
                        (input)="recalc(i)"
                      />
                    </td>
                    <td class="px-3 py-3 uppercase text-muted-foreground">
                      {{ currency() }} {{ (row.value.Amount ?? 0).toFixed(2) }}
                    </td>
                    <td class="px-3 py-3 text-right">
                      <button
                        hlmBtn
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0"
                        type="button"
                        (click)="removeItem(i)"
                      >
                        <ng-icon name="lucideMoreHorizontal" class="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <button hlmBtn variant="outline" type="button" class="w-fit" (click)="addItem()">
            <ng-icon name="lucidePlus" class="h-4 w-4 mr-2" /> Add item
          </button>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label hlmLabel for="generalNote">General note (Optional)</label>
              <textarea
                id="generalNote"
                class="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                [formGroup]="form"
                formControlName="generalNote"
                placeholder="Write here..."
              ></textarea>
            </div>

            <div class="flex flex-col gap-3 sm:items-end">
              <div class="flex w-full sm:w-[320px] items-center justify-between text-sm">
                <span class="text-muted-foreground">Subtotal</span>
                <span class="font-semibold uppercase"
                  >{{ currency() }} {{ totals().Subtotal.toFixed(2) }}</span
                >
              </div>
              <div class="flex w-full sm:w-[320px] items-center justify-between text-sm">
                <span class="text-muted-foreground">Taxes</span>
                <div class="flex items-center gap-2">
                  <input
                    hlmInput
                    type="number"
                    class="h-9 w-20"
                    [formGroup]="form"
                    formControlName="taxes"
                    (input)="recalcAll()"
                  />
                  <span class="text-muted-foreground">%</span>
                </div>
              </div>
              <div class="flex w-full sm:w-[320px] items-center justify-between text-sm">
                <span class="text-muted-foreground">Discount</span>
                <input
                  hlmInput
                  type="number"
                  class="h-9 w-28"
                  [formGroup]="form"
                  formControlName="discount"
                  (input)="recalcAll()"
                />
              </div>
              <div
                class="flex w-full sm:w-[320px] items-center justify-between border-t border-border pt-3"
              >
                <span class="font-semibold">Total amount</span>
                <span class="text-lg font-bold uppercase"
                  >{{ currency() }} {{ totals().TotalAmount.toFixed(2) }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CreateInvoiceComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _svc = inject(InvoicesService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly banner = signal('');

  readonly form = this._fb.group({
    customerName: ['', Validators.required],
    email: [''],
    phoneNumber: [''],
    billingAddress: [''],
    dueDate: [this._todayInputValue(), Validators.required],
    currency: ['chf', Validators.required],
    generalNote: [''],
    taxes: [0],
    discount: [0],
    items: this._fb.array([] as any[]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  readonly currency = computed(() => String(this.form.value.currency ?? 'chf').toUpperCase());

  readonly totals = computed(() => {
    const items = this.items.getRawValue() as InvoiceItemDetails[];
    return calculateInvoiceTotals(
      items,
      Number(this.form.value.taxes) || 0,
      Number(this.form.value.discount) || 0
    );
  });

  constructor() {
    this.addItem();
  }

  private _todayInputValue(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  back(): void {
    this._router.navigate(['/invoices']);
  }

  preview(): void {
    this.banner.set('Preview is available in React; Angular preview can be added next.');
  }

  addItem(): void {
    this.items.push(
      this._fb.group({
        ItemId: [crypto.randomUUID()],
        ItemName: [''],
        Category: [''],
        Quantity: [0],
        UnitPrice: [0],
        Amount: [0],
        Note: [''],
      })
    );
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) return;
    this.items.removeAt(index);
  }

  recalc(index: number): void {
    const row = this.items.at(index);
    const qty = Number(row.get('Quantity')?.value) || 0;
    const price = Number(row.get('UnitPrice')?.value) || 0;
    row.patchValue({ Amount: Number((qty * price).toFixed(2)) }, { emitEvent: false });
  }

  recalcAll(): void {
    for (let i = 0; i < this.items.length; i++) this.recalc(i);
  }

  submit(action: 'draft' | 'send'): void {
    this.banner.set('');
    this.recalcAll();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.banner.set('Please fill required fields.');
      return;
    }

    const values = this.form.getRawValue();
    const items = values.items as InvoiceItemDetails[];

    const totals = calculateInvoiceTotals(
      items,
      Number(values.taxes) || 0,
      Number(values.discount) || 0
    );

    const payload: AddInvoiceItemParams = {
      input: {
        DateIssued: new Date().toISOString(),
        DueDate: new Date(values.dueDate as string).toISOString(),
        Amount: Number(totals.TotalAmount.toFixed(2)),
        Customer: [
          {
            CustomerName: values.customerName ?? '',
            BillingAddress: values.billingAddress ?? '',
            Email: values.email ?? '',
            PhoneNo: values.phoneNumber ?? '',
          },
        ],
        Currency: this.currency(),
        Status: action === 'send' ? InvoiceStatus.PENDING : InvoiceStatus.DRAFT,
        ItemDetails: items.map((it) => ({
          ItemId: it.ItemId ?? crypto.randomUUID(),
          ItemName: it.ItemName ?? '',
          Category: it.Category ?? '0',
          Quantity: Number(it.Quantity) || 0,
          UnitPrice: Number(it.UnitPrice) || 0,
          Amount: Number(it.Amount) || 0,
          Note: it.Note ?? '',
        })),
        GeneralNote: values.generalNote ?? '',
        Taxes: Number(values.taxes) || 0,
        Discount: Number(values.discount) || 0,
      },
    };

    this._svc
      .addInvoiceItem(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          const id = res?.insertInvoiceItem?.itemId;
          this.banner.set(
            action === 'send' ? 'Invoice sent successfully.' : 'Draft saved successfully.'
          );
          if (id) {
            this._router.navigate(['/invoices', id]);
          } else {
            this._router.navigate(['/invoices']);
          }
        },
        error: () => {
          this.banner.set('Failed to create invoice.');
        },
      });
  }
}
