"use client";

import { useActionState } from "react";
import { signup } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";
import { USERNAME_PATTERN, USERNAME_RULE } from "@/lib/utils";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);

  if (state?.success) {
    return <FormMessage state={state} />;
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="label">Full name</label>
        <input id="full_name" name="full_name" autoComplete="name" required className="input" placeholder="Jordan Rivera" />
      </div>
      <div>
        <label htmlFor="username" className="label">Username</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-400">@</span>
          <input
            id="username"
            name="username"
            required
            maxLength={50}
            pattern={USERNAME_PATTERN}
            title={USERNAME_RULE}
            className="input pl-8"
            placeholder="jordan_dinks"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" placeholder="At least 8 characters" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
