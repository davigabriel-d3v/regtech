import { useState, useEffect } from "react";
import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package, Users, Plus, Eye, EyeOff, Star, Pencil, Trash2, ArrowLeft, Loader2,
  LayoutDashboard, ShoppingBag, Boxes, Settings, Menu, X, LogOut, Inbox, Search,
  Truck, CheckCircle2, XCircle, PackageCheck, PackageX, Activity, UserPlus, FilePen, FilePlus2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProdutosAdmin } from "@/components/admin/ProdutosAdmin";
import { PedidosAdmin } from "@/components/admin/PedidosAdmin";
import { AcessoMaisAdmin } from "@/components/admin/AcessoMaisAdmin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin | RegTech" },
      { name: "description", content: "Painel administrativo da RegTech Cell Shop" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: roleData } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    const { data: permissionData } = await supabase.from("access_permissions").select("module").eq("user_id", data.user.id).eq("enabled", true);
    if (!roleData && !(permissionData ?? []).length) throw redirect({ to: "/conta" });
    return { user: data.user, isAdmin: Boolean(roleData), permissions: (permissionData ?? []).map((p) => p.module) };
  },
  component: Admin,
});

// Tabelas novas (pedidos, atividades) ainda não estão nos tipos gerados.
const db = supabase as any;

type Produto = {
  id: string; titulo: string; marca: string; categoria: string; descricao: string | null;
  preco: number | null; imagem_url: string | null; em_estoque: boolean; destaque: boolean;
  publicado: boolean; ordem: number; criado_em: string;
};
type Pedido = {
  id: string; numero: number; cliente_nome: string; produto_id: string | null; produto_codigo: string | null;
  produto_titulo: string; status: StatusPedido; criado_em: string;
};
type Atividade = { id: string; tipo: string; descricao: string; criado_em: string };
type StatusPedido = "novo" | "analise" | "andamento" | "concluido" | "cancelado";
type Secao = "dashboard" | "produtos" | "pedidos" | "clientes" | "estoque" | "acesso_plus" | "config";

const statusInfo: Record<StatusPedido, { label: string; cls: string }> = {
  novo: { label: "Novo", cls: "bg-primary/15 text-primary" },
  analise: { label: "Em análise", cls: "bg-accent/15 text-accent-foreground" },
  andamento: { label: "Em andamento", cls: "bg-secondary text-secondary-foreground" },
  concluido: { label: "Concluído", cls: "bg-primary/25 text-foreground" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/15 text-destructive" },
};

const iconeAtividade: Record<string, typeof Activity> = {
  produto_cadastrado: FilePlus2, produto_editado: FilePen, novo_pedido: ShoppingBag,
  pedido_atualizado: RefreshCw, cliente_cadastrado: UserPlus,
};

const categorias: [string, string][] = [
  ["celulares", "Celulares"], ["informatica", "Informática"], ["acessorios", "Acessórios"],
  ["servicos", "Serviços"], ["motos", "Motos Elétricas"], ["outros", "Outros"],
];

const menu: { id: Secao; label: string; icon: typeof Activity }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "estoque", label: "Estoque", icon: Boxes },
  { id: "acesso_plus", label: "Acesso +", icon: UserPlus },
  { id: "config", label: "Configurações", icon: Settings },
];

const vazio = {
  titulo: "", marca: "", categoria: "celulares", descricao: "",
  preco: "", imagem_url: "", em_estoque: true, destaque: false, publicado: true, ordem: 0,
};

