CREATE TABLE public.marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  logo_url text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marcas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marcas TO authenticated;
GRANT ALL ON public.marcas TO service_role;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publico ve marcas ativas" ON public.marcas FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY "Admin ve marcas" ON public.marcas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin cria marcas" ON public.marcas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edita marcas" ON public.marcas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin apaga marcas" ON public.marcas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.marcas (nome, ordem) VALUES
 ('Samsung',1),('Apple',2),('Motorola',3),('Xiaomi',4),('LG',5),('Philips',6),('JBL',7),('Lenovo',8);

CREATE TABLE public.newsletter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (char_length(email) BETWEEN 5 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter TO anon, authenticated;
GRANT SELECT ON public.newsletter TO authenticated;
GRANT ALL ON public.newsletter TO service_role;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um se inscreve" ON public.newsletter FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin ve inscritos" ON public.newsletter FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.produtos ADD COLUMN preco_antigo numeric(10,2);
ALTER TABLE public.produtos ADD COLUMN avaliacao numeric(2,1) NOT NULL DEFAULT 5.0;
ALTER TABLE public.produtos ADD COLUMN avaliacoes integer NOT NULL DEFAULT 0;
UPDATE public.produtos SET avaliacao = 4.5 + (abs(hashtext(slug)) % 5) / 10.0, avaliacoes = 20 + abs(hashtext(slug)) % 180;