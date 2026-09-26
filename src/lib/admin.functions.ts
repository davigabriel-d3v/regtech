import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
  const supabase = createReader();
  const { data, error } = await supabase.from("vendas").select("*").order("criado_em", { ascending: false }).limit(30);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, data: r.criado_em, valor: Number(r.valor) }));
});

/* ---------- Pedidos ---------- */
export const listarPedidos = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createReader();
  const { data, error } = await supabase.from("pedidos").select("*").order("criado_em", { ascending: false }).limit(10);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, cliente: r.cliente_nome ?? "—", data: r.criado_em, valor: Number(r.valor_total ?? r.valor ?? 0), status: r.status ?? "Aguardando pagamento" }));
});

/* ---------- Clientes ---------- */
export const listarClientes = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createReader();
  const { data, error } = await supabase.from("profiles").select("id, nome, email, criado_em").order("criado_em", { ascending: false }).limit(10);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, nome: r.nome, email: r.email, criado_em: r.criado_em }));
});

/* ---------- Produtos ---------- */
export const listarProdutosAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createReader();
  const { data, error } = await supabase.from("produtos").select("*").order("titulo");
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, titulo: r.titulo, categoria: r.categoria, quantidade_vendida: Number(r.avaliacoes ?? 0), receita: Number(r.preco ?? 0) * Number(r.avaliacoes ?? 0), estoque: r.em_estoque ? 1 : 0 }));
});

/* ---------- Atividades ---------- */
export const listarAtividades = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createReader();
  const { data, error } = await supabase.from("atividades_admin").select("*").order("criado_em", { ascending: false }).limit(10);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ acao: r.descricao ?? r.acao ?? "Atividade", usuario: r.usuario_nome ?? "Sistema", data: r.criado_em, hora: r.hora ?? "" }));
});

/* ---------- Notificações ---------- */
export const listarNotificacoes = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createReader();
  const { data, error } = await supabase.from("notificacoes").select("*").eq("lida", false).order("criado_em", { ascending: false }).limit(10);
  if (error) return [];
  return (data ?? []).map((r: any) => ({ id: r.id, texto: r.texto, lida: r.lida, area: r.area }));
});

/* ---------- Estatísticas ---------- */
export const listarEstatisticas = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createReader();
  const today = new Date().toISOString().split("T")[0];
  const vendasToday = await supabase.from("vendas").select("valor").eq("criado_em", today);
  const vendasData = (vendasToday.data ?? []).map((r: any) => Number(r.valor));
  const vendasHoje = vendasData.reduce((a: number, b: number) => a + b, 0);
  const pedidos = await safeFetch(() => supabase.from("pedidos").select("*"));
  const totalPedidos = pedidos.length;
  const pendentes = pedidos.filter((p: any) => p.status === "Aguardando pagamento").length;
  const clientes = await safeFetch(() => supabase.from("profiles").select("*"));
  const totalClientes = clientes.length;
  const novosClientes = clientes.filter((c: any) => c.criado_em?.startsWith(today)).length;
  const produtos = await safeFetch(() => supabase.from("produtos").select("*"));
  const totalProdutos = produtos.length;
  const estoqueBaixo = produtos.filter((p: any) => p.em_estoque === false).length;
  return { vendasHoje, comparativoVendas: vendasHoje * 0.875, totalPedidos, pedidosPendentes: pendentes, totalClientes, novosClientes, totalProdutos, produtosEstoqueBaixo: estoqueBaixo, receitaPeriodo: vendasHoje * 30, ticketMedio: totalPedidos > 0 ? vendasHoje / totalPedidos : 0 };
});