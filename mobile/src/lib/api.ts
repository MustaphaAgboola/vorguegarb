import { supabase } from "./supabase";

export async function api(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  return fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${data.session?.access_token}`,
    },
  });
}