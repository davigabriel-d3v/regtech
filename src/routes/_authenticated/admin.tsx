import { useState, useEffect } from "react";
import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package, Users, Plus, Eye, EyeOff, Star, Pencil, Trash2, ArrowLeft, Loader2,
  LayoutDashboard, ShoppingBag, Boxes, Settings, Menu, X, LogOut, Inbox, Search,
  Truck, CheckCircle2, XCircle, PackageCheck, PackageX, Activity, UserPlus, FilePen, FilePlus2, RefreshCw, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProdutosAdmin } from "@/components/admin/ProdutosAdmin";
import { PedidosAdmin } from "@/components/admin/PedidosAdmin";
import { AcessoMaisAdmin } from "@/components/admin/AcessoMaisAdmin";
import { ClientesAdmin } from "@/components/admin/ClientesAdmin";
import { BannerPrincipalAdmin } from "@/components/admin/BannerPrincipalAdmin";

// Acesso + é um módulo administrativo real e deve ser renderizado pela seção acesso_plus.

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

    const [{ data: adminRole, error: adminError }, { data: operatorRole, error: operatorError }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: data.user.id, _role: "operator" }),
    ]);

    if (adminError || operatorError) {
      return { user: data.user, isAdmin: false, isOperator: false, permissions: [] as string[], accessDenied: true };
    }

    const isAdmin = Boolean(adminRole);
    const isOperator = Boolean(operatorRole);

    if (isAdmin) {
      return { user: data.user, isAdmin: true, isOperator: false, permissions: [] as string[], accessDenied: false };
    }

    if (!isOperator) {
      return { user: data.user, isAdmin: false, isOperator: false, permissions: [] as string[], accessDenied: true };
    }

    const { data: permissionData, error: permissionError } = await supabase
      .from("access_permissions")
      .select("module")
      .eq("user_id", data.user.id)
      .eq("enabled", true);

    return {
      user: data.user,
      isAdmin: false,
      isOperator: true,
      permissions: permissionError ? [] : (permissionData ?? []).map((p) => p.module),
      accessDenied: false,
    };
  },
  component: Admin,
});

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
  const { user, isAdmin, isOperator, permissions, accessDenied } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        void navigate({ to: "/auth", replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);
  const [secao, setSecao] = useState<Secao>("dashboard");
  const [criarAcessoRequest, setCriarAcessoRequest] = useState(0);
  const [criarProdutoRequest, setCriarProdutoRequest] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function carregar() {
    setCarregando(true);

    const canProducts =
      isAdmin || (isOperator && (permissions.includes("produtos") || permissions.includes("dashboard")));
    const canOrders =
      isAdmin || (isOperator && (permissions.includes("pedidos") || permissions.includes("dashboard")));

    const [productsResult, imagesResult, categoriesResult, brandsResult, ordersResult, customersResult, itemsResult] =
      await Promise.all([
        canProducts
          ? supabase
              .from("products")
              .select("id,product_code,name,description,price,promotional_price,stock,status,created_at,brand_id,category_id")
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        canProducts
          ? supabase.from("product_images").select("product_id,image_url,is_primary,display_order").order("display_order")
          : Promise.resolve({ data: [], error: null }),
        canProducts
          ? supabase.from("product_categories").select("id,name")
          : Promise.resolve({ data: [], error: null }),
        canProducts
          ? supabase.from("marcas").select("id,nome")
          : Promise.resolve({ data: [], error: null }),
        canOrders
          ? supabase
              .from("orders")
              .select("id,order_number,status,created_at,customer_id")
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        canOrders
          ? supabase.from("customers").select("id,name")
          : Promise.resolve({ data: [], error: null }),
        canOrders
          ? supabase
              .from("order_items")
              .select("order_id,product_id,product_code,product_name")
          : Promise.resolve({ data: [], error: null }),
      ]);

    const productsById = new Map((productsResult.data ?? []).map((p: any) => [p.id, p]));
    const imagesByProduct = new Map<string, any[]>();
    for (const image of (imagesResult.data ?? []) as any[]) {
      const list = imagesByProduct.get(image.product_id) ?? [];
      list.push(image);
      imagesByProduct.set(image.product_id, list);
    }
    const categoriesById = new Map((categoriesResult.data ?? []).map((c: any) => [c.id, c.name]));
    const brandsById = new Map((brandsResult.data ?? []).map((b: any) => [b.id, b.nome]));

    const statusMap: Record<string, StatusPedido> = {
      new: "novo",
      review: "analise",
      in_progress: "andamento",
      completed: "concluido",
      cancelled: "cancelado",
    };

    setProdutos(
      (productsResult.data ?? []).map((row: any) => {
        const images = imagesByProduct.get(row.id) ?? [];
        const primary = [...images].sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            a.display_order - b.display_order,
        )[0];
        return {
          id: row.id,
          titulo: row.name,
          marca: brandsById.get(row.brand_id) ?? "—",
          categoria: categoriesById.get(row.category_id) ?? "Outros",
          descricao: row.description,
          preco: row.promotional_price ?? row.price,
          imagem_url: primary?.image_url ?? null,
          em_estoque: Number(row.stock) > 0,
          destaque: row.promotional_price != null,
          publicado: row.status === "active",
          ordem: 0,
          criado_em: row.created_at,
        } satisfies Produto;
      }),
    );

    const customersById = new Map(
      (customersResult.data ?? []).map((customer: any) => [customer.id, customer.name]),
    );
    const itemsByOrder = new Map<string, any>();
    for (const item of (itemsResult.data ?? []) as any[]) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, item);
    }

    setPedidos(
      (ordersResult.data ?? []).map((row: any) => {
        const item = itemsByOrder.get(row.id);
        return {
          id: row.id,
          numero: row.order_number,
          cliente_nome: customersById.get(row.customer_id) ?? "—",
          produto_id: item?.product_id ?? null,
          produto_codigo: item?.product_code ?? null,
          produto_titulo: item?.product_name ?? "—",
          status: statusMap[row.status] ?? "novo",
          criado_em: row.created_at,
        } satisfies Pedido;
      }),
    );

    const errors = [
      productsResult.error ? `produtos: ${productsResult.error.message}` : null,
      imagesResult.error ? `imagens: ${imagesResult.error.message}` : null,
      categoriesResult.error ? `categorias: ${categoriesResult.error.message}` : null,
      brandsResult.error ? `marcas: ${brandsResult.error.message}` : null,
      ordersResult.error ? `pedidos: ${ordersResult.error.message}` : null,
      customersResult.error ? `clientes: ${customersResult.error.message}` : null,
      itemsResult.error ? `itens: ${itemsResult.error.message}` : null,
    ].filter(Boolean);

    if (errors.length) toast.error(`Alguns dados não puderam ser carregados: ${errors.join(" · ")}`);

    setClientes([]);
    setAtividades([]);
    setCarregando(false);
    void qc.invalidateQueries({ queryKey: ["loja"] });
  }
  useEffect(() => { void carregar(); }, [user.id]);
  useEffect(() => {
    const channel = supabase.channel("admin-dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { void carregar(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user.id]);

  function ir(s: Secao) { setSecao(s); setMenuAberto(false); }
  function novo() {
    setCriarProdutoRequest((request) => request + 1);
    ir("produtos");
  }

  function novoAcesso() {
    setCriarAcessoRequest((request) => request + 1);
    ir("acesso_plus");
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

  const allowed = (id: Secao) =>
    isAdmin ||
    (isOperator && id !== "acesso_plus" && id !== "config" && (id === "dashboard" || permissions.includes(id === "produtos" ? "produtos" : id)));

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Acesso negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta está autenticada, mas não possui uma função administrativa válida para acessar este painel.
          </p>
          <button
            onClick={() => void navigate({ to: "/conta", replace: true })}
            className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Voltar para minha conta
          </button>
        </div>
      </div>
    );
  }
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
                  <Bell className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Novo pedido recebido</p>
                    {(() => {
                      const p = pedidos.find((item) => item.status === "novo");
                      return p ? <p className="truncate text-sm text-muted-foreground">Pedido #{String(p.numero).padStart(6, "0")} · {p.cliente_nome} · {p.produto_titulo} · {(p.produto_codigo ?? idCurto(p.produto_id))}</p> : null;
                    })()}
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { l: "Cadastrar produto", i: Plus, f: novo },
                  { l: "Criar Acesso", i: UserPlus, f: novoAcesso },
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
            <ProdutosAdmin openCreateRequest={criarProdutoRequest} />
          ) : secao === "clientes" ? (
            <ClientesAdmin />
          ) : secao === "pedidos" ? (
            <PedidosAdmin />
          ) : secao === "acesso_plus" ? (
            <AcessoMaisAdmin openCreateRequest={criarAcessoRequest} />
          ) : secao === "estoque" ? (
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display text-xl font-bold text-foreground">Estoque</h2>
              <p className="mt-2 text-sm text-muted-foreground">O controle de estoque está disponível nesta área.</p>
            </div>
          ) : secao === "config" ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Configurações</h2>
                <p className="mt-1 text-sm text-muted-foreground">Personalize a experiência da loja sem precisar alterar o código.</p>
              </div>
              <BannerPrincipalAdmin />
            </div>
          ) : null}
        </main>
      </div>

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
