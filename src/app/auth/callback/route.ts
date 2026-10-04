import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LINK_EXPIRED_MESSAGE, safeNextPath } from "@/lib/auth-messages";

/**
 * Email-confirmation (PKCE) handler.
 *
 * How the confirmation link works: the link in the email first goes to Supabase, which checks the
 * token and marks the email as confirmed. Only after that succeeds does Supabase send the browser
 * here with a one-time `?code=`. So if we receive a code, the email IS confirmed — even when this
 * browser can't turn the code into a session (e.g. the link was opened on another device).
 * If the token was bad or expired, Supabase sends `?error_code=...` instead of a code.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  if (errorCode || errorDescription) {
    const message = errorCode === "otp_expired" ? LINK_EXPIRED_MESSAGE : (errorDescription ?? "That link didn't work.");
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);

    // Email is confirmed (see above); this browser just can't sign in automatically.
    return NextResponse.redirect(`${origin}/login?notice=confirmed&next=${encodeURIComponent(next)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is incomplete. Try logging in below.")}`);
}
