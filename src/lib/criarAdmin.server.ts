import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const criarAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = supabaseAdmin;
  const email = "admin@gmail.com";
  const password = "@DaviGabriel@2240@";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome: "Administrador", whatsapp: "" } },
  });

  if (error) throw new Error(`Falha ao criar admin: ${error.message}`);
  return data;
});

export const adminJaExiste = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;
  const { data: { users } } = await supabase.auth.admin.listUsers();
  return (users ?? []).some((u: any) => u.email === "admin@gmail.com");
});

