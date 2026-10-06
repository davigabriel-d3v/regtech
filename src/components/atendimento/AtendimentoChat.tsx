import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImagePlus, MessageCircle, Minimize2, Paperclip, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "customer" | "admin";
  message: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  created_at: string;
  read_at: string | null;
};

export function AtendimentoChat() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setConversation(null);
        setMessages([]);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function loadChat(currentUser = user) {
    if (!currentUser) return;
    const { data: existing, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      toast.error("Não foi possível carregar o atendimento.");
      return;
    }

    let conv = existing;
    if (!conv) {
      const created = await (supabase as any)
        .from("chat_conversations")
        .insert({ user_id: currentUser.id, subject: "Atendimento RegTech" })
        .select("*")
        .single();
      if (created.error) {
        toast.error("Não foi possível iniciar o atendimento.");
        return;
      }
      conv = created.data;
    }

    setConversation(conv);
    const { data: rows } = await (supabase as any)
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages((rows ?? []) as ChatMessage[]);
  }

  useEffect(() => {
    if (open && user) void loadChat(user);
  }, [open, user?.id]);

  useEffect(() => {
    if (!conversation?.id) return;
    const channel = supabase
      .channel("chat-customer-" + conversation.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "conversation_id=eq." + conversation.id }, (payload) => {
        setMessages((current) => current.some((m) => m.id === payload.new.id) ? current : [...current, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  const unread = useMemo(() => messages.filter((m) => m.sender_role === "admin" && !m.read_at).length, [messages]);

  async function send() {
    if (!user || !conversation || sending) return;
    const clean = text.trim();
    if (!clean && !file) return;
    if (file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
      toast.error("Envie apenas imagens de até 5 MB.");
      return;
    }

    setSending(true);
    try {
      let attachment_url = null;
      let attachment_name = null;
      let attachment_type = null;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = user.id + "/" + crypto.randomUUID() + "." + ext;
        const uploaded = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type, cacheControl: "3600" });
        if (uploaded.error) throw uploaded.error;
        attachment_url = supabase.storage.from("chat-attachments").getPublicUrl(path).data.publicUrl;
        attachment_name = file.name;
        attachment_type = file.type;
      }

      const { data, error } = await (supabase as any)
        .from("chat_messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_role: "customer",
          message: clean || null,
          attachment_url,
          attachment_name,
          attachment_type,
        })
        .select("*")
        .single();
      if (error) throw error;
      setMessages((current) => current.some((m) => m.id === data.id) ? current : [...current, data as ChatMessage]);
      setText("");
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/15"><MessageCircle className="h-5 w-5" /></span>
              <div><p className="font-display font-bold">Atendimento RegTech</p><p className="text-xs opacity-80">Fale com nossa equipe</p></div>
            </div>
            <button aria-label="Minimizar atendimento" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-primary-foreground/10"><Minimize2 className="h-4 w-4" /></button>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><MessageCircle className="h-8 w-8" /></span>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">Entre para falar conosco</h3>
              <p className="mt-2 text-sm text-muted-foreground">Assim conseguimos manter seu histórico e responder seu atendimento.</p>
              <Link to="/auth" className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Entrar na conta</Link>
            </div>
          ) : loading ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-4">
                {messages.length === 0 && <div className="py-12 text-center"><p className="text-sm font-semibold text-foreground">Olá! 👋</p><p className="mt-1 text-xs text-muted-foreground">Como podemos ajudar você hoje?</p></div>}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "customer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 ${m.sender_role === "customer" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card border border-border text-foreground"}`}>
                      {m.message && <p className="whitespace-pre-wrap text-sm">{m.message}</p>}
                      {m.attachment_url && <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl"><img src={m.attachment_url} alt={m.attachment_name || "Anexo"} className="max-h-52 w-full object-cover" /></a>}
                      <p className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border bg-card p-3">
                {file && <div className="mb-2 flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-xs"><span className="flex min-w-0 items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /><span className="truncate">{file.name}</span></span><button onClick={() => setFile(null)}><X className="h-4 w-4" /></button></div>}
                <div className="flex items-end gap-2">
                  <label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"><Paperclip className="h-4 w-4" /><input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Digite sua mensagem..." rows={1} className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  <button disabled={sending || (!text.trim() && !file)} onClick={() => void send()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button aria-label="Abrir atendimento" onClick={() => setOpen((v) => !v)} className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-background transition-transform hover:scale-105">
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
      </button>
    </div>
  );
}
