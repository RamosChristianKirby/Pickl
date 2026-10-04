"use client";

import { useState, useTransition } from "react";
import { Check, LogOut, Plus } from "lucide-react";
import { setMembership } from "@/lib/actions/clubs";

export function JoinClubButton({ clubId, isMember, isOwner }: { clubId: string; isMember: boolean; isOwner: boolean }) {
  const [member, setMember] = useState(isMember);
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();

  if (isOwner) {
    return (
      <span className="btn-secondary cursor-default">
        <Check className="h-4 w-4" /> You own this club
      </span>
    );
  }

  const onClick = () => {
    const next = !member;
    setMember(next);
    startTransition(async () => {
      const res = await setMembership(clubId, next);
      if (res?.error) setMember(!next);
    });
  };

  if (member) {
    return (
      <button
        type="button"
        onClick={onClick}
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

  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn-primary min-w-32">
      <Plus className="h-4 w-4" /> Join club
    </button>
  );
}
