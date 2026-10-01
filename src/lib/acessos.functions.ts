import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = {
  action: "list" | "create" | "update" | "remove";
  email?: string;
  password?: string;
  role?: string;
  permissions?: string[];
  user_id?: string;
};

export const gerenciarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => d)
  .handler(async ({ data: body, context }) => {
    const { data, error } = await context.supabase.functions.invoke("manage-access", {
      body,
    });
    if (error) throw error;
    return data;
  });
