-- Replace the shared, global packaging reference library.
--
-- Run this in the Supabase SQL editor. It removes the existing global defaults
-- (user_id is null) and inserts the current set. Personal library items added by
-- users are NOT touched.
--
-- Fibre weights are derived from FEFCO 0201 blank area x board grammage
-- (E 383, B 443, BC 718 g/m2) and paper from area x kraft grammage,
-- so each row can be recalculated from its own dimensions. Other materials are
-- typical UK industry values and must be checked against supplier specs before
-- an EPR submission. Weights are stored in grams.

begin;

delete from public.reference_library where user_id is null;

do $$
declare v_id uuid;
begin
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard carton, small','materialType','Cardboard','packagingType','primary','length',100,'width',100,'height',100,'unit','mm','averageWeight',33.73,'densityValue',0.000033735,'notes','Derived: FEFCO 0201 blank x 383 g/m2 E flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard carton, medium','materialType','Cardboard','packagingType','primary','length',200,'width',150,'height',100,'unit','mm','averageWeight',70.92,'densityValue',0.00002364,'notes','Derived: FEFCO 0201 blank x 383 g/m2 E flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard carton, large','materialType','Cardboard','packagingType','primary','length',300,'width',200,'height',150,'unit','mm','averageWeight',139.54,'densityValue',0.000015504,'notes','Derived: FEFCO 0201 blank x 383 g/m2 E flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard shipping case, small','materialType','Cardboard','packagingType','secondary','length',250,'width',180,'height',120,'unit','mm','averageWeight',119.56,'densityValue',0.00002214,'notes','Derived: FEFCO 0201 blank x 443 g/m2 B flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard shipping case, medium','materialType','Cardboard','packagingType','secondary','length',400,'width',300,'height',200,'unit','mm','averageWeight',318.82,'densityValue',0.000013284,'notes','Derived: FEFCO 0201 blank x 443 g/m2 B flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard shipping case, large','materialType','Cardboard','packagingType','secondary','length',550,'width',400,'height',300,'unit','mm','averageWeight',601.32,'densityValue',0.000009111,'notes','Derived: FEFCO 0201 blank x 443 g/m2 B flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard transit case, small','materialType','Cardboard','packagingType','tertiary','length',600,'width',400,'height',400,'unit','mm','averageWeight',1171.69,'densityValue',0.000012205,'notes','Derived: FEFCO 0201 blank x 718 g/m2 BC flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard transit case, medium','materialType','Cardboard','packagingType','tertiary','length',800,'width',600,'height',500,'unit','mm','averageWeight',2242.88,'densityValue',0.000009345,'notes','Derived: FEFCO 0201 blank x 718 g/m2 BC flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard pallet box, large','materialType','Cardboard','packagingType','tertiary','length',1200,'width',1000,'height',800,'unit','mm','averageWeight',5737.86,'densityValue',0.000005977,'notes','Derived: FEFCO 0201 blank x 718 g/m2 BC flute board. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper bag, small','materialType','Paper','packagingType','primary','length',180,'width',80,'height',220,'unit','mm','averageWeight',11.59,'densityValue',0.000003659,'notes','Derived: surface area x 90 g/m2 kraft paper. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper bag, medium','materialType','Paper','packagingType','primary','length',260,'width',120,'height',320,'unit','mm','averageWeight',24.7,'densityValue',0.000002474,'notes','Derived: surface area x 90 g/m2 kraft paper. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper bag, large','materialType','Paper','packagingType','primary','length',320,'width',160,'height',420,'unit','mm','averageWeight',40.9,'densityValue',0.000001902,'notes','Derived: surface area x 90 g/m2 kraft paper. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper wrap sheet, small','materialType','Paper','packagingType','secondary','length',500,'width',500,'height',1,'unit','mm','averageWeight',17.5,'densityValue',0.00007,'notes','Derived: surface area x 70 g/m2 kraft paper. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper wrap sheet, medium','materialType','Paper','packagingType','secondary','length',750,'width',750,'height',1,'unit','mm','averageWeight',39.38,'densityValue',0.00007,'notes','Derived: surface area x 70 g/m2 kraft paper. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper wrap sheet, large','materialType','Paper','packagingType','secondary','length',1000,'width',1000,'height',1,'unit','mm','averageWeight',70,'densityValue',0.00007,'notes','Derived: surface area x 70 g/m2 kraft paper. Verify against supplier spec.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','PET bottle 500 ml','materialType','Plastic','packagingType','primary','length',65,'width',65,'height',220,'unit','mm','averageWeight',14,'densityValue',0.000015062,'notes','Typical UK industry value for a 500 ml PET drinks bottle. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','PET bottle 1 L','materialType','Plastic','packagingType','primary','length',80,'width',80,'height',280,'unit','mm','averageWeight',22,'densityValue',0.000012277,'notes','Typical UK industry value for a 1 litre PET bottle. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','PET bottle 2 L','materialType','Plastic','packagingType','primary','length',100,'width',100,'height',320,'unit','mm','averageWeight',35,'densityValue',0.000010937,'notes','Typical UK industry value for a 2 litre PET bottle. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Polythene mailer, small','materialType','Plastic','packagingType','secondary','length',250,'width',180,'height',5,'unit','mm','averageWeight',8,'densityValue',0.000035556,'notes','Typical UK industry value for a small co-extruded courier mailer. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Polythene mailer, medium','materialType','Plastic','packagingType','secondary','length',350,'width',250,'height',5,'unit','mm','averageWeight',15,'densityValue',0.000034286,'notes','Typical UK industry value for a medium co-extruded courier mailer. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Polythene mailer, large','materialType','Plastic','packagingType','secondary','length',450,'width',350,'height',5,'unit','mm','averageWeight',25,'densityValue',0.000031746,'notes','Typical UK industry value for a large co-extruded courier mailer. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Pallet stretch wrap, half pallet','materialType','Plastic','packagingType','tertiary','length',800,'width',600,'height',800,'unit','mm','averageWeight',120,'densityValue',3.13e-7,'notes','Typical UK industry value for stretch wrap on a half pallet load. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Pallet stretch wrap, full pallet','materialType','Plastic','packagingType','tertiary','length',1200,'width',1000,'height',1200,'unit','mm','averageWeight',220,'densityValue',1.53e-7,'notes','Typical UK industry value for stretch wrap on a standard pallet load. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Pallet stretch wrap, tall pallet','materialType','Plastic','packagingType','tertiary','length',1200,'width',1000,'height',1800,'unit','mm','averageWeight',320,'densityValue',1.48e-7,'notes','Typical UK industry value for stretch wrap on a tall pallet load. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Glass jar 100 ml','materialType','Glass','packagingType','primary','length',55,'width',55,'height',80,'unit','mm','averageWeight',110,'densityValue',0.000454545,'notes','Typical UK industry value for a 100 ml container glass jar. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Glass bottle 500 ml','materialType','Glass','packagingType','primary','length',65,'width',65,'height',230,'unit','mm','averageWeight',300,'densityValue',0.000308721,'notes','Typical UK industry value for a 500 ml container glass bottle. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Glass bottle 750 ml','materialType','Glass','packagingType','primary','length',75,'width',75,'height',300,'unit','mm','averageWeight',450,'densityValue',0.000266667,'notes','Typical UK industry value for a 750 ml wine bottle. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Aluminium can 150 ml','materialType','Aluminium','packagingType','primary','length',53,'width',53,'height',110,'unit','mm','averageWeight',10,'densityValue',0.000032364,'notes','Typical UK industry value for a 150 ml slimline beverage can. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Aluminium can 330 ml','materialType','Aluminium','packagingType','primary','length',66,'width',66,'height',115,'unit','mm','averageWeight',13,'densityValue',0.000025951,'notes','Typical UK industry value for a 330 ml beverage can. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Aluminium can 500 ml','materialType','Aluminium','packagingType','primary','length',66,'width',66,'height',168,'unit','mm','averageWeight',17,'densityValue',0.00002323,'notes','Typical UK industry value for a 500 ml beverage can. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Steel food tin, small','materialType','Steel','packagingType','primary','length',73,'width',73,'height',58,'unit','mm','averageWeight',35,'densityValue',0.000113239,'notes','Typical UK industry value for a 200 ml steel food can. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Steel food tin, medium','materialType','Steel','packagingType','primary','length',73,'width',73,'height',110,'unit','mm','averageWeight',60,'densityValue',0.000102356,'notes','Typical UK industry value for a 400 ml steel food can. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Steel paint tin 2.5 L','materialType','Steel','packagingType','primary','length',155,'width',155,'height',175,'unit','mm','averageWeight',300,'densityValue',0.000071354,'notes','Typical UK industry value for a 2.5 litre steel paint tin. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Wooden crate, small','materialType','Wood','packagingType','tertiary','length',400,'width',300,'height',200,'unit','mm','averageWeight',2000,'densityValue',0.000083333,'notes','Typical UK industry value for a small softwood crate. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Euro pallet','materialType','Wood','packagingType','tertiary','length',1200,'width',800,'height',144,'unit','mm','averageWeight',25000,'densityValue',0.000180845,'notes','Typical UK industry value for a standard EUR/EPAL timber pallet. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Wooden crate, large','materialType','Wood','packagingType','tertiary','length',1200,'width',1000,'height',800,'unit','mm','averageWeight',35000,'densityValue',0.000036458,'notes','Typical UK industry value for a large softwood transit crate. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Mixed material pack, small','materialType','Other','packagingType','primary','length',150,'width',100,'height',50,'unit','mm','averageWeight',30,'densityValue',0.00004,'notes','Typical UK industry value for a small mixed material pack. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Mixed material pack, medium','materialType','Other','packagingType','secondary','length',350,'width',250,'height',150,'unit','mm','averageWeight',120,'densityValue',0.000009143,'notes','Typical UK industry value for a medium mixed material pack. Verify against supplier spec before EPR submission.'));
  v_id := gen_random_uuid();
  insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Mixed material pack, large','materialType','Other','packagingType','tertiary','length',800,'width',600,'height',400,'unit','mm','averageWeight',600,'densityValue',0.000003125,'notes','Typical UK industry value for a large mixed material pack. Verify against supplier spec before EPR submission.'));
end $$;

-- Drop hide-flags that point at library rows which no longer exist.
delete from public.hidden_default_items h
where not exists (select 1 from public.reference_library r where r.id = h.item_id);

commit;