const campo =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const idCurto = (id: string | null) => (id ? id.slice(0, 8).toUpperCase() : "—");
const data = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Admin() {
  const { user, isAdmin, permissions } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [secao, setSecao] = useState<Secao>("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<any>(vazio);
  const [editId, setEditId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function carregar() {
    const [p, c, pe, a] = await Promise.all([
      supabase.from("produtos").select("*").order("criado_em", { ascending: false }),
      supabase.from("profiles").select("*").order("criado_em", { ascending: false }),
      supabase.from("orders").select("id,order_number,status,created_at,customers(name),order_items(product_id,product_name,product_code)").order("created_at", { ascending: false }),
      db.from("atividades").select("*").order("criado_em", { ascending: false }).limit(10),
    ]);
    const statusMap: Record<string, StatusPedido> = { new: "novo", review: "analise", in_progress: "andamento", completed: "concluido", cancelled: "cancelado" };
    const pedidosNovos = (pe.data ?? []).map((row) => {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
      const item = Array.isArray(row.order_items) ? row.order_items[0] : row.order_items;
      return {
        id: row.id,
        numero: row.order_number,
        cliente_nome: customer?.name ?? "—",
        produto_id: item?.product_id ?? null,
        produto_codigo: item?.product_code ?? null,
        produto_titulo: item?.product_name ?? "—",
        status: statusMap[row.status] ?? "novo",
        criado_em: row.created_at,
      } satisfies Pedido;
    });
    setProdutos((p.data ?? []) as Produto[]);
    setClientes(c.data ?? []);
    setPedidos(pedidosNovos);
    setAtividades((a.data ?? []) as Atividade[]);
    setCarregando(false);
    qc.invalidateQueries({ queryKey: ["loja"] });
  }

  useEffect(() => { void carregar(); }, [user.id]);
  useEffect(() => {
    const channel = supabase.channel("admin-dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { void carregar(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user.id]);

  function ir(s: Secao) { setSecao(s); setMenuAberto(false); }
  function novo() { setForm(vazio); setEditId(null); setAberto(true); }
  function editar(p: Produto) {
    setForm({
      titulo: p.titulo, marca: p.marca, categoria: p.categoria, descricao: p.descricao ?? "",
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
      descricao: form.descricao.trim(), preco: form.preco === "" ? null : Number(String(form.preco).replace(",", ".")),
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

  async function alternar(p: Produto, k: "publicado" | "destaque") {
    const patch = k === "publicado" ? { publicado: !p.publicado } : { destaque: !p.destaque };
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

  const conta = (s: StatusPedido) => pedidos.filter((p) => p.status === s).length;
  const cards = [
    { l: "Novos pedidos", v: conta("novo"), i: Inbox },
    { l: "Pedidos em análise", v: conta("analise"), i: Search },
    { l: "Pedidos em andamento", v: conta("andamento"), i: Truck },
    { l: "Pedidos concluídos", v: conta("concluido"), i: CheckCircle2 },
    { l: "Pedidos cancelados", v: conta("cancelado"), i: XCircle },
    { l: "Total de produtos", v: produtos.length, i: Package },
    { l: "Produtos ativos", v: produtos.filter((p) => p.publicado).length, i: PackageCheck },
    { l: "Produtos sem estoque", v: produtos.filter((p) => !p.em_estoque).length, i: PackageX },
  ];

  const allowed = (id: Secao) => isAdmin || id === "dashboard" || permissions.includes(id === "config" ? "configuracoes" : id);
  const visibleMenu = menu.filter((m) => allowed(m.id));

  const Sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <img src="/regtech-icon.png" alt="" className="h-8 w-8 rounded-full" />
        <span className="font-display text-lg font-bold text-foreground">RegTech Admin</span>
      </div>
      {visibleMenu.map((m) => (
        <button key={m.id} onClick={() => ir(m.id)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${secao === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <m.icon className="h-4 w-4" /> {m.label}
        </button>
      ))}
      <div className="mt-auto space-y-1 border-t border-border pt-4">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <button onClick={sair} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </nav>
  );

  const titulo = menu.find((m) => m.id === secao)?.label ?? "";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-card md:block">{Sidebar}</aside>

      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setMenuAberto(false)} />
          <aside className="relative h-full w-64 border-r border-border bg-card">
            <button aria-label="Fechar menu" onClick={() => setMenuAberto(false)} className="absolute right-3 top-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
          <button aria-label="Abrir menu" onClick={() => setMenuAberto(true)} className="rounded-lg p-2 text-foreground hover:bg-secondary md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">{titulo}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            {allowed("produtos") && <button onClick={novo} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Cadastrar produto</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          {carregando ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : secao === "dashboard" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {cards.map((c) => (
                  <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{c.l}</p>
                      <c.i className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-2 font-display text-3xl font-bold text-foreground">{c.v}</p>
                  </div>
                ))}
              </div>

              {pedidos.some((p) => p.status === "novo") && (
                <button type="button" onClick={() => ir("pedidos")} className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
                  <span className="text-xl">🔔</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Novo pedido recebido</p>
                    {(() => {
                      const p = pedidos.find((item) => item.status === "novo");
                      return p ? <p className="truncate text-sm text-muted-foreground">Pedido #{String(p.numero).padStart(6, "0")} · {p.cliente_nome} · {p.produto_titulo} · {(p.produto_codigo ?? idCurto(p.produto_id))}</p> : null;
                    })()}
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: "Cadastrar produto", i: Plus, f: novo },
                  { l: "Ver pedidos", i: ShoppingBag, f: () => ir("pedidos") },
                  { l: "Ver clientes", i: Users, f: () => ir("clientes") },
                  { l: "Ver produtos", i: Package, f: () => ir("produtos") },
                ].map((a) => (
                  <button key={a.l} onClick={a.f} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm font-medium text-foreground hover:border-primary">
                    <span className="rounded-xl bg-primary/15 p-2 text-primary"><a.i className="h-4 w-4" /></span> {a.l}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-border bg-card xl:col-span-2">
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="font-display font-bold text-foreground">Últimos pedidos</h2>
                    <button onClick={() => ir("pedidos")} className="text-sm text-primary">Ver pedidos</button>
                  </div>
                  <TabelaPedidos pedidos={pedidos.slice(0, 6)} onVer={() => ir("pedidos")} />
                </section>

                <section className="rounded-2xl border border-border bg-card">
                  <div className="border-b border-border p-4">
                    <h2 className="font-display font-bold text-foreground">Atividades recentes</h2>
                  </div>
                  {atividades.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {atividades.map((a) => {
                        const I = iconeAtividade[a.tipo] ?? Activity;
                        return (
                          <li key={a.id} className="flex gap-3 p-4">
                            <span className="h-fit rounded-lg bg-primary/15 p-2 text-primary"><I className="h-4 w-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm text-foreground">{a.descricao}</p>
                              <p className="text-xs text-muted-foreground">{data(a.criado_em)}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>

              <section className="rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h2 className="font-display font-bold text-foreground">Últimos produtos cadastrados</h2>
                  <button onClick={() => ir("produtos")} className="text-sm text-primary">Ver produtos</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr><th className="p-3">Foto</th><th className="p-3">Nome</th><th className="p-3">ID do produto</th><th className="p-3">Estoque</th><th className="p-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {produtos.slice(0, 5).map((p) => (
                        <tr key={p.id} className="border-t border-border text-foreground">
                          <td className="p-3">{p.imagem_url ? <img src={p.imagem_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-secondary" />}</td>
                          <td className="p-3 font-medium">{p.titulo}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{idCurto(p.id)}</td>
                          <td className="p-3">{p.em_estoque ? "Em estoque" : <span className="text-destructive">Sem estoque</span>}</td>
                          <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${p.publicado ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{p.publicado ? "Ativo" : "Rascunho"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : secao === "produtos" ? (
            <ProdutosAdmin />
          ) : secao === "clientes" ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[480px] text-sm">
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
          ) : secao === "pedidos" ? (
            <PedidosAdmin />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-lg font-bold text-foreground">{titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">Este módulo será adicionado nas próximas etapas.</p>
            </div>
          )}
        </main>
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
    </div>
  );
}

function TabelaPedidos({ pedidos, onVer }: { pedidos: Pedido[]; onVer?: () => void }) {
  if (pedidos.length === 0)
    return <p className="p-8 text-center text-sm text-muted-foreground">Nenhum pedido recebido ainda.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr><th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Produto</th><th className="p-3">ID do produto</th><th className="p-3">Data</th><th className="p-3">Status</th><th className="p-3" /></tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} className="border-t border-border text-foreground">
              <td className="p-3 font-semibold">#{p.numero}</td>
              <td className="p-3">{p.cliente_nome || "—"}</td>
              <td className="p-3">{p.produto_titulo || "—"}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{p.produto_codigo ?? idCurto(p.produto_id)}</td>
              <td className="p-3 text-muted-foreground">{data(p.criado_em)}</td>
              <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${statusInfo[p.status]?.cls}`}>{statusInfo[p.status]?.label ?? p.status}</span></td>
              <td className="p-3 text-right"><button onClick={onVer} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">Ver pedido</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
