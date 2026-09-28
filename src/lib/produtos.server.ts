// Server-only helpers for the RegTech store catalogue.
// Read-only: uses the publishable backend key so row-level security still applies.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ProdutoLoja = {
  id: string;
  productCode: string;
  slug: string;
  titulo: string;
  marca: string;
  categoria: string;
  descricao: string;
  preco: number | null;
  emEstoque: boolean;
  destaque: boolean;
  imagemUrl: string | null;
  precoAntigo: number | null;
  avaliacao: number;
  avaliacoes: number;
  sku: string | null;
  variations: Record<string, string[]> | null;
};

export type MarcaLoja = { id: string; nome: string; logoUrl: string | null };


type ProdutoCatalogoRow = {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  stock: number;
  status: "active" | "inactive";
  variations: Record<string, unknown> | null;
  product_categories: { name: string } | { name: string }[] | null;
  marcas: { nome: string } | { nome: string }[] | null;
  product_images: Array<{ image_url: string; is_primary: boolean; display_order: number }>;
};

export async function fetchProdutos(categoria?: string): Promise<ProdutoLoja[]> {
  const supabase = createReader();

  let query = supabase
    .from("products")
    .select("id, product_code, name, description, price, promotional_price, stock, status, variations, created_at, product_categories(name), marcas(nome), product_images(image_url,is_primary,display_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data, error } = await comRetentativa(() => query);
  if (error) {
    console.error("[loja] falha ao carregar produtos:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as ProdutoCatalogoRow[];
  const toSlug = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return rows
    .map((row) => {
      const category = Array.isArray(row.product_categories) ? row.product_categories[0] : row.product_categories;
      const brand = Array.isArray(row.marcas) ? row.marcas[0] : row.marcas;
      const images = Array.isArray(row.product_images) ? row.product_images : [];
      const primary = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order)[0];
      const variations = row.variations && typeof row.variations === "object" && !Array.isArray(row.variations)\n        ? Object.fromEntries(Object.entries(row.variations).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, (value as unknown[]).map(String)]))\n        : null;
      const currentPrice = row.promotional_price ?? row.price;
      return {
        id: row.id,
        productCode: row.product_code,
        slug: row.product_code,
        titulo: row.name,
        marca: brand?.nome ?? "RegTech",
        categoria: toSlug(category?.name ?? "outros"),
        descricao: row.description ?? "",
        preco: currentPrice == null ? null : Number(currentPrice),
        emEstoque: Number(row.stock) > 0,
        destaque: false,
        imagemUrl: primary?.image_url ?? null,
        precoAntigo: row.promotional_price != null ? Number(row.price) : null,
        avaliacao: 0,
        avaliacoes: 0,
        sku: row.sku ?? null,
        variations,
      } satisfies ProdutoLoja;
    })
    .filter((row) => !categoria || row.categoria === categoria);
}




export async function fetchMarcas(): Promise<MarcaLoja[]> {
  const { data, error } = await comRetentativa(() =>
    createReader()
      .from("marcas")
      .select("id, nome, logo_url")
      .eq("ativo", true)
      .order("ordem", { ascending: true }),
  );
  if (error) {
    console.error("[loja] falha ao carregar marcas:", error.message);
    return [];
  }
  return (data ?? []).map((m) => ({ id: m.id, nome: m.nome, logoUrl: m.logo_url }));
}

// Temporary clock drift on the backend ("JWT issued at future") resolves in a
// second or two, so retry a few times before giving up.
async function comRetentativa<T extends { error: { message: string } | null }>(
  fn: () => PromiseLike<T>,
): Promise<T> {
  let r = await fn();
  for (let i = 0; i < 3 && r.error && /future|JWT/i.test(r.error.message); i++) {
    await new Promise((res) => setTimeout(res, 1000));
    r = await fn();
  }
  return r;
}
