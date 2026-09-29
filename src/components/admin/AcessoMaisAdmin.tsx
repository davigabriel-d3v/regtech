import { useEffect, useState } from "react";
import { KeyRound, Loader2, Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { gerenciarAcesso } from "@/lib/acessos.functions";

type Role = "admin" | "operator" | "user";
type Access = { user_id: string; email: string; role: Role; permissions: string[] };
const modules = [
  ["dashboard", "Dashboard"], ["produtos", "Produtos"], ["pedidos", "Pedidos"],
  ["clientes", "Clientes"], ["estoque", "Estoque"], ["acesso_plus", "Acesso +"], ["configuracoes", "Configurações"],
] as const;

export function AcessoMaisAdmin() {
  const [items, setItems] = useState<Access[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [permissions, setPermissions] = useState<string[]>(["dashboard", "produtos", "pedidos", "clientes", "estoque"]);
  const [editing, setEditing] = useState<Access | null>(null);
  const gerenciar = useServerFn(gerenciarAcesso);
  const call = async (body: any): Promise<{ data: any; error: Error | null }> => { try { return { data: await gerenciar({ data: body }), error: null }; } catch (e) { return { data: null, error: e as Error }; } };

  async function load() {
    setLoading(true);
    const { data, error } = await call({ action: "list" });
    if (error || data?.error) toast.error(data?.error || "Não foi possível carregar os acessos.");
    else setItems(data?.users ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function toggle(module: string) {
    setPermissions((p) => p.includes(module) ? p.filter((x) => x !== module) : [...p, module]);
  }

  async function createAccess(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }
    if (role !== "admin" && permissions.length === 0) { toast.error("Escolha pelo menos uma permissão."); return; }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-access", {
      body: { action: "create", email: email.trim(), password, role, permissions: role === "admin" ? modules.map(([id]) => id) : permissions.filter((p) => !["acesso_plus", "configuracoes"].includes(p)) },
    });
    setSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Não foi possível criar o acesso."); return; }
    toast.success("Acesso criado com sucesso.");
    setOpen(false); setEmail(""); setPassword(""); setRole("operator"); setPermissions(["dashboard", "produtos", "pedidos", "clientes", "estoque"]);
    await load();
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { data, error } = await call({ action: "update", user_id: editing.user_id, role: editing.role, permissions: editing.role === "admin" ? modules.map(([id]) => id) : editing.permissions.filter((p) => !["acesso_plus", "configuracoes"].includes(p)) });
    setSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Não foi possível atualizar."); return; }
    toast.success("Permissões atualizadas."); setEditing(null); await load();
  }

  async function removeAccess(userId: string) {
    if (!confirm("Remover este acesso? O usuário não poderá mais entrar no painel.")) return;
    const { data, error } = await call({ action: "remove", user_id: userId });
    if (error || data?.error) toast.error(data?.error || error?.message || "Não foi possível remover.");
    else { toast.success("Acesso removido."); await load(); }
  }

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-display text-2xl font-bold">Acesso +</h2><p className="text-sm text-muted-foreground">Crie acessos para sua equipe e controle o que cada usuário pode administrar.</p></div>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" /> Novo acesso</button>
    </div>

    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> :
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item.user_id} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.email}</p><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{item.role === "admin" ? <><ShieldCheck className="h-3.5 w-3.5" /> Administrador</> : <><KeyRound className="h-3.5 w-3.5" /> Operador</>}</span></div>
          <div className="flex gap-1"><button onClick={() => setEditing(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Editar permissões"><Pencil className="h-4 w-4" /></button><button onClick={() => removeAccess(item.user_id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Remover acesso"><Trash2 className="h-4 w-4" /></button></div></div>
        {item.role !== "admin" && <div className="mt-4 flex flex-wrap gap-2">{item.permissions.map((p) => <span key={p} className="rounded-full border border-border px-2.5 py-1 text-xs">{modules.find(([id]) => id === p)?.[1] ?? p}</span>)}</div>}
      </div>)}</div>}

    {open && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur" onMouseDown={() => setOpen(false)}>
      <form onSubmit={createAccess} onMouseDown={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6">
        <h3 className="font-display text-2xl font-bold">Novo acesso</h3>
        <p className="mt-1 text-sm text-muted-foreground">O usuário receberá um acesso separado ao painel.</p>
        <div className="mt-5 space-y-4">
          <input required type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          <input required type="password" minLength={6} placeholder="Senha inicial" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          <label className="block rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <span className="font-semibold">Função</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2">
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
            <span className="mt-2 block text-xs text-muted-foreground">Operadores não recebem acesso a Acesso + nem Configurações.</span>
          </label>
          {role !== "admin" && <div><p className="mb-2 text-sm font-semibold">Permissões do operador</p><div className="grid gap-2 sm:grid-cols-2">{modules.filter(([id]) => !["acesso_plus", "configuracoes"].includes(id)).map(([id, label]) => <label key={id} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={permissions.includes(id)} onChange={() => toggle(id)} /> {label}</label>)}</div></div>}
        </div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Criar acesso</button></div>
      </form>
    </div>}
    {editing && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur" onMouseDown={() => setEditing(null)}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl font-bold">Editar acesso</h3>
        <p className="mt-1 text-sm text-muted-foreground">{editing.email}</p>
        <div className="mt-5 space-y-4">
          <label className="block rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <span className="font-semibold">Função</span>
            <select value={editing.role === "user" ? "operator" : editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2">
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          {editing.role !== "admin" && <div>
            <p className="mb-2 text-sm font-semibold">Permissões</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {modules.filter(([id]) => !["acesso_plus", "configuracoes"].includes(id)).map(([id, label]) => <label key={id} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                <input type="checkbox" checked={editing.permissions.includes(id)} onChange={() => setEditing({ ...editing, permissions: editing.permissions.includes(id) ? editing.permissions.filter((x) => x !== id) : [...editing.permissions, id] })} />
                {label}
              </label>)}
            </div>
          </div>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5">Cancelar</button>
          <button type="button" onClick={saveEdit} disabled={saving || (editing.role !== "admin" && editing.permissions.length === 0)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
          </button>
        </div>
      </div>
    </div>}

  </section>;
}
