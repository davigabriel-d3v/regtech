import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const modules = ["dashboard","produtos","pedidos","clientes","estoque","acesso_plus","configuracoes"];
const operatorModules = ["dashboard","produtos","pedidos","clientes","estoque"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser();
    if (authError || !caller) throw new Error("Não autenticado.");
    const { data: allowed, error: roleError } = await supabase.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (roleError) throw roleError;
    if (!allowed) throw new Error("Acesso restrito ao administrador.");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();

    if (body.action === "list") {
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (usersError) throw usersError;
      const ids = users.users.map((u) => u.id);
      if (!ids.length) return new Response(JSON.stringify({ users: [] }), { headers: { ...cors, "Content-Type": "application/json" } });
      const { data: roles, error: rolesError } = await admin.from("user_roles").select("user_id,role").in("user_id", ids);
      if (rolesError) throw rolesError;
      const { data: perms, error: permsError } = await admin.from("access_permissions").select("user_id,module").eq("enabled", true).in("user_id", ids);
      if (permsError) throw permsError;
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, String(r.role)]));
      const permMap = new Map<string,string[]>();
      for (const p of perms ?? []) permMap.set(p.user_id, [...(permMap.get(p.user_id) ?? []), p.module]);
      return new Response(JSON.stringify({ users: users.users.filter((u) => roleMap.has(u.id)).map((u) => ({ user_id: u.id, email: u.email ?? "", role: roleMap.get(u.id) === "admin" ? "admin" : "operator", permissions: permMap.get(u.id) ?? [] })) }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (body.action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = String(body.role ?? (body.is_admin ? "admin" : "operator"));
      if (!email || password.length < 6) throw new Error("E-mail e senha válidos são obrigatórios.");
      if (role !== "admin" && role !== "operator") throw new Error("Função inválida.");
      const selected = Array.isArray(body.permissions) ? body.permissions.filter((x: unknown) => modules.includes(String(x))) : [];
      if (role === "operator" && (selected.length === 0 || selected.some((x) => !operatorModules.includes(x)))) throw new Error("Permissões inválidas para operador.");

      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;

      try {
        const { error: oldRoleError } = await admin.from("user_roles").delete().eq("user_id", created.user.id);
        if (oldRoleError) throw oldRoleError;
        const { error: roleInsertError } = await admin.from("user_roles").insert({ user_id: created.user.id, role });
        if (roleInsertError) throw roleInsertError;

        const { error: deletePermError } = await admin.from("access_permissions").delete().eq("user_id", created.user.id);
        if (deletePermError) throw deletePermError;
        if (role === "operator") {
          const { error: permError } = await admin.from("access_permissions").insert(selected.map((module: string) => ({ user_id: created.user.id, module, enabled: true })));
          if (permError) throw permError;
        }
      } catch (e) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw e;
      }

      return new Response(JSON.stringify({ ok: true, user_id: created.user.id }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (body.action === "update") {
      const userId = String(body.user_id ?? "");
      const role = String(body.role ?? (body.is_admin ? "admin" : "operator"));
      if (!userId || (role !== "admin" && role !== "operator")) throw new Error("Usuário ou função inválidos.");
      if (userId === caller.id && role !== "admin") throw new Error("O administrador atual não pode perder o acesso administrativo por esta tela.");
      const selected = Array.isArray(body.permissions) ? body.permissions.filter((x: unknown) => modules.includes(String(x))) : [];
      if (role === "operator" && (selected.length === 0 || selected.some((x) => !operatorModules.includes(x)))) throw new Error("Permissões inválidas para operador.");

      const { error: roleDeleteError } = await admin.from("user_roles").delete().eq("user_id", userId);
      if (roleDeleteError) throw roleDeleteError;
      const { error: roleInsertError } = await admin.from("user_roles").insert({ user_id: userId, role });
      if (roleInsertError) throw roleInsertError;
      const { error: deletePermError } = await admin.from("access_permissions").delete().eq("user_id", userId);
      if (deletePermError) throw deletePermError;
      if (role === "operator") {
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