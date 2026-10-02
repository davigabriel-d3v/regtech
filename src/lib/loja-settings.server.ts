import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_LOJA_SETTINGS, type LojaSettings } from "./loja-settings";

function createReader(): SupabaseClient<Database> {
  const configuredUrl = process.env.SUPABASE_URL;
  const configuredKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const url = configuredUrl === SUPABASE_PROJECT_URL ? configuredUrl : SUPABASE_PROJECT_URL;
  const key = configuredKey === SUPABASE_PUBLISHABLE_KEY ? configuredKey : SUPABASE_PUBLISHABLE_KEY;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function fetchLojaSettings(): Promise<LojaSettings> {
  const { data, error } = await createReader()
    .from("shop_settings")
    .select("id,whatsapp_phone,offers_enabled,offers_title,offers_subtitle,offers_limit,featured_enabled,featured_title,featured_subtitle,featured_limit")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) return DEFAULT_LOJA_SETTINGS;

  return {
    id: data.id,
    whatsappPhone: data.whatsapp_phone,
    offersEnabled: data.offers_enabled,
    offersTitle: data.offers_title,
    offersSubtitle: data.offers_subtitle,
    offersLimit: data.offers_limit,
    featuredEnabled: data.featured_enabled,
    featuredTitle: data.featured_title,
    featuredSubtitle: data.featured_subtitle,
    featuredLimit: data.featured_limit,
  };
}

export type { LojaSettings };
