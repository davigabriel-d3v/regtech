import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, MessageCircle, Paperclip, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Conversation = {
  id: string; user_id: string; status: "open" | "closed"; subject: string | null; created_at: string; updated_at: string; last_message_at: string;
};
type Message = {
  id: string; conversation_id: string; sender_id: string; sender_role: "customer" | "admin"; message: string | null; attachment_url: string | null; attachment_name: string | null; attachment_type: string | null; created_at: string; read_at: string | null;
};

export function ChatAdmin() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { nome: string | null; avatar_url: string | null }>>({});
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const { data, error } = await (supabase as any).from("chat_conversations").select("*").order("last_message_at", { ascending: false });
    if (error) { toast.error("Não foi possível carregar os atendimentos."); return; }
    const rows = (data ?? []) as Conversation[];
    setConversations(rows);
    const ids = rows.map((r) => r.user_id);
    if (ids.length) {
      const { data: ps } = await (supabase as any).from("profiles").select("id,nome,avatar_url").in("id", ids);
      const map: Record<string, { nome: string | null; avatar_url: string | null }> = {};
      for (const p of ps ?? []) map[p.id] = { nome: p.nome, avatar_url: p.avatar_url };
      setProfiles(map);
    }
    if (!selected && rows[0]) setSelected(rows[0]);
    if (selected && !rows.some((r) => r.id === selected.id)) setSelected(rows[0] ?? null);
    setLoading(false);
  }

  async function loadMessages(conversationId: string) {
    const { data, error } = await (supabase as any).from("chat_messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    if (error) { toast.error("Não foi possível carregar as mensagens."); return; }
    setMessages((data ?? []) as Message[]);
    const unread = ((data ?? []) as Message[]).filter((m) => m.sender_role === "customer" && !m.read_at);
    if (unread.length) await (supabase as any).from("chat_messages").update({ read_at: new Date().toISOString() }).in("id", unread.map((m) => m.id));
  }

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => { if (selected) void loadMessages(selected.id); else setMessages([]); }, [selected?.id]);

  useEffect(() => {
    const channel = supabase.channel("admin-chat-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, (payload) => {
        const row = payload.new as Message;
        if (payload.eventType === "INSERT") {
          if (selected?.id === row.conversation_id) {
            setMessages((current) => current.some((m) => m.id === row.id) ? current : [...current, row]);
            if (row.sender_role === "customer") void (supabase as any).from("chat_messages").update({ read_at: new Date().toISOString() }).eq("id", row.id);
          }
          void loadConversations();
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => (profiles[c.user_id]?.nome || "").toLowerCase().includes(term) || c.user_id.toLowerCase().includes(term));
  }, [conversations, profiles, search]);

  async function send() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !selected || sending) return;
    const clean = text.trim();
    if (!clean && !file) return;
    if (file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) { toast.error("Envie apenas imagens de até 5 MB."); return; }
    setSending(true);
    try {
      let attachment_url = null, attachment_name = null, attachment_type = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = auth.user.id + "/" + crypto.randomUUID() + "." + ext;
        const uploaded = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type, cacheControl: "3600" });
        if (uploaded.error) throw uploaded.error;
        attachment_url = supabase.storage.from("chat-attachments").getPublicUrl(path).data.publicUrl;
        attachment_name = file.name; attachment_type = file.type;
      }
      const { data, error } = await (supabase as any).from("chat_messages").insert({ conversation_id: selected.id, sender_id: auth.user.id, sender_role: "admin", message: clean || null, attachment_url, attachment_name, attachment_type }).select("*").single();
      if (error) throw error;
      setMessages((current) => current.some((m) => m.id === data.id) ? current : [...current, data as Message]);
      setText(""); setFile(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar."); }
    finally { setSending(false); }
  }

  async function toggleStatus() {
    if (!selected) return;
    const next = selected.status === "open" ? "closed" : "open";
    const { error } = await (supabase as any).from("chat_conversations").update({ status: next }).eq("id", selected.id);
    if (error) toast.error("Não foi possível atualizar o atendimento.");
    else { setSelected({ ...selected, status: next }); setConversations((all) => all.map((c) => c.id === selected.id ? { ...c, status: next } : c)); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="grid min-h-[calc(100vh-140px)] overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[330px_1fr]">
      <aside className="border-b border-border lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /><h2 className="font-display font-bold">Atendimentos</h2><span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{conversations.filter((c) => c.status === "open").length} abertos</span></div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar atendimento..." className="w-full bg-transparent py-2.5 text-sm outline-none" /></div>
        </div>
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          {filtered.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Nenhum atendimento ainda.</p> : filtered.map((c) => {
            const profile = profiles[c.user_id]; const last = messages.find((m) => m.conversation_id === c.id);
            return <button key={c.id} onClick={() => setSelected(c)} className={`flex w-full items-center gap-3 border-b border-border p-4 text-left hover:bg-secondary/40 ${selected?.id === c.id ? "bg-primary/5" : ""}`}>
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="font-bold text-muted-foreground">{(profile?.nome || "C").slice(0,1).toUpperCase()}</span>}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{profile?.nome || "Cliente"}</p><span className={`h-2 w-2 rounded-full ${c.status === "open" ? "bg-primary" : "bg-muted-foreground"}`} /></div><p className="truncate text-xs text-muted-foreground">{last?.message || c.subject || "Novo atendimento"}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleString("pt-BR")}</p></div>
            </button>;
          })}
        </div>
      </aside>

      <section className="flex min-h-[560px] flex-col">
        {!selected ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageCircle className="h-12 w-12 text-muted-foreground/40" /><p className="mt-3 font-semibold">Selecione um atendimento</p><p className="mt-1 text-sm text-muted-foreground">As conversas dos clientes aparecerão aqui.</p></div> : (
          <>
            <header className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-secondary">{profiles[selected.user_id]?.avatar_url ? <img src={profiles[selected.user_id]?.avatar_url ?? undefined} alt="" className="h-full w-full object-cover" /> : <span className="font-bold">{(profiles[selected.user_id]?.nome || "C").slice(0,1).toUpperCase()}</span>}</div><div><p className="font-semibold">{profiles[selected.user_id]?.nome || "Cliente"}</p><p className="text-xs text-muted-foreground">{selected.subject || "Atendimento RegTech"}</p></div></div>
              <button onClick={() => void toggleStatus()} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary">{selected.status === "open" ? "Encerrar atendimento" : "Reabrir atendimento"}</button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/10 p-5">
              {messages.map((m) => <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-3 ${m.sender_role === "admin" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card"}`}>{m.message && <p className="whitespace-pre-wrap text-sm">{m.message}</p>}{m.attachment_url && <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl"><img src={m.attachment_url} alt={m.attachment_name || "Anexo"} className="max-h-64 w-full object-cover" /></a>}<p className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleString("pt-BR")}</p></div></div>)}
              <div ref={bottomRef} />
            </div>
            {selected.status === "open" && <div className="border-t border-border bg-card p-3">{file && <div className="mb-2 flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-xs"><span className="flex min-w-0 items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /><span className="truncate">{file.name}</span></span><button onClick={() => setFile(null)}><X className="h-4 w-4" /></button></div>}<div className="flex items-end gap-2"><label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-border text-muted-foreground hover:bg-secondary"><Paperclip className="h-4 w-4" /><input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label><textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={1} placeholder="Responder cliente..." className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /><button disabled={sending || (!text.trim() && !file)} onClick={() => void send()} className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button></div></div>}
          </>
        )}
      </section>
    </div>
  );
}
