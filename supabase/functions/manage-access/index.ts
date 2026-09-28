import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const modules = ["dashboard","produtos","pedidos","clientes","estoque","acesso_plus","configuracoes"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user: caller } } = await supabase.auth.getUser();
    if (!caller) throw new Error("Não autenticado.");
    const { data: allowed } = await supabase.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!allowed) throw new Error("Acesso restrito ao administrador.");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    if (body.action === "list") {
      const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const ids = users.users.map((u) => u.id);
      const { data: roles } = await admin.from("user_roles").select("user_id,role").in("user_id", ids);
      const { data: perms } = await admin.from("access_permissions").select("user_id,module").eq("enabled", true).in("user_id", ids);
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      const permMap = new Map<string,string[]>();
      for (const p of perms ?? []) permMap.set(p.user_id, [...(permMap.get(p.user_id) ?? []), p.module]);
      return new Response(JSON.stringify({ users: users.users.filter((u) => roleMap.has(u.id)).map((u) => ({ user_id: u.id, email: u.email ?? "", is_admin: roleMap.get(u.id) === "admin", permissions: permMap.get(u.id) ?? [] })) }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (body.action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const isAdmin = Boolean(body.is_admin);
      if (!email || password.length < 6) throw new Error("E-mail e senha válidos são obrigatórios.");
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      const role = isAdmin ? "admin" : "user";
      await admin.from("user_roles").delete().eq("user_id", created.user.id);
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: created.user.id, role });
      if (roleError) throw roleError;
      if (!isAdmin) {
        const selected = Array.isArray(body.permissions) ? body.permissions.filter((x: unknown) => modules.includes(String(x))) : [];
        if (!selected.length) throw new Error("Selecione ao menos uma permissão.");
        const { error: permError } = await admin.from("access_permissions").insert(selected.map((module: string) => ({ user_id: created.user.id, module, enabled: true })));
        if (permError) throw permError;
      } else {
        await admin.from("access_permissions").delete().eq("user_id", created.user.id);
      }
      return new Response(JSON.stringify({ ok: true, user_id: created.user.id }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (body.action === "update") {
      const userId = String(body.user_id ?? "");
      if (!userId) throw new Error("Usuário inválido.");
      const isAdmin = Boolean(body.is_admin);
      const selected = Array.isArray(body.permissions) ? body.permissions.filter((x: unknown) => modules.includes(String(x))) : [];
      if (!isAdmin && !selected.length) throw new Error("Selecione ao menos uma permissão.");
      await admin.from("user_roles").delete().eq("user_id", userId);
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: userId, role: isAdmin ? "admin" : "user" });
      if (roleError) throw roleError;
      await admin.from("access_permissions").delete().eq("user_id", userId);
      if (!isAdmin) {
        const { error: permError } = await admin.from("access_permissions").insert(selected.map((module: string) => ({ user_id: userId, module, enabled: true })));
        if (permError) throw permError;
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (body.action === "remove") {
      const userId = String(body.user_id ?? "");
      if (!userId || userId === caller.id) throw new Error("Não é possível remover o próprio acesso.");
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    throw new Error("Ação inválida.");
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro inesperado." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});