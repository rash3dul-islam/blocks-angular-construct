// ─── Email Sent Page (React: /sent-email) ─────────────────────────────────────
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-sent',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex w-full max-w-[460px] flex-col gap-8">
      <img
        src="/images/email_sent.svg"
        alt="Email sent"
        class="mx-auto h-[130px] w-[130px] object-contain"
      />

      <div class="text-left">
        <h1 class="mb-4 text-2xl font-bold text-foreground">Email sent</h1>
        <p class="text-base font-normal leading-6 text-[#4F4F4F] [font-family:'Nunito_Sans',sans-serif]">
          An email has been sent to your registered email address.Please, follow the link on the
          email to continue your sign up.
        </p>
      </div>

      <button
        type="button"
        routerLink="/login"
        class="h-12 w-full rounded-md bg-primary text-xl font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go to log in
      </button>

      <a
        routerLink="/forgot-password"
        class="-mt-2 text-center text-xl font-semibold text-primary transition-colors hover:text-primary/90 hover:underline"
      >
        Change email address
      </a>
    </div>
  `,
})
export class EmailSentComponent {}
