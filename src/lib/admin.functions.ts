import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

function gerarCodigoProduto(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "PROD-";
  for (let i = 0; i < 6; i++) codigo += chars[Math.floor(Math.random() * chars.length)];
  return codigo;
}

function gerarNumeroPedido(): string {
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `PED-${num}`;
}

/* ---------- Dashboard ---------- */
export const listarDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;
  const [pedidosRes, produtosRes] = await Promise.all([
    supabase.from("pedidos").select("*").order("criado_em", { ascending: false }).limit(5),
    supabase.from("produtos").select("*").order("criado_em", { ascending: false }).limit(5),
  ]);
  const pedidos = (pedidosRes.data ?? []) as any[];
  const produtos = (produtosRes.data ?? []) as any[];
  return {
    novos_pedidos: pedidos.filter((p: any) => p.status === "NOVO").length,
    em_analise: pedidos.filter((p: any) => p.status === "EM_ANALISE").length,
    em_andamento: pedidos.filter((p: any) => p.status === "EM_ANDAMENTO").length,
    concluidos: pedidos.filter((p: any) => p.status === "CONCLUIDO").length,
    cancelados: pedidos.filter((p: any) => p.status === "CANCELADO").length,
    total_produtos: produtos.length,
    produtos_ativos: produtos.filter((p: any) => p.publicado !== false).length,
    sem_estoque: produtos.filter((p: any) => !p.em_estoque || (p.stock !== undefined && p.stock === 0)).length,
    ultimos_pedidos: pedidos.slice(0, 5).map((p: any) => ({
      id: p.id, order_number: p.order_number, customer_name: p.customer_name,
      product_name: p.product_name, product_code: p.product_code, status: p.status, created_at: p.created_at,
    })),
    ultimos_produtos: produtos.slice(0, 5).map((p: any) => ({
      id: p.id, product_code: p.product_code, name: p.titulo ?? "—", price: Number(p.preco ?? 0),
      stock: p.stock ?? (p.em_estoque ? 1 : 0), status: p.publicado ? "ATIVO" : "INATIVO", created_at: p.criado_em,
    })),
    atividades: [{ acao: "Painel acessado", usuario: "Admin", data: new Date().toISOString().split("T")[0], hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }],
  };
});

/* ---------- Produtos ---------- */
export const listarProdutos = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("produtos").select("*").order("criado_em", { ascending: false });
  if (error) return [];
  return (data ?? []) as any[];
});

export const cadastrarProduto = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ titulo: string; descricao: string; categoria: string; marca: string; sku: string; barcode: string; preco: number; promotional_price?: number; stock: number; minimum_stock: number; status: string; notes?: string }>(null).text().then(async (t) => JSON.parse(t));
  const product_code = gerarCodigoProduto();
  const { data, error } = await supabase.from("produtos").insert({
    product_code, titulo: body.titulo, descricao: body.descricao, categoria: body.categoria,
    marca: body.marca, sku: body.sku, barcode: body.barcode, preco: body.preco,
    promotional_price: body.promotional_price ?? null, em_estoque: body.stock > 0,
    stock: body.stock, minimum_stock: body.minimum_stock, publicado: body.status === "ATIVO",
    notes: body.notes ?? null, avaliacoes: 0, avaliacao: 0, ordem: 0, destaque: false,
    slug: body.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  }).select().single();
  if (error) throw new Error(`Erro ao cadastrar produto: ${error.message}`);
  return { data, product_code };
});

export const editarProduto = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ id: string; titulo: string; descricao: string; categoria: string; marca: string; sku: string; barcode: string; preco: number; promotional_price?: number; stock: number; minimum_stock: number; status: string; notes?: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data, error } = await supabase.from("produtos").update({
    titulo: body.titulo, descricao: body.descricao, categoria: body.categoria, marca: body.marca,
    sku: body.sku, barcode: body.barcode, preco: body.preco, promotional_price: body.promotional_price ?? null,
    stock: body.stock, em_estoque: body.stock > 0, minimum_stock: body.minimum_stock,
    publicado: body.status === "ATIVO", notes: body.notes ?? null, atualizado_em: new Date().toISOString(),
  }).eq("id", body.id).select().single();
  if (error) throw new Error(`Erro ao editar produto: ${error.message}`);
  return data;
});

export const excluirProduto = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ id: string }>(null).text().then(async (t) => JSON.parse(t));
  const { error } = await supabase.from("produtos").delete().eq("id", body.id);
  if (error) throw new Error(`Erro ao excluir: ${error.message}`);
  return { success: true };
});

export const alternarStatusProduto = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ id: string; status: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data, error } = await supabase.from("produtos").update({ publicado: body.status === "ATIVO", atualizado_em: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) throw new Error(`Erro ao alterar status: ${error.message}`);
  return data;
});

