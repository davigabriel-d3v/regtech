import { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Tables"]["orders"]["Row"]["status"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Item = Database["public"]["Tables"]["order_items"]["Row"];
type History = Database["public"]["Tables"]["order_status_history"]["Row"];

type AdminOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  customers: Customer;
  order_items: Item[];
};

const statusInfo: Record<Status, { label: string; cls: string }> = {
  new: { label: "Novo", cls: "bg-primary/15 text-primary" },
  review: { label: "Em análise", cls: "bg-accent/15 text-accent-foreground" },
  in_progress: { label: "Em andamento", cls: "bg-secondary text-secondary-foreground" },
  completed: { label: "Concluído", cls: "bg-primary/25 text-foreground" },
  cancelled: { label: "Cancelado", cls: "bg-destructive/15 text-destructive" },
};

const statuses = Object.keys(statusInfo) as Status[];

const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const orderNumber = (n: number) => "PED-" + String(n).padStart(6, "0");

export function PedidosAdmin() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [admins, setAdmins] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState(false);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(*), order_items(*)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Não foi possível carregar os pedidos: " + error.message);
      setOrders([]);
    } else {
      setOrders((data ?? []) as unknown as AdminOrder[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    const timer = window.setInterval(() => { void load(); }, 15000);\n    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const item = order.order_items[0];
      const text = [
        orderNumber(order.order_number),
        order.customers.name,
        item?.product_name,
        item?.product_code,
      ].join(" ").toLowerCase();
      const created = order.created_at.slice(0, 10);
      return (!q || text.includes(q))
        && (status === "all" || order.status === status)
        && (!fromDate || created >= fromDate)
        && (!toDate || created <= toDate);
    });
  }, [orders, search, status, fromDate, toDate]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, status, fromDate, toDate]);

  async function openDetail(order: AdminOrder) {
    setDetail(order);
    const { data } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    setHistory((data ?? []) as History[]);
    const ids = [...new Set((data ?? []).map((h) => h.changed_by).filter(Boolean) as string[])];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,nome").in("id", ids);
      setAdmins(Object.fromEntries((profiles ?? []).map((p) => [p.id, p.nome || "Administrador"])));
    } else {
      setAdmins({});
    }
  }

  async function updateStatus(next: Status) {
    if (!detail || next === detail.status) return;
    setSavingStatus(true);
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", detail.id);
    setSavingStatus(false);
    if (error) {
      toast.error("Não foi possível alterar o status: " + error.message);
      return;
    }
    toast.success("Status atualizado.");
    await load();
    const updated = orders.find((o) => o.id === detail.id);
    if (updated) setDetail({ ...updated, status: next });
    const { data } = await supabase.from("order_status_history").select("*").eq("order_id", detail.id).order("created_at", { ascending: false });
    setHistory((data ?? []) as History[]);
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Gerenciamento de pedidos</h2>
        <p className="text-sm text-muted-foreground">Pedidos reais recebidos pela loja, vinculados ao produto cadastrado.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_170px_150px_150px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido, cliente, produto ou ID" className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pl-10 text-sm outline-none focus:border-primary" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | "all")} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="all">Todos os status</option>
          {statuses.map((s) => <option key={s} value={s}>{statusInfo[s].label}</option>)}
        </select>
        <label className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 pl-9 text-sm" /></label>
        <label className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 pl-9 text-sm" /></label>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Produto</th><th className="p-3">ID Produto</th><th className="p-3">Data</th><th className="p-3">Status</th><th className="p-3">Ações</th>
            </tr></thead>
            <tbody>
              {rows.map((order) => {
                const item = order.order_items[0];
                return <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-semibold">#{orderNumber(order.order_number)}</td>
                  <td className="p-3">{order.customers.name}</td>
                  <td className="p-3">{item?.product_name ?? "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{item?.product_code ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{dateTime(order.created_at)}</td>
                  <td className="p-3"><span className={"rounded-full px-2.5 py-1 text-xs " + statusInfo[order.status].cls}>{statusInfo[order.status].label}</span></td>
                  <td className="p-3"><button type="button" onClick={() => openDetail(order)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"><Eye className="h-3.5 w-3.5" /> Ver pedido</button></td>
                </tr>;
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{filtered.length} pedido(s)</span>
        <div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><span>Página {page} de {pages}</span><button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Próxima</button></div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur" onMouseDown={() => setDetail(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-mono text-sm text-primary">#{orderNumber(detail.order_number)}</p><h3 className="mt-1 font-display text-2xl font-bold">Detalhes do pedido</h3><p className="mt-1 text-sm text-muted-foreground">{dateTime(detail.created_at)}</p></div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-full p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-border p-4">
                <h4 className="font-display font-bold">Pedido</h4>
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Status</span><select disabled={savingStatus} value={detail.status} onChange={(e) => updateStatus(e.target.value as Status)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">{statuses.map((s) => <option key={s} value={s}>{statusInfo[s].label}</option>)}</select></div>
              </section>
              <section className="rounded-2xl border border-border p-4">
                <h4 className="font-display font-bold">Cliente</h4>
                <div className="mt-3 space-y-1 text-sm"><p>{detail.customers.name}</p><p className="text-muted-foreground">Telefone: {detail.customers.phone}</p><p className="text-muted-foreground">WhatsApp: {detail.customers.whatsapp || "—"}</p><p className="text-muted-foreground">E-mail: {detail.customers.email || "—"}</p></div>
              </section>
            </div>

            <section className="mt-4 rounded-2xl border border-border p-4">
              <h4 className="font-display font-bold">Produto</h4>
              {detail.order_items.map((item) => <div key={item.id} className="mt-4 flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">{item.product_image ? <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" /> : null}</div>
                <div className="space-y-1 text-sm"><p className="font-semibold">{item.product_name}</p><p className="font-mono text-xs text-primary">{item.product_code}</p><p className="text-muted-foreground">SKU: {item.product_sku || "—"}</p><p className="text-muted-foreground">Quantidade: {item.quantity}</p><p className="text-muted-foreground">Variação: {item.selected_variation ? JSON.stringify(item.selected_variation) : "—"}</p></div>
              </div>)}
            </section>

            <section className="mt-4 rounded-2xl border border-border p-4">
              <h4 className="font-display font-bold">Observações</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{detail.notes || "Nenhuma observação."}</p>
            </section>

            <section className="mt-4 rounded-2xl border border-border p-4">
              <h4 className="font-display font-bold">Histórico do pedido</h4>
              <div className="mt-3 space-y-3">
                {history.map((entry) => <div key={entry.id} className="flex gap-3 border-l-2 border-primary/30 pl-3 text-sm">
                  <div><p className="font-medium">{entry.old_status ? statusInfo[entry.old_status].label + " → " : "Pedido criado → "}{statusInfo[entry.new_status].label}</p><p className="text-xs text-muted-foreground">{dateTime(entry.created_at)} · {entry.changed_by ? (admins[entry.changed_by] || "Administrador") : "Cliente"}</p></div>
                </div>)}
                {history.length === 0 && <p className="text-sm text-muted-foreground">Nenhum histórico registrado.</p>}
              </div>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
