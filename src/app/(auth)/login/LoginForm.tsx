"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { login, resendConfirmation, type LoginState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";

/** Shown only after Supabase says this account's email isn't confirmed yet. */
function ResendConfirmation({ email }: { email: string }) {
  const [state, action] = useActionState(resendConfirmation, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <FormMessage state={state} />
      <SubmitButton className="btn-secondary w-full" pendingText="Sending…">
        <MailCheck className="h-4 w-4" /> Send a new confirmation link
      </SubmitButton>
    </form>
  );
}

export function LoginForm({ next, initialError, initialNotice }: { next: string; initialError?: string; initialNotice?: string }) {
  const initial: LoginState = initialError ? { error: initialError } : initialNotice ? { success: initialNotice } : undefined;
  const [state, action] = useActionState(login, initial);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state?.email ?? ""}
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" placeholder="••••••••" />
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </form>
      {state?.unconfirmed && state.email && <ResendConfirmation key={state.email} email={state.email} />}
    </div>
  );
}
