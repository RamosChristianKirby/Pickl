"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action] = useActionState(login, initialError ? { error: initialError } : undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" />
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
  );
}
