import bcrypt from 'bcryptjs';
import { db, initDb } from '../config/db.js';
initDb();
const refs = [
['Small cardboard box','Cardboard','primary',150,120,80,'mm',90,0.5,'General small carton'],
['Medium cardboard box','Cardboard','secondary',300,220,160,'mm',220,0.6,'General medium carton'],
['Large cardboard box','Cardboard','tertiary',500,350,300,'mm',550,0.65,'Shipping carton'],
['Plastic mailer','Plastic','secondary',320,240,10,'mm',28,0.1,'LDPE mailer'],
['Bubble wrap sheet','Plastic','secondary',400,300,5,'mm',15,0.03,'Protection wrap'],
['Paper sleeve','Paper','primary',200,100,2,'mm',12,0.2,'Light paper sleeve'],
['Glass bottle 500ml','Glass','primary',70,70,220,'mm',280,2.5,'Standard bottle'],
['Aluminium can 330ml','Aluminium','primary',66,66,115,'mm',14,2.7,'Beverage can'],
['Steel tin','Steel','primary',90,90,120,'mm',70,7.8,'Tin container'],
['Wood pallet segment','Wood','tertiary',400,300,120,'mm',1200,0.7,'Pallet proportion']
];
for (const r of refs) db.prepare('INSERT INTO packaging_reference_library (reference_name,material_type,packaging_type,length,width,height,unit,average_weight,density_value,notes) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...r);
const email='demo@sustainzone.co.uk';
const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email) as any;
if (!exists) db.prepare('INSERT INTO users (name,email,password_hash,company_name) VALUES (?,?,?,?)').run('Demo User',email,bcrypt.hashSync('DemoPass123!',10),'SustainZone Demo');
console.log('Seed complete');
