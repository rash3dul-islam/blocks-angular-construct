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
        <h1 class="mb-4 text-2xl font-bold leading-8 text-[#0F0F0F] [font-family:'Nunito_Sans',sans-serif]">
          Email sent
        </h1>
        <p class="text-base font-normal leading-6 text-[#4F4F4F] [font-family:'Nunito_Sans',sans-serif]">
          An email has been sent to your registered email address.Please, follow the link on the
          email to continue your sign up.
        </p>
      </div>

      <button
        type="button"
        routerLink="/login"
        class="h-12 w-full cursor-pointer rounded-md bg-[#018381] px-8 text-sm font-extrabold leading-5 text-white [font-family:'Nunito_Sans',sans-serif] transition-colors hover:bg-[#01706f]"
      >
        Go to log in
      </button>

      <button
        type="button"
        routerLink="/forgot-password"
        class="-mt-2 h-11 w-full cursor-pointer rounded-md bg-[#F4F4F5] px-8 text-sm font-extrabold leading-5 text-[#18181B] [font-family:'Nunito_Sans',sans-serif] transition-colors hover:bg-[#e9e9eb]"
      >
        Change email address
      </button>
    </div>
  `,
})
export class EmailSentComponent {}
