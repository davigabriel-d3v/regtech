import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const modules = ["dashboard", "produtos", "pedidos", "clientes", "estoque", "acesso_plus", "configuracoes"];
const operatorModules = ["dashboard", "produtos", "pedidos", "clientes", "estoque"];

type Input = { action: "list" | "create" | "update" | "remove"; email?: string; password?: string; role?: string; permissions?: string[]; user_id?: string };

export const gerenciarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => d)
  .handler(async ({ data: body, context }) => {
    try {
      const { data: allowed } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!allowed) throw new Error("Acesso restrito ao administrador.");
      const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");

      const setAccess = async (userId: string, role: "admin" | "operator", selected: string[]) => {
        let r = await admin.from("user_roles").delete().eq("user_id", userId);
        if (r.error) throw r.error;
        r = await admin.from("user_roles").insert({ user_id: userId, role });
        if (r.error) throw r.error;
        r = await admin.from("access_permissions").delete().eq("user_id", userId);
        if (r.error) throw r.error;
        if (role === "operator") {
          r = await admin.from("access_permissions").insert(selected.map((module) => ({ user_id: userId, module, enabled: true })));
          if (r.error) throw r.error;
        }
      };
      const parse = () => {
        const role = String(body.role ?? "operator");
        if (role !== "admin" && role !== "operator") throw new Error("Função inválida.");
        const selected = (body.permissions ?? []).map(String).filter((x) => modules.includes(x));
        if (role === "operator" && (!selected.length || selected.some((x) => !operatorModules.includes(x)))) throw new Error("Permissões inválidas para operador.");
        return { role: role as "admin" | "operator", selected };
      };

      if (body.action === "list") {
        const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;
        const { data: roles } = await admin.from("user_roles").select("user_id,role").in("role", ["admin", "operator"]);
        const { data: perms } = await admin.from("access_permissions").select("user_id,module").eq("enabled", true);
        const roleMap = new Map<string, string>();
        for (const r of roles ?? []) if (roleMap.get(r.user_id) !== "admin") roleMap.set(r.user_id, String(r.role));
        const permMap = new Map<string, string[]>();
        for (const p of perms ?? []) permMap.set(p.user_id, [...(permMap.get(p.user_id) ?? []), p.module]);
        return { users: users.users.filter((u) => roleMap.has(u.id)).map((u) => ({ user_id: u.id, email: u.email ?? "", role: roleMap.get(u.id) === "admin" ? "admin" : "operator", permissions: permMap.get(u.id) ?? [] })) };
      }
      if (body.action === "create") {
        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        if (!email || password.length < 6) throw new Error("E-mail e senha válidos são obrigatórios.");
        const { role, selected } = parse();
        const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
        if (error) throw new Error(/already/i.test(error.message) ? "Já existe uma conta com este e-mail." : error.message);
        try { await setAccess(created.user.id, role, selected); }
        catch (e) { await admin.auth.admin.deleteUser(created.user.id); throw e; }
        return { ok: true };
      }
      if (body.action === "update") {
        const userId = String(body.user_id ?? "");
        const { role, selected } = parse();
        if (!userId) throw new Error("Usuário inválido.");
        if (userId === context.userId && role !== "admin") throw new Error("Você não pode remover seu próprio acesso de administrador.");
        await setAccess(userId, role, selected);
        return { ok: true };
      }
      if (body.action === "remove") {
        const userId = String(body.user_id ?? "");
        if (!userId || userId === context.userId) throw new Error("Não é possível remover o próprio acesso.");
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return { ok: true };
      }
      throw new Error("Ação inválida.");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro inesperado." } as { error: string; users?: never };
    }
  });
