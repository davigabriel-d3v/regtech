import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProdutoLoja } from "@/lib/produtos.functions";

const cache = new Map<string, string[]>();
const loading = new Map<string, Promise<string[]>>();

async function getContext() {
  const { data: { user } } = await supabase.auth.getUser();
  return { user, key: user ? "user:" + user.id : "guest" };
}

async function carregar() {
  const { user, key } = await getContext();
  if (cache.has(key)) return { ids: cache.get(key) ?? [], user, key };
  if (!loading.has(key)) {
    loading.set(key, (async () => {
      const storageKey = user ? "regtech-favs-" + user.id : "regtech-favs";
      const local = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
      if (!user) {
        cache.set(key, local);
        return local;
      }
      const { data } = await (supabase as any).from("product_favorites").select("product_id").eq("user_id", user.id);
      const ids = Array.from(new Set([...local, ...((data ?? []) as { product_id: string }[]).map((x) => x.product_id)]));
      cache.set(key, ids);
      localStorage.setItem(storageKey, JSON.stringify(ids));
      return ids;
    })().finally(() => loading.delete(key)));
  }
  return { ids: await loading.get(key)!, user, key };
}

export function useFavoritos() {
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    let ativo = true;
    carregar().then(({ ids }) => { if (ativo) setFavs(ids); }).catch(() => {});
    const sync = () => carregar().then(({ ids }) => { if (ativo) setFavs(ids); }).catch(() => {});
    window.addEventListener("regtech-favs", sync);
    const { data: authSub } = supabase.auth.onAuthStateChange(() => { cache.clear(); sync(); });
    return () => { ativo = false; window.removeEventListener("regtech-favs", sync); authSub.subscription.unsubscribe(); };
  }, []);

  const alternar = async (id: string, produto?: ProdutoLoja) => {
    const { user, key } = await getContext();
    const atual = cache.get(key) ?? [];
    const novo = atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id];
    cache.set(key, novo);
    const storageKey = user ? "regtech-favs-" + user.id : "regtech-favs";
    localStorage.setItem(storageKey, JSON.stringify(novo));
    window.dispatchEvent(new Event("regtech-favs"));
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
