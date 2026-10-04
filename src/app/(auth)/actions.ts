"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { USERNAME_RULE, isValidUsername } from "@/lib/utils";

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/feed";
}

export type LoginState = (ActionState & { email?: string; unconfirmed?: boolean }) | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Supabase only reports "email not confirmed" after the password checks out, so this
    // tells the real owner their status without revealing anything to someone guessing emails.
    if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
      return { error: "Your email isn't confirmed yet. Check your inbox for the link, or send a new one.", email, unconfirmed: true };
    }
    if (/rate|too many/i.test(error.message)) return { error: "Too many attempts. Please wait a minute and try again.", email };
    // Keep this generic so the login form can't be used to discover which emails have accounts.
    return { error: "Incorrect email or password.", email };
  }

  redirect(safeNext(formData.get("next")));
}

export async function resendConfirmation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email first." };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/settings` },
  });
  if (error && /rate|too many|seconds/i.test(error.message)) {
    return { error: "Please wait a minute before asking for another link." };
  }
  // Same answer either way, so this can't be used to check which emails have accounts.
  return { success: "If that account still needs confirming, a new link is on its way. Check your inbox." };
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) return { error: "Please enter your name." };
  if (!username) return { error: "Please choose a username." };
  if (!isValidUsername(username)) return { error: USERNAME_RULE };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();

  // Visitors who aren't logged in can't read profiles, so ask the database via a narrow function.
  const { data: available } = await supabase.rpc("username_available", { p_username: username });
  if (available === false) return { error: "That username is already taken." };

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/settings`,
    },
  });
  if (error) {
    if (/password/i.test(error.message)) return { error: error.message };
    if (/rate|too many/i.test(error.message)) return { error: "Too many attempts. Please wait a minute and try again." };
    return { error: "We couldn't create that account. If you already have one, try logging in instead." };
  }

  // If email confirmation is disabled in Supabase, we get a session right away.
  if (data.session) redirect("/settings?welcome=1");

  return { success: "Almost there! Check your inbox and confirm your email to start playing." };
}
