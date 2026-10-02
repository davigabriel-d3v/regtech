import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, LogOut, ShieldCheck, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  useEffect(() => {
    supabase.from("profiles").select("nome, whatsapp, avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setNome(data.nome);
        setWhatsapp(data.whatsapp ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
    });
  }, [user.id]);

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
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">\n            <div className="relative mb-4 sm:mb-0 sm:mr-5">\n              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-secondary shadow-lg ring-2 ring-primary/20">\n                {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : <span className="text-3xl font-bold text-muted-foreground">{(nome || user.email || "U").slice(0, 1).toUpperCase()}</span>}\n              </div>\n              <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-accent">\n                <Camera className="h-4 w-4" />\n                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingAvatar} onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />\n              </label>\n            </div>\n            <div>\n              <h1 className="font-display text-2xl font-bold text-foreground">Minha conta</h1>\n              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>\n              <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WEBP ou GIF · até 5 MB</p>\n              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">\n                {avatarFile && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{avatarFile.name}</span>}\n                {avatarUrl && <button type="button" onClick={() => void removerFoto()} disabled={uploadingAvatar} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-destructive hover:bg-secondary"><Trash2 className="h-3 w-3" /> Remover foto</button>}\n              </div>\n            </div>\n          </div>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

          <form onSubmit={salvar} className="mt-6 space-y-3">
            <input className={campo} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
            <input className={campo} placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
            <button disabled={uploadingAvatar} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60">{uploadingAvatar ? "Salvando..." : "Salvar dados"}</button>
          </form>

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
