import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Supabase redirects here with a `code` after Google sign-in.
 * We exchange it for a session cookie, then send the user back to the page
 * they came from (relative paths only, to prevent open redirects).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/shop";

  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/shop";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
