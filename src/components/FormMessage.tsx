import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/lib/types";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.error && !state?.success) return null;
  const isError = Boolean(state.error);
  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200"
          : "flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-200"
      }
    >
      {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{state.error ?? state.success}</span>
    </div>
  );
}
