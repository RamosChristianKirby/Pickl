"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/actions/account";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function DeleteAccount() {
  const [state, action] = useActionState(deleteAccount, undefined);
  const [confirm, setConfirm] = useState("");

  return (
    <section className="card p-5 ring-rose-200 sm:p-6" aria-labelledby="delete-account">
      <h2 id="delete-account" className="text-lg font-bold text-ink">
        Delete account
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        This permanently deletes your profile, photos, posts, comments, likes, follows, clubs you own, check-ins and match history. It
        can&apos;t be undone.{" "}
        <Link href="/data-deletion" className="font-semibold text-brand-700 underline underline-offset-2">
          What gets deleted
        </Link>
      </p>
      <form action={action} className="mt-4 space-y-3">
        <div>
          <label htmlFor="confirm" className="label">
            Type DELETE to confirm
          </label>
          <input id="confirm" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="input" placeholder="DELETE" />
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn w-full bg-rose-600 text-white hover:bg-rose-500 sm:w-auto" pendingText="Deleting…" disabled={confirm.trim() !== "DELETE"}>
          <Trash2 className="h-4 w-4" /> Delete my account
        </SubmitButton>
      </form>
    </section>
  );
}
