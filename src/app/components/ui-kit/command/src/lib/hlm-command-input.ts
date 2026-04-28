import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { BrnCommandInput } from '@spartan-ng/brain/command';
import { classes } from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-command-input',
  // `@spartan-ng/helm/input-group` is not installed in this repo.
  // Keep the command input standalone and style it directly.
  imports: [NgIcon, BrnCommandInput],
  providers: [provideIcons({ lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex h-8 items-center gap-2 rounded-lg border border-input bg-input/30 px-2 shadow-none"
    >
      <input
        brnCommandInput
        data-slot="command-input"
        class="w-full bg-transparent text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
        [id]="id()"
        [placeholder]="placeholder()"
      />

      <ng-icon name="lucideSearch" class="text-muted-foreground" />
    </div>
  `,
})
export class HlmCommandInput {
  public readonly id = input<string | undefined>();
  public readonly placeholder = input<string>('');

  constructor() {
    classes(() => 'p-1 pb-0');
  }
}
