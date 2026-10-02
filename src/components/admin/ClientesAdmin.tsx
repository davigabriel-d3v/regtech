import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Loader2, Pencil, Search, UserCheck, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Customer = {
  id: string; name: string; email: string | null; phone: string; whatsapp: string | null;
  status: "active" | "inactive"; created_at: string; updated_at: string; avatar_url?: string | null;
};
type Order = {
  id: string; order_number: number; customer_id: string; status: string;
  created_at: string; updated_at: string;
};
type Item = {
  id: string; order_id: string; product_id: string; product_code: string;
  product_name: string; quantity: number; created_at: string;
};

const PAGE_SIZE = 10;
const statusLabel = (s: Customer["status"]) => s === "active" ? "Ativo" : "Inativo";
const orderStatus: Record<string, string> = {
  new: "Novo", review: "Em análise", in_progress: "Em andamento", completed: "Concluído", cancelled: "Cancelado",
};
const dateOnly = (v: string) => new Date(v).toLocaleDateString("pt-BR");
const dateTime = (v: string) => new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export function ClientesAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);\n  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Customer["status"] | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [orderOpen, setOrderOpen] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<Item[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [c, o] = await Promise.all([
      supabase.from("customers").select("id,name,email,phone,whatsapp,status,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("orders").select("id,order_number,customer_id,status,created_at,updated_at").order("created_at", { ascending: false }),
    ]);
    if (c.error) toast.error("Não foi possível carregar os clientes: " + c.error.message);
    if (o.error) toast.error("Não foi possível carregar os pedidos: " + o.error.message);\n    if (p.error) toast.error("Não foi possível carregar os perfis: " + p.error.message);
    setCustomers((c.data ?? []) as Customer[]);
    setOrders((o.data ?? []) as Order[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const orderCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.customer_id, (map.get(o.customer_id) ?? 0) + 1);
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(c => {
      const matchesStatus = status === "all" || c.status === status;
      const haystack = [c.name, c.email ?? "", c.phone, c.whatsapp ?? ""].join(" ").toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [customers, search, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);

  const selectedOrders = selected ? orders.filter(o => o.customer_id === selected.id) : [];

  async function openOrder(order: Order) {
    setOrderOpen(order);
    setOrderItems([]);
    setOrderLoading(true);
    const { data, error } = await supabase.from("order_items")
      .select("id,order_id,product_id,product_code,product_name,quantity,created_at")
      .eq("order_id", order.id).order("created_at");
    if (error) toast.error("Não foi possível carregar os itens do pedido: " + error.message);
    setOrderItems((data ?? []) as Item[]);
    setOrderLoading(false);
  }

  async function saveCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim() || editing.name.trim().length < 2) {
      toast.error("Informe um nome válido."); return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("customers")
      .update({
        name: editing.name.trim(),
        email: editing.email?.trim() || null,
        phone: editing.phone.trim(),
        whatsapp: editing.whatsapp?.trim() || null,
        status: editing.status,
      })
      .eq("id", editing.id)
      .select("id,name,email,phone,whatsapp,status,created_at,updated_at")
      .single();
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar o cliente: " + error.message); return; }
    setCustomers(prev => prev.map(c => c.id === editing.id ? data as Customer : c));
    setSelected(data as Customer);
    setEditing(null);
    toast.success("Cliente atualizado.");
  }

  async function toggleStatus(customer: Customer) {
    const next = customer.status === "active" ? "inactive" : "active";
    const action = next === "inactive" ? "desativar" : "ativar";
    if (!confirm(`Confirma ${action} o cliente "${customer.name}"?`)) return;
    const { data, error } = await supabase.from("customers")
      .update({ status: next }).eq("id", customer.id)
      .select("id,name,email,phone,whatsapp,status,created_at,updated_at").single();
    if (error) { toast.error("Não foi possível alterar o status: " + error.message); return; }
    setCustomers(prev => prev.map(c => c.id === customer.id ? data as Customer : c));
    if (selected?.id === customer.id) setSelected(data as Customer);
    toast.success(`Cliente ${next === "active" ? "ativado" : "desativado"}.`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={inputClass + " pl-9"} placeholder="Buscar por nome, e-mail, telefone ou WhatsApp..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={inputClass + " lg:w-44"} value={status} onChange={e => setStatus(e.target.value as Customer["status"] | "all")}>
          <option value="all">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
        rows.length === 0 ? <div className="px-6 py-16 text-center"><UsersEmpty /><p className="mt-3 font-medium text-foreground">Nenhum cliente encontrado</p><p className="mt-1 text-sm text-muted-foreground">Os clientes aparecem aqui automaticamente quando fazem pedidos.</p></div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm">
          <thead className="bg-secondary/40 text-left text-xs text-muted-foreground"><tr>
            <th className="p-3">Cliente</th><th className="p-3">E-mail</th><th className="p-3">Telefone</th><th className="p-3">WhatsApp</th>
            <th className="p-3">Cadastro</th><th className="p-3">Pedidos</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th>
          </tr></thead>
          <tbody>{rows.map(c => <tr key={c.id} className="border-t border-border text-foreground">
            <td className="p-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">{c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-semibold text-muted-foreground">{(c.name || "U").slice(0, 1).toUpperCase()}</span>}</div><span className="font-medium">{c.name}</span></div></td><td className="p-3">{c.email || "—"}</td><td className="p-3">{c.phone || "—"}</td><td className="p-3">{c.whatsapp || "—"}</td>
            <td className="p-3 text-muted-foreground">{dateOnly(c.created_at)}</td><td className="p-3">{orderCount.get(c.id) ?? 0}</td>
            <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${c.status === "active" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{statusLabel(c.status)}</span></td>
            <td className="p-3"><div className="flex justify-end gap-1">
              <button title="Ver cliente" onClick={() => setSelected(c)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Eye className="h-4 w-4" /></button>
              <button title="Editar cliente" onClick={() => setEditing(c)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      </div>

      {!loading && filtered.length > 0 && <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{filtered.length} cliente{filtered.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Anterior</button>
        <span className="min-w-20 text-center">Página {page} de {pages}</span>
        <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Próxima</button></div>
      </div>}

      {selected && <Modal title="Detalhes do cliente" onClose={() => setSelected(null)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-4">{selected.avatar_url ? <img src={selected.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-xl font-bold text-muted-foreground">{(selected.name || "U").slice(0, 1).toUpperCase()}</div>}<Info label="Nome" value={selected.name}/></div><Info label="E-mail" value={selected.email || "—"}/>
          <Info label="Telefone" value={selected.phone || "—"}/><Info label="WhatsApp" value={selected.whatsapp || "—"}/>
          <Info label="Status" value={statusLabel(selected.status)}/><Info label="Data de cadastro" value={dateTime(selected.created_at)}/>
          <Info label="Última atualização" value={dateTime(selected.updated_at)}/>
        </div>
        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display font-bold">Histórico de pedidos</h3><span className="text-xs text-muted-foreground">{selectedOrders.length} pedido{selectedOrders.length === 1 ? "" : "s"}</span></div>
          {selectedOrders.length === 0 ? <p className="rounded-xl bg-secondary/50 p-5 text-center text-sm text-muted-foreground">Nenhum pedido relacionado a este cliente.</p> :
          <div className="space-y-2">{selectedOrders.map(o => <button key={o.id} onClick={() => void openOrder(o)} className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:border-primary">
            <div><p className="font-semibold">PED-{String(o.order_number).padStart(6,"0")}</p><p className="text-xs text-muted-foreground">{dateTime(o.created_at)}</p></div>
            <span className="rounded-full bg-secondary px-2 py-1 text-xs">{orderStatus[o.status] ?? o.status}</span>
          </button>)}</div>}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={() => setEditing(selected)} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Pencil className="h-4 w-4"/>Editar cliente</button>
          <button onClick={() => void toggleStatus(selected)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{selected.status === "active" ? <UserX className="h-4 w-4"/> : <UserCheck className="h-4 w-4"/>}{selected.status === "active" ? "Desativar" : "Ativar"}</button>
        </div>
      </Modal>}

      {editing && <Modal title="Editar cliente" onClose={() => !saving && setEditing(null)}>
        <form onSubmit={saveCustomer} className="space-y-3">
          <input className={inputClass} required maxLength={120} placeholder="Nome" value={editing.name} onChange={e => setEditing({...editing,name:e.target.value})}/>
          <input className={inputClass} type="email" maxLength={180} placeholder="E-mail" value={editing.email ?? ""} onChange={e => setEditing({...editing,email:e.target.value})}/>
          <input className={inputClass} maxLength={30} placeholder="Telefone" value={editing.phone} onChange={e => setEditing({...editing,phone:e.target.value})}/>
          <input className={inputClass} maxLength={30} placeholder="WhatsApp" value={editing.whatsapp ?? ""} onChange={e => setEditing({...editing,whatsapp:e.target.value})}/>
          <select className={inputClass} value={editing.status} onChange={e => setEditing({...editing,status:e.target.value as Customer["status"]})}><option value="active">Ativo</option><option value="inactive">Inativo</option></select>
          <div className="flex justify-end gap-2 pt-2"><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{saving && <Loader2 className="h-4 w-4 animate-spin"/>}Salvar alterações</button></div>
        </form>
      </Modal>}

      {orderOpen && <Modal title={`Pedido PED-${String(orderOpen.order_number).padStart(6,"0")}`} onClose={() => setOrderOpen(null)}>
        <div className="grid gap-3 sm:grid-cols-2"><Info label="Número" value={`PED-${String(orderOpen.order_number).padStart(6,"0")}`}/><Info label="Data" value={dateTime(orderOpen.created_at)}/><Info label="Status" value={orderStatus[orderOpen.status] ?? orderOpen.status}/><Info label="ID do pedido" value={orderOpen.id}/></div>
        <div className="mt-5 border-t border-border pt-5"><h3 className="mb-3 font-display font-bold">Produtos do pedido</h3>
          {orderLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary"/> : orderItems.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p> :
          <div className="space-y-2">{orderItems.map(i => <div key={i.id} className="rounded-xl border border-border p-3"><p className="font-medium">{i.product_name}</p><div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3"><span>ID do produto: {i.product_id}</span><span>Código: {i.product_code}</span><span>Quantidade: {i.quantity}</span></div></div>)}</div>}
        </div>
      </Modal>}
    </div>
  );
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold text-foreground">{title}</h2><button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5"/></button></div>{children}
    </div>
  </div>;
}
function Info({label,value}:{label:string;value:string}) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p></div>; }
function UsersEmpty(){ return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary"><CheckCircle2 className="h-6 w-6 text-muted-foreground"/></div>; }
