-- Seed Neon — paridade com supabase/seed.sql + financial_configs. Idempotente.

INSERT INTO categories (name, slug, description) VALUES
('Sutiãs', 'sutias', 'Sutiãs com e sem bojo, renda e básicos'),
('Cuecas', 'cuecas', 'Cuecas masculinas e unissex'),
('Calcinhas', 'calcinhas', 'Calcinhas de algodão, renda e sem costura'),
('Meias', 'meias', 'Meias invisíveis, sapatilhas e esportivas'),
('Pijamas', 'pijamas', 'Pijamas e roupões confortáveis')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, image_url, category_id, stock, active, highlight)
SELECT v.name, v.slug, v.description, v.price, v.image_url,
       (SELECT id FROM categories c WHERE c.name = v.category LIMIT 1),
       v.stock, true, v.highlight
FROM (VALUES
('Kit 3 Calcinhas Algodão Soft','kit-3-calcinhas-algodao-soft','Conforto absoluto para o dia a dia. Tecido respirável e toque macio.',49.90,'/products/kit-calcinhas.jpg','Calcinhas',50,true),
('Sutiã Renda Comfort Sem Bojo','sutia-renda-comfort-sem-bojo','Beleza e conforto juntos. Sutiã em renda floral sem aro e sem bojo.',59.90,'/products/sutia-renda.jpg','Sutiãs',50,true),
('Cueca Boxer Feminina Modal','cueca-boxer-feminina-modal','Toque gelado e modelagem que não marca. Ideal para usar com calças justas.',29.90,'/products/cueca-boxer.jpg','Calcinhas',50,false),
('Kit 5 Pares de Meias Invisíveis','kit-5-pares-meias-invisiveis','Meias que não aparecem no tênis e não escorregam do calcanhar.',35.00,'/products/meias-invisiveis.jpg','Meias',50,false),
('Sutiã Push-Up Básico','sutia-push-up-basico','Levanta e valoriza o colo com bojo estruturado.',69.90,'/products/sutia-pushup.jpg','Sutiãs',50,true),
('Calcinha Fio Dental Renda','calcinha-fio-dental-renda','Renda delicada com acabamento premium.',19.90,'/products/calcinha-fio.jpg','Calcinhas',50,false),
('Cueca Slip Algodão Dia a Dia','cueca-slip-algodao-dia-a-dia','Clássica, confortável e durável.',25.00,'/products/cueca-slip.jpg','Cuecas',50,false),
('Meia Sapatilha Antiderrapante','meia-sapatilha-antiderrapante','Segurança e conforto para o dia a dia.',22.00,'/products/meia-sapatilha.jpg','Meias',50,false)
) AS v(name, slug, description, price, image_url, category, stock, highlight)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.slug = v.slug);

INSERT INTO financial_configs (rule_key, rule_value, description) VALUES
('free_shipping_threshold', 199.90, 'Valor mínimo do carrinho para frete grátis')
ON CONFLICT (rule_key) DO NOTHING;
