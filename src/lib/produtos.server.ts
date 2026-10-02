import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "@/integrations/supabase/config";
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

export type MarcaLoja = {
  id: string;
  nome: string;
  logoUrl: string | null;
};

type ProductRow = {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  price: number;
  promotional_price: number | null;
  stock: number;
  status: "active" | "inactive";
  sku: string | null;
  variations: Record<string, unknown> | null;
  created_at: string;
};

type CategoryRow = { id: string; name: string };
type BrandRow = { id: string; nome: string };
type ImageRow = {
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function normalizeVariations(
  value: Record<string, unknown> | null,
): Record<string, string[]> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([, raw]) => Array.isArray(raw))
      .map(([key, raw]) => [key, (raw as unknown[]).map(String)]),
  );
  return Object.keys(result).length ? result : null;
}

export async function fetchProdutos(categoria?: string): Promise<ProdutoLoja[]> {
  const client = createReader();

  const { data: productData, error: productError } = await client
    .from("products")
    .select(
      "id,product_code,name,description,category_id,brand_id,price,promotional_price,stock,status,sku,variations,created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (productError) {
    console.error("[loja] falha ao carregar produtos:", productError.message);
    return [];
  }

  const [categoriesResult, brandsResult, imagesResult] = await Promise.all([
    client.from("product_categories").select("id,name"),
    client.from("marcas").select("id,nome").eq("ativo", true),
    client
      .from("product_images")
      .select("product_id,image_url,is_primary,display_order")
      .order("display_order"),
  ]);

  if (categoriesResult.error) {
    console.error(
      "[loja] falha ao carregar categorias:",
      categoriesResult.error.message,
    );
  }
  if (brandsResult.error) {
    console.error(
      "[loja] falha ao carregar marcas:",
      brandsResult.error.message,
    );
  }
  if (imagesResult.error) {
    console.error(
      "[loja] falha ao carregar imagens:",
      imagesResult.error.message,
    );
  }

  const categories = new Map(
    ((categoriesResult.data ?? []) as CategoryRow[]).map((row) => [
      row.id,
      row.name,
    ]),
  );
  const brands = new Map(
    ((brandsResult.data ?? []) as BrandRow[]).map((row) => [
      row.id,
      row.nome,
    ]),
  );

  const imagesByProduct = new Map<string, ImageRow[]>();
  for (const image of (imagesResult.data ?? []) as ImageRow[]) {
    const list = imagesByProduct.get(image.product_id) ?? [];
    list.push(image);
    imagesByProduct.set(image.product_id, list);
  }

  return ((productData ?? []) as ProductRow[])
    .map((row) => {
      const categoryName = categories.get(row.category_id ?? "") ?? "Outros";
      const brandName = brands.get(row.brand_id ?? "") ?? "RegTech";
      const images = imagesByProduct.get(row.id) ?? [];
      const primary = [...images].sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          a.display_order - b.display_order,
      )[0];
      const currentPrice = row.promotional_price ?? row.price;

      return {
        id: row.id,
        productCode: row.product_code,
        slug: row.product_code,
        titulo: row.name,
        marca: brandName,
        categoria: slugify(categoryName),
        descricao: row.description ?? "",
        preco: Number.isFinite(Number(currentPrice))
          ? Number(currentPrice)
          : null,
        emEstoque: Number(row.stock) > 0,
        destaque: row.promotional_price != null,
        imagemUrl: primary?.image_url ?? null,
        precoAntigo:
          row.promotional_price != null ? Number(row.price) : null,
        avaliacao: 0,
        avaliacoes: 0,
        sku: row.sku ?? null,
        variations: normalizeVariations(row.variations),
      } satisfies ProdutoLoja;
    })
    .filter((row) => !categoria || row.categoria === categoria);
}

export async function fetchMarcas(): Promise<MarcaLoja[]> {
  const { data, error } = await comRetentativa(() =>
    createReader()
      .from("marcas")
      .select("id,nome,logo_url")
      .eq("ativo", true)
      .order("ordem", { ascending: true }),
  );

  if (error) {
    console.error("[loja] falha ao carregar marcas:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    logoUrl: row.logo_url,
  }));
}

async function comRetentativa<T extends { error: { message: string } | null }>(
  fn: () => PromiseLike<T>,
): Promise<T> {
  let result = await fn();
  for (
    let attempt = 0;
    attempt < 3 && result.error && /future|JWT/i.test(result.error.message);
    attempt++
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    result = await fn();
  }
  return result;
}

function createReader(): SupabaseClient<Database> {
  const configuredUrl = process.env.SUPABASE_URL;
  const configuredKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  const url =
    configuredUrl === SUPABASE_PROJECT_URL
      ? configuredUrl
      : SUPABASE_PROJECT_URL;
  const key =
    configuredKey === SUPABASE_PUBLISHABLE_KEY
      ? configuredKey
      : SUPABASE_PUBLISHABLE_KEY;

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
