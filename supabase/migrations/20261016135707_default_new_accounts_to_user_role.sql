WITH ranked_roles AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE role::text
          WHEN 'admin' THEN 1
          WHEN 'operator' THEN 2
          ELSE 3
        END,
        created_at ASC,
        id ASC
    ) AS position
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (SELECT id FROM ranked_roles WHERE position > 1);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_uidx
  ON public.user_roles (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'whatsapp'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles AS ur
  WHERE ur.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
