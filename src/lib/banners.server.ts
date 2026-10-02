import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_BANNERS, type BannerPrincipal } from "./banners";

function createReader(): SupabaseClient<Database> {
  const configuredUrl = process.env.SUPABASE_URL;
  const configuredKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const url = configuredUrl === SUPABASE_PROJECT_URL ? configuredUrl : SUPABASE_PROJECT_URL;
  const key = configuredKey === SUPABASE_PUBLISHABLE_KEY ? configuredKey : SUPABASE_PUBLISHABLE_KEY;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function fetchBanners(): Promise<BannerPrincipal[]> {
  const { data, error } = await createReader()
    .from("shop_banners")
    .select("id,title,subtitle,badge,button_label,action_type,action_value,icon_name,background_image_url,background_mobile_image_url,overlay_opacity,text_align,active,display_order,autoplay_seconds")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) return DEFAULT_BANNERS;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    badge: row.badge,
    buttonLabel: row.button_label,
    actionType: row.action_type as BannerPrincipal["actionType"],
    actionValue: row.action_value,
    iconName: row.icon_name,
    backgroundImageUrl: row.background_image_url,
    backgroundMobileImageUrl: row.background_mobile_image_url,
    overlayOpacity: Number(row.overlay_opacity),
    textAlign: row.text_align as BannerPrincipal["textAlign"],
    active: row.active,
    displayOrder: row.display_order,
    autoplaySeconds: row.autoplay_seconds,
  }));
}
