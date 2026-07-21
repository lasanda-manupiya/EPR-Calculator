-- Replace the shared, global packaging reference library (39 items).
-- Run in the Supabase SQL editor. Personal library items are not touched.
--
-- Corrugated and paper weights are derived from blank area x grammage
-- (E 383, B 443, BC 718 g/m2 board; 70-90 g/m2 kraft), so every row can be
-- recalculated from its own dimensions. Glass, metal, plastic and wood are
-- typical UK industry values and must be checked against supplier specs
-- before an EPR submission. Weights are stored in grams.

begin;

delete from public.reference_library where user_id is null;

with v(name, material, ptype, len, wid, hei, wt, dens, notes) as (values
  ('Cardboard carton, small','Cardboard','primary',100,100,100,33.73,0.000033735,'Derived: FEFCO 0201 blank x 383 g/m2 E flute board. Verify against supplier spec.'),
  ('Cardboard carton, medium','Cardboard','primary',200,150,100,70.92,0.00002364,'Derived: FEFCO 0201 blank x 383 g/m2 E flute board. Verify against supplier spec.'),
  ('Cardboard carton, large','Cardboard','primary',300,200,150,139.54,0.000015504,'Derived: FEFCO 0201 blank x 383 g/m2 E flute board. Verify against supplier spec.'),
  ('Cardboard shipping case, small','Cardboard','secondary',250,180,120,119.56,0.00002214,'Derived: FEFCO 0201 blank x 443 g/m2 B flute board. Verify against supplier spec.'),
  ('Cardboard shipping case, medium','Cardboard','secondary',400,300,200,318.82,0.000013284,'Derived: FEFCO 0201 blank x 443 g/m2 B flute board. Verify against supplier spec.'),
  ('Cardboard shipping case, large','Cardboard','secondary',550,400,300,601.32,0.000009111,'Derived: FEFCO 0201 blank x 443 g/m2 B flute board. Verify against supplier spec.'),
  ('Cardboard transit case, small','Cardboard','tertiary',600,400,400,1171.69,0.000012205,'Derived: FEFCO 0201 blank x 718 g/m2 BC flute board. Verify against supplier spec.'),
  ('Cardboard transit case, medium','Cardboard','tertiary',800,600,500,2242.88,0.000009345,'Derived: FEFCO 0201 blank x 718 g/m2 BC flute board. Verify against supplier spec.'),
  ('Cardboard pallet box, large','Cardboard','tertiary',1200,1000,800,5737.86,0.000005977,'Derived: FEFCO 0201 blank x 718 g/m2 BC flute board. Verify against supplier spec.'),
  ('Paper bag, small','Paper','primary',180,80,220,11.59,0.000003659,'Derived: surface area x 90 g/m2 kraft paper. Verify against supplier spec.'),
  ('Paper bag, medium','Paper','primary',260,120,320,24.7,0.000002474,'Derived: surface area x 90 g/m2 kraft paper. Verify against supplier spec.'),
  ('Paper bag, large','Paper','primary',320,160,420,40.9,0.000001902,'Derived: surface area x 90 g/m2 kraft paper. Verify against supplier spec.'),
  ('Paper wrap sheet, small','Paper','secondary',500,500,1,17.5,0.00007,'Derived: surface area x 70 g/m2 kraft paper. Verify against supplier spec.'),
  ('Paper wrap sheet, medium','Paper','secondary',750,750,1,39.38,0.00007,'Derived: surface area x 70 g/m2 kraft paper. Verify against supplier spec.'),
  ('Paper wrap sheet, large','Paper','secondary',1000,1000,1,70,0.00007,'Derived: surface area x 70 g/m2 kraft paper. Verify against supplier spec.'),
  ('PET bottle 500 ml','Plastic','primary',65,65,220,14,0.000015062,'Typical UK industry value for a 500 ml PET drinks bottle. Verify against supplier spec before EPR submission.'),
  ('PET bottle 1 L','Plastic','primary',80,80,280,22,0.000012277,'Typical UK industry value for a 1 litre PET bottle. Verify against supplier spec before EPR submission.'),
  ('PET bottle 2 L','Plastic','primary',100,100,320,35,0.000010937,'Typical UK industry value for a 2 litre PET bottle. Verify against supplier spec before EPR submission.'),
  ('Polythene mailer, small','Plastic','secondary',250,180,5,8,0.000035556,'Typical UK industry value for a small co-extruded courier mailer. Verify against supplier spec before EPR submission.'),
  ('Polythene mailer, medium','Plastic','secondary',350,250,5,15,0.000034286,'Typical UK industry value for a medium co-extruded courier mailer. Verify against supplier spec before EPR submission.'),
  ('Polythene mailer, large','Plastic','secondary',450,350,5,25,0.000031746,'Typical UK industry value for a large co-extruded courier mailer. Verify against supplier spec before EPR submission.'),
  ('Pallet stretch wrap, half pallet','Plastic','tertiary',800,600,800,120,3.13e-7,'Typical UK industry value for stretch wrap on a half pallet load. Verify against supplier spec before EPR submission.'),
  ('Pallet stretch wrap, full pallet','Plastic','tertiary',1200,1000,1200,220,1.53e-7,'Typical UK industry value for stretch wrap on a standard pallet load. Verify against supplier spec before EPR submission.'),
  ('Pallet stretch wrap, tall pallet','Plastic','tertiary',1200,1000,1800,320,1.48e-7,'Typical UK industry value for stretch wrap on a tall pallet load. Verify against supplier spec before EPR submission.'),
  ('Glass jar 100 ml','Glass','primary',55,55,80,110,0.000454545,'Typical UK industry value for a 100 ml container glass jar. Verify against supplier spec before EPR submission.'),
  ('Glass bottle 500 ml','Glass','primary',65,65,230,300,0.000308721,'Typical UK industry value for a 500 ml container glass bottle. Verify against supplier spec before EPR submission.'),
  ('Glass bottle 750 ml','Glass','primary',75,75,300,450,0.000266667,'Typical UK industry value for a 750 ml wine bottle. Verify against supplier spec before EPR submission.'),
  ('Aluminium can 150 ml','Aluminium','primary',53,53,110,10,0.000032364,'Typical UK industry value for a 150 ml slimline beverage can. Verify against supplier spec before EPR submission.'),
  ('Aluminium can 330 ml','Aluminium','primary',66,66,115,13,0.000025951,'Typical UK industry value for a 330 ml beverage can. Verify against supplier spec before EPR submission.'),
  ('Aluminium can 500 ml','Aluminium','primary',66,66,168,17,0.00002323,'Typical UK industry value for a 500 ml beverage can. Verify against supplier spec before EPR submission.'),
  ('Steel food tin, small','Steel','primary',73,73,58,35,0.000113239,'Typical UK industry value for a 200 ml steel food can. Verify against supplier spec before EPR submission.'),
  ('Steel food tin, medium','Steel','primary',73,73,110,60,0.000102356,'Typical UK industry value for a 400 ml steel food can. Verify against supplier spec before EPR submission.'),
  ('Steel paint tin 2.5 L','Steel','primary',155,155,175,300,0.000071354,'Typical UK industry value for a 2.5 litre steel paint tin. Verify against supplier spec before EPR submission.'),
  ('Wooden crate, small','Wood','tertiary',400,300,200,2000,0.000083333,'Typical UK industry value for a small softwood crate. Verify against supplier spec before EPR submission.'),
  ('Euro pallet','Wood','tertiary',1200,800,144,25000,0.000180845,'Typical UK industry value for a standard EUR/EPAL timber pallet. Verify against supplier spec before EPR submission.'),
  ('Wooden crate, large','Wood','tertiary',1200,1000,800,35000,0.000036458,'Typical UK industry value for a large softwood transit crate. Verify against supplier spec before EPR submission.'),
  ('Mixed material pack, small','Other','primary',150,100,50,30,0.00004,'Typical UK industry value for a small mixed material pack. Verify against supplier spec before EPR submission.'),
  ('Mixed material pack, medium','Other','secondary',350,250,150,120,0.000009143,'Typical UK industry value for a medium mixed material pack. Verify against supplier spec before EPR submission.'),
  ('Mixed material pack, large','Other','tertiary',800,600,400,600,0.000003125,'Typical UK industry value for a large mixed material pack. Verify against supplier spec before EPR submission.')
), g as (select gen_random_uuid() as id, v.* from v)
insert into public.reference_library(id, user_id, payload)
select g.id, null, jsonb_build_object(
  'id', g.id, 'referenceName', g.name, 'materialType', g.material,
  'packagingType', g.ptype, 'length', g.len, 'width', g.wid, 'height', g.hei,
  'unit', 'mm', 'averageWeight', g.wt, 'densityValue', g.dens, 'notes', g.notes)
from g;

-- Drop hide-flags pointing at library rows that no longer exist.
delete from public.hidden_default_items h
where not exists (select 1 from public.reference_library r where r.id = h.item_id);

commit;
