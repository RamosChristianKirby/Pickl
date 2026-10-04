import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Email confirmation link handler (token-hash flow).
 * Works even if the link is opened in a different browser or device than the one used to sign up.
 * Email template link: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/settings
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/feed";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/feed";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        `${error.message}. If you already confirmed your email, just log in. Otherwise sign up again to get a new link.`,
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That confirmation link is incomplete.")}`);
}