export type PedidoRow = { id: string; cliente: string; data: string; valor: number; status: string };
export type VendaRow = { id: string; data: string; valor: number };
export type ClienteRow = { id: string; nome: string; email: string; criado_em: string };
export type ProdutoRow = { id: string; titulo: string; categoria: string; quantidade_vendida: number; receita: number; estoque: number };
export type AtividadeRow = { acao: string; usuario: string; data: string; hora: string };
export type NotificacaoRow = { id: string; texto: string; lida: boolean; area: string };

/* helpers */
function isNewBackendKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createBackendFetch(backendKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (isNewBackendKey(backendKey) && headers.get("Authorization") === `Bearer ${backendKey}`) headers.delete("Authorization");
    headers.set("apikey", backendKey);
    return fetch(input, { ...init, headers });
  };
}
function createReader(): SupabaseClient<any> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing env vars for admin.");
  return createClient<any>(url, key, { global: { fetch: createBackendFetch(key) }, auth: { persistSession: false, autoRefreshToken: false } });
}
async function safeFetch<T>(fn: () => PromiseLike<{ data: any; error: any }>): Promise<T[]> {
  try { const { data, error } = await fn(); if (error) return []; return (data ?? []) as T[]; } catch { return []; }
}

/* ---------- Vendas ---------- */
export const listarVendas = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("vendas").select("*").order("criado_em", { ascending: false }).limit(30);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, data: r.criado_em, valor: Number(r.valor) }));
});

/* ---------- Pedidos ---------- */
export const listarPedidos = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("pedidos").select("*").order("criado_em", { ascending: false });
  if (error) return [];
  return (data ?? []) as any[];
});

export const buscarPedido = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ id: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data, error } = await supabase.from("pedidos").select("*").eq("id", body.id).maybeSingle();
  if (error) return null;
  return data;
});

export const alterarStatusPedido = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ id: string; status: string; userId: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data: pedido } = await supabase.from("pedidos").select("status").eq("id", body.id).maybeSingle();
  const oldStatus = pedido?.status ?? "NOVO";
  const { data, error } = await supabase.from("pedidos").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) throw new Error(`Erro ao alterar status: ${error.message}`);
  await supabase.from("order_status_history").insert({ order_id: body.id, old_status: oldStatus, new_status: body.status, changed_by: body.userId });
  return data;
});

/* ---------- Clientes ---------- */
export const listarClientes = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as any[];
});

export const cadastrarCliente = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ name: string; email: string; phone: string; whatsapp: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data, error } = await supabase.from("customers").insert({ name: body.name, email: body.email, phone: body.phone, whatsapp: body.whatsapp }).select().single();
  if (error) throw new Error(`Erro ao cadastrar cliente: ${error.message}`);
  return data;
});

export const editarCliente = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ id: string; name: string; email: string; phone: string; whatsapp: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data, error } = await supabase.from("customers").update({ name: body.name, email: body.email, phone: body.phone, whatsapp: body.whatsapp, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) throw new Error(`Erro ao editar cliente: ${error.message}`);
  return data;
});

export const buscarClientePedidos = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ customer_id: string }>(null).text().then(async (t) => JSON.parse(t));
  const { data: customer } = await supabase.from("customers").select("*").eq("id", body.customer_id).maybeSingle();
  const { data: orders } = await supabase.from("pedidos").select("*").eq("customer_id", body.customer_id).order("criado_em", { ascending: false });
  return { customer, orders: orders ?? [] };
});

/* ---------- Criar Pedido ---------- */
export const criarPedido = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const body = await new Response<{ customer_name: string; customer_email: string; customer_phone: string; customer_whatsapp: string; product_id: string; product_code: string; product_name: string; product_image: string | null; product_sku: string | null; quantity: number; selected_variation: string | null; notes?: string }>(null).text().then(async (t) => JSON.parse(t));
  const order_number = gerarNumeroPedido();
  const { data, error } = await supabase.from("pedidos").insert({
    order_number, customer_name: body.customer_name, customer_email: body.customer_email,
    customer_phone: body.customer_phone, customer_whatsapp: body.customer_whatsapp,
    product_id: body.product_id, product_code: body.product_code, product_name: body.product_name,
    product_image: body.product_image, product_sku: body.product_sku, quantity: body.quantity,
    selected_variation: body.selected_variation, notes: body.notes ?? null, status: "NOVO",
  }).select().single();
  if (error) throw new Error(`Erro ao criar pedido: ${error.message}`);
  await supabase.from("order_status_history").insert({ order_id: data.id, old_status: "NOVO", new_status: "NOVO", changed_by: "system" });
  return data;
});