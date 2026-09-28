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


type ProdutoRow = Database["public"]["Tables"]["produtos"]["Row"];

function isNewBackendKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createBackendFetch(backendKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New backend keys are opaque strings, not bearer tokens.
    if (
      isNewBackendKey(backendKey) &&
      headers.get("Authorization") === `Bearer ${backendKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", backendKey);
    return fetch(input, { ...init, headers });
  };
}

function createReader(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("Missing backend environment variables for the store.");
  }

  return createClient<Database>(url, key, {
    global: { fetch: createBackendFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toProduto(row: ProdutoRow): ProdutoLoja {
  return {
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    marca: row.marca,
    categoria: row.categoria,
    descricao: row.descricao ?? "",
    preco: row.preco === null ? null : Number(row.preco),
    emEstoque: row.em_estoque,
    destaque: row.destaque,
    imagemUrl: row.imagem_url,
    precoAntigo: row.preco_antigo === null ? null : Number(row.preco_antigo),
    avaliacao: Number(row.avaliacao),
    avaliacoes: row.avaliacoes,
  };
}

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

  const rows = (data ?? []) as Array<any>;
  const toSlug = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return rows
    .map((row) => {
      const category = Array.isArray(row.product_categories) ? row.product_categories[0] : row.product_categories;
      const brand = Array.isArray(row.marcas) ? row.marcas[0] : row.marcas;
      const images = Array.isArray(row.product_images) ? row.product_images : [];
      const primary = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order)[0];
      const variations = row.variations && typeof row.variations === "object" && !Array.isArray(row.variations) ? row.variations : null;
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
