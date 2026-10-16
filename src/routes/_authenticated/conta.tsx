import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Camera, Heart, LogOut, Package, ShieldCheck, Store, Trash2, CheckCircle2, TicketPercent, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavoritos } from "@/hooks/useFavoritos";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — RegTech" },
      { name: "description", content: "Gerencie seus dados na RegTech." },
      { property: "og:title", content: "Minha conta — RegTech" },
      { property: "og:description", content: "Gerencie seus dados na RegTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conta,
});

const campo =
  "w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Conta() {
  const { user } = Route.useRouteContext();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [orders, setOrders] = useState<Array<{ id: string; order_number: number; status: string; created_at: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; read_at: string | null; created_at: string }>>([]);
  const [myCoupons, setMyCoupons] = useState<Array<any>>([]);
  const [couponWhatsapp, setCouponWhatsapp] = useState("");
  const { favs } = useFavoritos();

  useEffect(() => {
    supabase.from("profiles").select("nome, whatsapp, avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setNome(data.nome);
        setWhatsapp(data.whatsapp ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
    });
  }, [user.id]);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      supabase.from("orders").select("id,order_number,status,created_at").order("created_at", { ascending: false }).limit(8),
      (supabase as any).from("user_notifications").select("id,title,message,type,read_at,created_at").order("created_at", { ascending: false }).limit(8),
      (supabase as any).rpc("get_my_coupon_redemptions"),
      supabase.from("shop_settings").select("whatsapp_phone").eq("id", "default").maybeSingle(),
    ]).then(([ordersResult, notificationsResult, couponsResult, settingsResult]) => {
      if (!ativo) return;
      setOrders((ordersResult.data ?? []) as typeof orders);
      setNotifications((notificationsResult.data ?? []) as typeof notifications);
      setMyCoupons((couponsResult.data ?? []) as Array<any>);
      setCouponWhatsapp((settingsResult.data as any)?.whatsapp_phone ?? "");
    });
    return () => { ativo = false; };
  }, [user.id]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  function usarCupom(redemption: any) {
    const coupon = Array.isArray(redemption.coupons) ? redemption.coupons[0] : redemption.coupons;
    const phone = couponWhatsapp.replace(/\D/g, "");
    if (!phone) { toast.error("O WhatsApp para cupons ainda não foi configurado pelo administrador."); return; }
    const message = `Olá! Quero usar meu cupom ${coupon?.code ?? ""} (${coupon?.name ?? "RegTech"}). Meu e-mail da conta é ${user.email ?? user.id}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function marcarNotificacao(id: string) {
    const now = new Date().toISOString();
    const { error } = await (supabase as any).from("user_notifications").update({ read_at: now }).eq("id", id).eq("user_id", user.id);
    if (!error) setNotifications((items) => items.map((item) => item.id === id ? { ...item, read_at: now } : item));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setUploadingAvatar(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (avatarFile) {
        if (!avatarFile.type.startsWith("image/")) throw new Error("Escolha uma imagem válida.");
        if (avatarFile.size > 5 * 1024 * 1024) throw new Error("A foto deve ter no máximo 5 MB.");
        const extension = avatarFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = user.id + "/avatar." + extension;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
          cacheControl: "3600",
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        nextAvatarUrl = data.publicUrl + "?v=" + Date.now();
        setAvatarUrl(nextAvatarUrl);
        setAvatarFile(null);
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        nome: nome.trim() || null,
        whatsapp: whatsapp.trim() || null,
        avatar_url: nextAvatarUrl,
      });
      if (error) throw error;
      toast.success("Dados atualizados!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removerFoto() {
    setUploadingAvatar(true);
    try {
      const { data: files } = await supabase.storage.from("avatars").list(user.id);
      const paths = (files ?? []).map((file) => user.id + "/" + file.name);
      if (paths.length) await supabase.storage.from("avatars").remove(paths);
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      if (error) throw error;
      setAvatarUrl(null);
      setAvatarFile(null);
      toast.success("Foto de perfil removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">
            <div className="relative mb-4 sm:mb-0 sm:mr-5">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-secondary shadow-lg ring-2 ring-primary/20">
                {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : <span className="text-3xl font-bold text-muted-foreground">{(nome || user.email || "U").slice(0, 1).toUpperCase()}</span>}
              </div>
              <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-accent">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingAvatar} onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Minha conta</h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WEBP ou GIF · até 5 MB</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {avatarFile && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{avatarFile.name}</span>}
                {avatarUrl && <button type="button" onClick={() => void removerFoto()} disabled={uploadingAvatar} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-destructive hover:bg-secondary"><Trash2 className="h-3 w-3" /> Remover foto</button>}
              </div>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

          <form onSubmit={salvar} className="mt-6 space-y-3">
            <input className={campo} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
            <input className={campo} placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
            <button disabled={uploadingAvatar} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60">{uploadingAvatar ? "Salvando..." : "Salvar dados"}</button>
          </form>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/20 p-4"><div className="flex items-center gap-2 text-primary"><Package className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Pedidos</span></div><p className="mt-2 text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">últimos pedidos</p></div>
            <div className="rounded-2xl border border-border bg-secondary/20 p-4"><div className="flex items-center gap-2 text-primary"><Heart className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Favoritos</span></div><p className="mt-2 text-2xl font-bold">{favs.length}</p><p className="text-xs text-muted-foreground">produtos salvos</p></div>
            <div className="rounded-2xl border border-border bg-secondary/20 p-4"><div className="flex items-center gap-2 text-primary"><Bell className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Notificações</span></div><p className="mt-2 text-2xl font-bold">{unreadCount}</p><p className="text-xs text-muted-foreground">não lidas</p></div>
          </div>

          <section className="mt-8 rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2"><TicketPercent className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-bold">Meus cupons</h2></div>
            <p className="mt-1 text-xs text-muted-foreground">Os cupons resgatados ficam salvos nesta conta. Use o botão para abrir o WhatsApp com a mensagem pronta.</p>
            <div className="mt-4 space-y-3">
              {myCoupons.length ? myCoupons.map((redemption) => {
                const coupon = Array.isArray(redemption.coupons) ? redemption.coupons[0] : redemption.coupons;
                if (!coupon) return null;
                const currentCycle = redemption.redemption_cycle === coupon.redemption_cycle;
                const reward = coupon.reward_type === "percent_discount"
                  ? `${Number(coupon.reward_value).toLocaleString("pt-BR")}% de desconto`
                  : coupon.reward_type === "fixed_discount" || coupon.reward_type === "credit"
                    ? `R$ ${Number(coupon.reward_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : coupon.reward_text || "Recompensa";
                return <div key={redemption.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-mono text-sm font-bold">{coupon.code}</p><p className="mt-1 text-sm font-semibold">{coupon.name}</p><p className="mt-1 text-xs text-muted-foreground">{reward}</p><p className="mt-1 text-[11px] text-muted-foreground">Resgatado em {new Date(redemption.redeemed_at).toLocaleString("pt-BR")}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentCycle ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{currentCycle ? "Cupom resgatado" : "Ciclo anterior"}</span>
                  </div>
                  {currentCycle && <button type="button" onClick={() => usarCupom(redemption)} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><MessageCircle className="h-4 w-4" /> Usar cupom no WhatsApp</button>}
                </div>;
              }) : <p className="py-4 text-sm text-muted-foreground">Você ainda não resgatou cupons. <Link to="/resgatar" className="font-semibold text-primary hover:underline">Resgatar um cupom</Link></p>}
            </div>
            <Link to="/resgatar" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary"><TicketPercent className="h-4 w-4" /> Resgatar novo cupom</Link>
          </section>

          <section className="mt-8 rounded-2xl border border-border p-5">
            <h2 className="font-display text-lg font-bold">Meus pedidos</h2><p className="text-xs text-muted-foreground">Acompanhe seus pedidos recentes.</p>
            <div className="mt-4 space-y-2">{orders.length ? orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/30 px-4 py-3"><div><p className="text-sm font-semibold">PED-{String(order.order_number).padStart(6, "0")}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{order.status}</span></div>
            )) : <p className="py-4 text-sm text-muted-foreground">Você ainda não possui pedidos vinculados a este e-mail.</p>}</div>
          </section>

          <section className="mt-5 rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-bold">Notificações</h2></div>
            <div className="mt-4 space-y-2">{notifications.length ? notifications.map((item) => (
              <button key={item.id} type="button" onClick={() => !item.read_at && void marcarNotificacao(item.id)} className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-secondary/40 ${item.read_at ? "border-border" : "border-primary/40 bg-primary/5"}`}>
                <div className="flex items-start gap-3"><CheckCircle2 className={`mt-0.5 h-4 w-4 ${item.read_at ? "text-muted-foreground" : "text-primary"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.message}</p><p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-BR")}</p></div></div>
              </button>
            )) : <p className="py-4 text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>}</div>
          </section>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-foreground hover:bg-secondary">
              <Store className="h-4 w-4" /> Ir ao Shop
            </Link>
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm text-primary hover:bg-secondary">
                <ShieldCheck className="h-4 w-4" /> Painel admin
              </Link>
            )}
            <button onClick={sair} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-destructive hover:bg-secondary sm:col-span-2">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
