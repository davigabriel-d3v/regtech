import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Role = "admin" | "operator" | "user";

const ALL_MODULES = [
  "dashboard",
  "produtos",
  "pedidos",
  "clientes",
  "estoque",
  "acesso_plus",
  "configuracoes",
] as const;

const OPERATOR_MODULES = ALL_MODULES.filter(
  (module) => module !== "acesso_plus" && module !== "configuracoes",
);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function json(
  body: Record<string, unknown>,
  status = 200,
  origin: string | null = null,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

function normalizeRole(value: unknown, legacyIsAdmin?: unknown): Role {
  if (value === "admin" || legacyIsAdmin === true) return "admin";
  if (value === "user") return "user";
  return "operator";
}

function cleanPermissions(value: unknown, role: Role): string[] {
  const requested = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
  const allowed = role === "admin" ? ALL_MODULES : OPERATOR_MODULES;
  return [...new Set(requested.filter((module) =>
    (allowed as readonly string[]).includes(module)
  ))];
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Configuração do Supabase incompleta na função." }, 500, origin);
  }
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Sessão não autorizada." }, 401, origin);
  }

  const token = authHeader.slice("Bearer ".length);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    return json({ error: "Sessão inválida ou expirada." }, 401, origin);
  }

  const callerId = authData.user.id;
  const { data: callerRole, error: callerRoleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .limit(1)
    .maybeSingle();

  if (callerRoleError || callerRole?.role !== "admin") {
    return json({ error: "Acesso restrito a administradores." }, 403, origin);
  }

  let body: {
    action?: "list" | "create" | "update" | "remove";
    email?: string;
    password?: string;
    role?: Role;
    is_admin?: boolean;
    permissions?: string[];
    user_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400, origin);
  }

  try {
    if (body.action === "list") {
      const users: Array<{ id: string; email: string }> = [];
      const perPage = 1000;
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await adminClient.auth.admin.listUsers({
          page,
          perPage,
        });
        if (error) throw error;
        for (const user of data.users) {
          users.push({ id: user.id, email: user.email || "" });
        }
        if (data.users.length < perPage) break;
      }

      const [rolesResult, permissionsResult] = await Promise.all([
        adminClient.from("user_roles").select("user_id, role"),
        adminClient.from("access_permissions").select("user_id, module, enabled"),
      ]);
      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;

      const roles = new Map<string, Role>(
        (rolesResult.data ?? []).map((row) => [row.user_id, row.role as Role]),
      );
      const permissions = new Map<string, string[]>();
      for (const row of permissionsResult.data ?? []) {
        if (!row.enabled) continue;
        const list = permissions.get(row.user_id) ?? [];
        list.push(row.module);
        permissions.set(row.user_id, list);
      }

      return json({
        users: users.map((user) => ({
          user_id: user.id,
          email: user.email,
          role: roles.get(user.id) ?? "user",
          permissions: [...new Set(permissions.get(user.id) ?? [])],
          is_admin: roles.get(user.id) === "admin",
        })),
      }, 200, origin);
    }

    if (body.action === "create") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password || "";
      if (!email || !email.includes("@")) {
        return json({ error: "Informe um e-mail válido." }, 400, origin);
      }
      if (password.length < 6) {
        return json({ error: "A senha deve ter pelo menos 6 caracteres." }, 400, origin);
      }

      const role = normalizeRole(body.role, body.is_admin);
      const permissions = cleanPermissions(body.permissions, role);

      const { data: created, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (createError || !created.user) {
        return json(
          { error: createError?.message || "Não foi possível criar o usuário." },
          400,
          origin,
        );
      }

      const userId = created.user.id;
      try {
        const { error: clearRoleError } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (clearRoleError) throw clearRoleError;

        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (roleError) throw roleError;

        const { error: permissionError } = await adminClient
          .from("access_permissions")
          .delete()
          .eq("user_id", userId);
        if (permissionError) throw permissionError;

        if (permissions.length > 0) {
          const { error } = await adminClient
            .from("access_permissions")
            .insert(
              permissions.map((module) => ({
                user_id: userId,
                module,
                enabled: true,
              })),
            );
          if (error) throw error;
        }
      } catch (error) {
        await adminClient.from("access_permissions").delete().eq("user_id", userId);
        await adminClient.from("user_roles").delete().eq("user_id", userId);
        await adminClient.auth.admin.deleteUser(userId);
        throw error;
      }

      return json({ ok: true, user_id: userId }, 200, origin);
    }

    if (body.action === "update") {
      const userId = body.user_id;
      if (!userId) return json({ error: "Usuário não informado." }, 400, origin);

      const role = normalizeRole(body.role, body.is_admin);
      const permissions = cleanPermissions(body.permissions, role);

      const { data: existingRole, error: existingRoleError } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (existingRoleError) throw existingRoleError;
      if (userId === callerId && role !== "admin") {
        return json(
          { error: "O administrador atual não pode remover o próprio perfil de administrador." },
          400,
          origin,
        );
      }

      const { error: deleteRoleError } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (deleteRoleError) throw deleteRoleError;

      const { error: insertRoleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (insertRoleError) throw insertRoleError;

      const { error: deletePermissionsError } = await adminClient
        .from("access_permissions")
        .delete()
        .eq("user_id", userId);
      if (deletePermissionsError) throw deletePermissionsError;

      if (permissions.length > 0) {
        const { error } = await adminClient
          .from("access_permissions")
          .insert(
            permissions.map((module) => ({
              user_id: userId,
              module,
              enabled: true,
            })),
          );
        if (error) throw error;
      }

      return json({ ok: true }, 200, origin);
    }

    if (body.action === "remove") {
      const userId = body.user_id;
      if (!userId) return json({ error: "Usuário não informado." }, 400, origin);
      if (userId === callerId) {
        return json({ error: "Não é permitido remover o próprio acesso." }, 400, origin);
      }

      const { data: targetRole, error: targetRoleError } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (targetRoleError) throw targetRoleError;
      if (targetRole.role === "admin") {
        const { count } = await adminClient
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) {
          return json({ error: "O último administrador não pode ser removido." }, 400, origin);
        }
      }

      await adminClient.from("access_permissions").delete().eq("user_id", userId);
      await adminClient.from("user_roles").delete().eq("user_id", userId);

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteUserError) throw deleteUserError;

      return json({ ok: true }, 200, origin);
    }

    return json({ error: "Ação inválida." }, 400, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return json({ error: message }, 500, origin);
  }
});
