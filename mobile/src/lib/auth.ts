import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "./supabase";

// Lets the in-app browser close itself and hand control back to the app, which is required
// on web and harmless (a no-op) on native.
WebBrowser.maybeCompleteAuthSession();

/** Read the PKCE `code` from the callback URL's query string, if present. */
function readCode(url: string): string | null {
  const query = url.split("#")[0].split("?")[1];
  if (!query) return null;
  return new URLSearchParams(query).get("code");
}

/** Read implicit-flow tokens from the callback URL's fragment (`#access_token=...`). */
function readFragmentTokens(
  url: string
): { access_token: string; refresh_token: string } | null {
  const fragment = url.split("#")[1];
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

/**
 * Starts the Google OAuth flow in an in-app browser and stores the resulting Supabase
 * session. Returns the signed-in user's email, or null if the user cancelled.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const redirectTo = makeRedirectUri({ path: "auth/callback" });
  console.log("REDIRECT TO:", redirectTo);
  


  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in could not be started.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  // The user dismissed the browser or it failed — nothing to exchange.
  if (result.type !== "success") return null;

  // PKCE flow: Supabase redirects back with a `?code=` we exchange for a session.
  const code = readCode(result.url);
  if (code) {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return sessionData.session?.user.email ?? null;
  }

  // Implicit flow fallback: tokens arrive in the URL fragment.
  const tokens = readFragmentTokens(result.url);
  if (!tokens) throw new Error("Google sign-in did not return a session.");

  const { data: sessionData, error: setSessionError } = await supabase.auth.setSession(tokens);
  if (setSessionError) throw setSessionError;
  return sessionData.session?.user.email ?? null;
}


