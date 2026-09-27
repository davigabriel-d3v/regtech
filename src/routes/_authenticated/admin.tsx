import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Plus, Search, Filter, Edit2, Trash2, Eye, ChevronDown,
  Menu, X, ArrowRight, Copy, Check, Mail, Phone, MapPin,
  PackageOpen, Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Image, Star, Hash, Barcode, Tag, Info,
  ChevronLeft, ChevronRight, Home, LogOut, Shield, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { listarDashboard, listarProdutos, cadastrarProduto, editarProduto, excluirProduto, alternarStatusProduto, listarPedidos, alterarStatusPedido, criarPedido, listarClientes, cadastrarCliente, editarCliente } from "@/lib/admin.functions";
import type { AdminProduct, AdminOrder, AdminCustomer } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarSeparator } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Painel Admin" }, { name: "description", content: "Painel administrativo" }],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: roleData } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (!roleData) throw redirect({ to: "/conta" });
    return { user: data.user };
  },
  component: Admin,
});

/* ---------- ADMIN PANEL COMPONENT ---------- */
export default function Admin() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState<"dashboard" | "produtos" | "pedidos" | "clientes" | "configuracoes">("dashboard");
  const [subAba, setSubAba] = useState<"lista" | "form">("lista");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [dash, setDash] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ titulo: "", descricao: "", categoria: "", marca: "", sku: "", barcode: "", preco: "", promotional_price: "", stock: "", minimum_stock: "", status: "ATIVO", notes: "", imagem_url: "" });
  const [salvando, setSalvando] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [aberto, setAberto] = useState(false);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  useEffect(() => {
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setAdmin(!!data);
      if (data) carregar();
    });
  }, [user.id]);

  async function carregar() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [produtoForm, setProdutoForm] = useState<any>(null);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);
  const [userAdmin, setUserAdmin] = useState<{email: string; nome: string}>({email: "", nome: ""});
  const [novaSenha, setNovaSenha] = useState("");

  const ITENS_POR_PAGINA = 10;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [dashRes, prodRes, pedRes, cliRes] = await Promise.all([
        listarDashboard(), listarProdutos(), listarPedidos(), listarClientes(),
      ]);
      setDashboard(dashRes);
      setProdutos(prodRes ?? []);
      setPedidos(pedRes ?? []);
      setClientes(cliRes ?? []);
    } catch (e) {
      toast.error("Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastrarProduto(dados: any) {
    try {
      const result = await cadastrarProduto(dados);
      toast.success(`Produto cadastrado! ID: ${result.product_code}`);
      setSubAba("lista");
      carregarDados();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleEditarProduto(dados: any) {
    try {
      await editarProduto(dados);
      toast.success("Produto atualizado!");
      setSubAba("lista");
      carregarDados();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleExcluirProduto(id: string, product_code: string) {
    try {
      await excluirProduto({ id });
      toast.success("Produto excluído");
      carregarDados();
    } catch (e: any) {
      toast.error(e.message);
    }
  }
    queryKey: ["estatisticas", periodo],
    queryFn: () => listarEstatisticas(),
  });
  const { data: pedidos, isLoading: pedLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => listarPedidos(),
  });

  /* ---------- estatísticas formatadas ---------- */
  const s = est ?? {
    vendasHoje: 0, comparativoVendas: 0, totalPedidos: 0, pedidosPendentes: 0,
    totalClientes: 0, novosClientes: 0, totalProdutos: 0, produtosEstoqueBaixo: 0,
    receitaPeriodo: 0, ticketMedio: 0,
  };
  const formatMoeda = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const formatPct = (v: number) =>
    `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  const pctVendas = s.comparativoVendas > 0 ? ((s.vendasHoje - s.comparativoVendas) / s.comparativoVendas) * 100 : 0;

  /* ---------- dados do gráfico ---------- */
  const dadosGrafico = useMemo(() => {
    const lista = pedidos ?? [];
    const agora = new Date();
    const filtro: Record<string, (d: Date) => boolean> = {
      hoje: (d: Date) => d.toDateString() === agora.toDateString(),
      "7d": (d: Date) => Math.abs(Math.ceil((agora.getTime() - d.getTime()) / 864e5)) <= 7,
      "30d": (d: Date) => Math.abs(Math.ceil((agora.getTime() - d.getTime()) / 864e5)) <= 30,
      "90d": (d: Date) => Math.abs(Math.ceil((agora.getTime() - d.getTime()) / 864e5)) <= 90,
      "12m": (d: Date) => Math.abs(Math.ceil((agora.getTime() - d.getTime()) / 864e5)) <= 365,
    };
    const filtrados = lista.filter((p) => {
      const d = new Date(p.data);
      return (filtro[periodo] ?? (() => true))(d);
    });
    const agrupados = new Map<string, { receita: number; pedidos: number }>();
    filtrados.forEach((p) => {
      const chave = new Date(p.data).toLocaleDateString("pt-BR");
      const ex = agrupados.get(chave) ?? { receita: 0, pedidos: 0 };
      agrupados.set(chave, { receita: ex.receita + p.valor, pedidos: ex.pedidos + 1 });
    });
    return Array.from(agrupados.entries())
      .map(([data, val]) => ({ data, receita: val.receita, pedidos: val.pedidos }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [pedidos, periodo]);

  /* ---------- navegação ---------- */
  const navegar = useNavigate();
  function handleVerLoja() {
    navegar({ to: "/shop" });
  }
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [p, c] = await Promise.all([
      supabase.from("produtos").select("*").order("ordem").order("titulo"),
      supabase.from("profiles").select("*").order("criado_em", { ascending: false }),
    ]);
    setProdutos(p.data ?? []);
    setClientes(c.data ?? []);
    qc.invalidateQueries({ queryKey: ["loja"] });
  }

  useEffect(() => {
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setAdmin(!!data);
      if (data) carregar();
    });
  }, [user.id]);

  if (admin === null)
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!admin)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Acesso restrito</h1>
        <p className="text-muted-foreground">Esta área é só para administradores.</p>
        <Link to="/" className="text-primary">Voltar ao site</Link>
      </main>
    );

  function novo() { setForm(vazio); setEditId(null); setAberto(true); }
  function editar(p: Produto) {
    setForm({
      titulo: p.titulo, marca: p.marca, categoria: p.categoria, descricao: p.descricao,
      preco: p.preco == null ? "" : String(p.preco), imagem_url: p.imagem_url ?? "",
      em_estoque: p.em_estoque, destaque: p.destaque, publicado: p.publicado, ordem: p.ordem,
    });
    setEditId(p.id); setAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const dados = {
      titulo: form.titulo.trim(), marca: form.marca.trim(), categoria: form.categoria,
      descricao: form.descricao.trim(), preco: form.preco === "" ? null : Number(form.preco.replace(",", ".")),
      imagem_url: form.imagem_url.trim() || null, em_estoque: form.em_estoque, destaque: form.destaque,
      publicado: form.publicado, ordem: Number(form.ordem) || 0, atualizado_em: new Date().toISOString(),
    };
    const { error } = editId
      ? await supabase.from("produtos").update(dados).eq("id", editId)
      : await supabase.from("produtos").insert({ ...dados, slug: `${slugify(dados.titulo)}-${Date.now().toString(36)}` });
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success(editId ? "Produto atualizado!" : "Produto criado!");
    setAberto(false);
    carregar();
  }

  async function alternar(p: Produto, campoBool: "publicado" | "destaque") {
    const patch = campoBool === "publicado" ? { publicado: !p.publicado } : { destaque: !p.destaque };
    await supabase.from("produtos").update(patch).eq("id", p.id);
    carregar();
  }

  async function apagar(p: Produto) {
    if (!confirm(`Apagar "${p.titulo}"?`)) return;
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) { toast.error("Erro ao apagar."); return; }
    toast.success("Produto apagado.");
    carregar();
  }

  const publicados = produtos.filter((p) => p.publicado).length;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-foreground">Painel administrativo</h1>
          <button onClick={novo} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent">
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[["Produtos", produtos.length], ["Publicados", publicados], ["Clientes", clientes.length]].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="font-display text-2xl font-bold text-foreground">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => setAba("produtos")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${aba === "produtos" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
            <Package className="h-4 w-4" /> Produtos
          </button>
          <button onClick={() => setAba("clientes")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${aba === "clientes" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
            <Users className="h-4 w-4" /> Clientes
          </button>
        </div>

        {aba === "produtos" ? (
          <div className="mt-4 space-y-2">
            {produtos.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                {p.imagem_url ? <img src={p.imagem_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-secondary" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{p.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.marca} · {categorias.find((c) => c[0] === p.categoria)?.[1] ?? p.categoria} ·{" "}
                    {p.preco == null ? "Sob consulta" : Number(p.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    {!p.publicado && " · Rascunho"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button title={p.publicado ? "Ocultar" : "Publicar"} onClick={() => alternar(p, "publicado")} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                    {p.publicado ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button title="Destaque" onClick={() => alternar(p, "destaque")} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                    <Star className={`h-4 w-4 ${p.destaque ? "fill-primary text-primary" : ""}`} />
                  </button>
                  <button title="Editar" onClick={() => editar(p)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button title="Apagar" onClick={() => apagar(p)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="p-3">Nome</th><th className="p-3">WhatsApp</th><th className="p-3">Cadastro</th></tr></thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-t border-border text-foreground">
                    <td className="p-3">{c.nome || "—"}</td>
                    <td className="p-3">{c.whatsapp ? <a className="text-primary" target="_blank" rel="noreferrer" href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`}>{c.whatsapp}</a> : "—"}</td>
                    <td className="p-3">{new Date(c.criado_em).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setAberto(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvar} className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold text-foreground">{editId ? "Editar produto" : "Novo produto"}</h2>
            <input className={campo} placeholder="Nome do produto" required maxLength={150} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={campo} placeholder="Marca" required maxLength={60} value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              <select className={campo} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {categorias.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <textarea className={campo} rows={3} placeholder="Descrição" maxLength={1000} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={campo} placeholder="Preço (vazio = sob consulta)" inputMode="decimal" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
              <input className={campo} type="number" placeholder="Ordem" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} />
            </div>
            <input className={campo} placeholder="Link da foto (https://...)" value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} />
            <div className="flex flex-wrap gap-4 text-sm text-foreground">
              {([["publicado", "Publicado"], ["em_estoque", "Em estoque"], ["destaque", "Destaque"]] as const).map(([k, l]) => (
                <label key={k} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="accent-primary" /> {l}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAberto(false)} className="rounded-full border border-border px-4 py-2 text-sm text-foreground">Cancelar</button>
              <button disabled={salvando} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
