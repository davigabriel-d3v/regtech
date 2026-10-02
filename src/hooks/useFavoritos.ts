import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProdutoLoja } from "@/lib/produtos.functions";

let cache: string[] | null = null;
let loadingPromise: Promise<string[]> | null = null;

async function carregar(): Promise<string[]> {
  if (cache) return cache;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const local = JSON.parse(localStorage.getItem("regtech-favs") ?? "[]") as string[];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        cache = local;
        return local;
      }
      const { data } = await (supabase as any).from("product_favorites").select("product_id").eq("user_id", user.id);
      const ids = Array.from(new Set([...local, ...((data ?? []) as { product_id: string }[]).map((x) => x.product_id)]));
      cache = ids;
      localStorage.setItem("regtech-favs", JSON.stringify(ids));
      return ids;
    })().finally(() => { loadingPromise = null; });
  }
  return loadingPromise;
}

export function useFavoritos() {
  const [favs, setFavs] = useState<string[]>(cache ?? []);
  useEffect(() => {
    let ativo = true;
    carregar().then((ids) => { if (ativo) setFavs(ids); }).catch(() => {});
    const sync = () => setFavs(JSON.parse(localStorage.getItem("regtech-favs") ?? "[]"));
    window.addEventListener("regtech-favs", sync);
    return () => { ativo = false; window.removeEventListener("regtech-favs", sync); };
  }, []);

  const alternar = async (id: string, produto?: ProdutoLoja) => {
    const atual = cache ?? JSON.parse(localStorage.getItem("regtech-favs") ?? "[]");
    const novo = atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id];
    cache = novo;
    localStorage.setItem("regtech-favs", JSON.stringify(novo));
    window.dispatchEvent(new Event("regtech-favs"));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (novo.includes(id)) {
        await (supabase as any).from("product_favorites").upsert({ user_id: user.id, product_id: id }, { onConflict: "user_id,product_id" });
      } else {
        await (supabase as any).from("product_favorites").delete().eq("user_id", user.id).eq("product_id", id);
      }
    }
    return produto;
  };
  return { favs, alternar };
}
