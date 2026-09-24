-- Catálogo da loja RegTech
CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  titulo text NOT NULL,
  marca text NOT NULL,
  categoria text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  preco numeric(10,2),
  em_estoque boolean NOT NULL DEFAULT true,
  destaque boolean NOT NULL DEFAULT false,
  imagem_url text,
  publicado boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produtos TO anon;
GRANT SELECT ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico pode ver produtos publicados"
ON public.produtos
FOR SELECT
TO anon, authenticated
USING (publicado = true);

INSERT INTO public.produtos
  (slug, titulo, marca, categoria, descricao, preco, destaque, ordem)
VALUES
  ('moto-eletrica-urbana', 'Moto Elétrica Urbana', 'Motos Elétricas', 'motos-eletricas', 'Moto elétrica para o dia a dia, com orientação na escolha do modelo e suporte depois da compra.', NULL, true, 1),
  ('moto-eletrica-infantil', 'Moto Elétrica Infantil', 'Motos Elétricas', 'motos-eletricas', 'Moto elétrica para crianças, com montagem e orientação de uso seguro.', NULL, false, 2),
  ('kit-starlink-residencial', 'Kit Starlink Residencial', 'Starlink', 'starlink', 'Antena Starlink com instalação, configuração e teste de sinal no imóvel.', NULL, true, 3),
  ('starlink-rural-empresarial', 'Starlink para Rural e Empresas', 'Starlink', 'starlink', 'Internet via satélite para sítios, fazendas e empresas onde a fibra não chega.', NULL, false, 4),
  ('iphone', 'Linha iPhone', 'Apple', 'apple', 'Aparelhos Apple com configuração, transferência de dados e suporte de quem entende.', NULL, true, 5),
  ('apple-watch', 'Apple Watch', 'Apple', 'apple', 'Relógio Apple pareado ao iPhone, com ajustes de saúde e notificações.', NULL, false, 6),
  ('airpods', 'AirPods', 'Apple', 'apple', 'Fones AirPods com pareamento, atualização e suporte.', NULL, false, 7),
  ('smartphone-realme', 'Smartphone Realme', 'Realme', 'realme', 'Aparelhos Realme com configuração inicial, clonagem de dados e garantia.', NULL, true, 8),
  ('smartwatch-realme', 'Smartwatch Realme', 'Realme', 'realme', 'Relógios Realme conectados ao celular, com ajustes de idioma e notificações.', NULL, false, 9),
  ('drone-dji', 'Drone DJI', 'DJI', 'dji', 'Drones DJI com orientação de uso, atualização de firmware e suporte.', NULL, true, 10),
  ('osmo-dji', 'Estabilizador DJI Osmo', 'DJI', 'dji', 'Estabilizadores para celular e câmera, com configuração e orientação de uso.', NULL, false, 11),
  ('smartphone-xiaomi', 'Smartphone Xiaomi', 'Xiaomi', 'xiaomi', 'Aparelhos Xiaomi com configuração, troca de dados do aparelho antigo e suporte.', NULL, true, 12),
  ('xiaomi-smart-home', 'Xiaomi Smart Home', 'Xiaomi', 'xiaomi', 'Lâmpadas, câmeras e sensores Xiaomi integrados no aplicativo da casa.', NULL, false, 13),
  ('power-bank-xiaomi', 'Power Bank Xiaomi', 'Xiaomi', 'xiaomi', 'Carregadores portáteis com capacidade certa para o seu uso.', NULL, false, 14),
  ('smartphone-samsung', 'Smartphone Samsung', 'Samsung', 'samsung', 'Aparelhos Samsung com configuração, transferência de dados e suporte.', NULL, true, 15),
  ('tv-samsung', 'Smart TV Samsung', 'Samsung', 'samsung', 'Smart TVs com instalação, suporte de parede e configuração dos aplicativos.', NULL, false, 16),
  ('galaxy-tab', 'Tablet Galaxy Tab', 'Samsung', 'samsung', 'Tablets Samsung para estudo, trabalho e lazer, com configuração completa.', NULL, false, 17),
  ('capinhas-e-peliculas', 'Capinhas e Películas', 'Acessórios', 'acessorios', 'Proteção para o celular, aplicada na loja sem bolhas.', NULL, false, 18),
  ('cabos-e-carregadores', 'Cabos e Carregadores', 'Acessórios', 'acessorios', 'Cabos, fontes e carregadores compatíveis com o seu aparelho.', NULL, false, 19);