import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";
import {
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "./config";

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // Modern sb_* publishable keys are API keys, not JWT access tokens.
    if (headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  // The production app is intentionally pinned to the new REGTECH CELLSHOP
  // Supabase project. Environment variables remain supported, but stale
  // values from an older/deleted project are ignored.
  const configuredUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
  const configuredKey =
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;

  const supabaseUrl =
    configuredUrl === SUPABASE_PROJECT_URL
      ? configuredUrl
      : SUPABASE_PROJECT_URL;
  const supabaseKey =
    configuredKey === SUPABASE_PUBLISHABLE_KEY
      ? configuredKey
      : SUPABASE_PUBLISHABLE_KEY;

  return createClient<Database>(supabaseUrl, supabaseKey, {
    global: { fetch: createSupabaseFetch(supabaseKey) },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}

let client: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createSupabaseClient>,
  {
    get(_, prop, receiver) {
      if (!client) client = createSupabaseClient();
      return Reflect.get(client, prop, receiver);
    },
  },
);

export async function invokeAuthorizedFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
) {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  let session = sessionData.session;

  if (session) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();
    if (!refreshError) session = refreshed.session ?? session;
  }

  if (sessionError || !session?.access_token) {
    return {
      data: null as T | null,
      error: new Error("Sessão expirada. Entre novamente para continuar."),
    };
  }

  return supabase.functions.invoke<T>(functionName, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}
