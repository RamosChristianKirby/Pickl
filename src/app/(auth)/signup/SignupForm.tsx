"use client";

import { useActionState } from "react";
import { signup } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";
import Link from "next/link";
import { USERNAME_PATTERN, USERNAME_RULE } from "@/lib/utils";
import { SITE } from "@/lib/site";

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
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-500">@</span>
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
      <fieldset className="space-y-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
        <legend className="sr-only">Agreements</legend>
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-brand-700 underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-brand-700 underline underline-offset-2">
              Privacy Policy
            </Link>
            , and I consent to Pickl processing my information as described there.
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name="age" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
          <span>
            I am at least {SITE.minAge} years old. If I&apos;m under 18, a parent or guardian has agreed to these terms.
          </span>
        </label>
      </fieldset>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
