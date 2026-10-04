"use client";

import { useState, useTransition } from "react";
import { Check, Lock, LogOut, Plus } from "lucide-react";
import { setMembership } from "@/lib/actions/clubs";

export function JoinClubButton({
  clubId,
  isMember,
  isOwner,
  isPrivate = false,
}: {
  clubId: string;
  isMember: boolean;
  isOwner: boolean;
  isPrivate?: boolean;
}) {
  const [member, setMember] = useState(isMember);
  const [hover, setHover] = useState(false);
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isOwner) {
    return (
      <span className="btn-secondary cursor-default">
        <Check className="h-4 w-4" /> You own this club
      </span>
    );
  }

  const change = (join: boolean, pw?: string) => {
    setError(null);
    startTransition(async () => {
      const res = await setMembership(clubId, join, pw);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setMember(join);
      setAsking(false);
      setPassword("");
    });
  };

  if (member) {
    return (
      <button
        type="button"
        onClick={() => change(false)}
        disabled={pending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="btn-secondary min-w-32"
      >
        {hover ? <LogOut className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        {hover ? "Leave club" : "Joined"}
      </button>
    );
  }

  if (isPrivate && asking) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change(true, password);
        }}
        className="flex w-full flex-col gap-2 sm:w-auto"
      >
        <div className="flex gap-2">
          <input
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Club password"
            className="input min-w-0 flex-1 sm:w-44"
            aria-label="Club password"
          />
          <button type="submit" disabled={pending || !password} className="btn-primary">
            Join
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button type="button" onClick={() => (isPrivate ? setAsking(true) : change(true))} disabled={pending} className="btn-primary min-w-32">
        {isPrivate ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {isPrivate ? "Join with password" : "Join club"}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
