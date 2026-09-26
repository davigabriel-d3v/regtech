// Server-only helpers for the RegTech store catalogue.
// Read-only: uses the publishable backend key so row-level security still applies.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ProdutoLoja = {
  id: string;
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
    .from("produtos")
    .select("*")
    .eq("publicado", true)
    .order("ordem", { ascending: true })
    .order("titulo", { ascending: true });

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(toProduto);
}


export async function fetchMarcas(): Promise<MarcaLoja[]> {
  const { data, error } = await createReader()
    .from("marcas")
    .select("id, nome, logo_url")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({ id: m.id, nome: m.nome, logoUrl: m.logo_url }));
}
