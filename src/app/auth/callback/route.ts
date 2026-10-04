import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / PKCE code-exchange handler.
 * Note: PKCE links only work in the same browser that started the sign-up.
 * For email confirmation, prefer /auth/confirm (see README).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/feed";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/feed";

  // Supabase passes errors back as query params (e.g. otp_expired).
  const errorDescription = searchParams.get("error_description");
  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);

    // Most common cause: the link was opened in a different browser/device than the one used to sign up.
    // Supabase has usually already confirmed the email at this point, so logging in works.
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Your email is probably confirmed, but this browser couldn't finish signing you in. Please log in below.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is invalid or has expired.")}`);
}
