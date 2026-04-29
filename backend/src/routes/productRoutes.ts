import { Router } from 'express';
import { db } from '../config/db.js';
import { authGuard, AuthedRequest } from '../middleware/auth.js';
import { estimateComponent } from '../services/estimationService.js';

export const productRouter = Router();
productRouter.use(authGuard);

productRouter.get('/', (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
  res.json(rows);
});

productRouter.post('/', (req: AuthedRequest, res) => {
  const p = req.body;
  const info = db.prepare(`INSERT INTO products (user_id,product_name,category,sku,length,width,height,unit,quantity) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(req.user!.id, p.product_name, p.category, p.sku, p.length, p.width, p.height, p.unit, p.quantity);
  const productId = Number(info.lastInsertRowid);
  const inserted: any[] = [];
  for (const c of p.packaging_components || []) {
    const est = estimateComponent(c);
    db.prepare(`INSERT INTO packaging_components (product_id,material_type,packaging_type,length,width,height,unit,known_weight,estimated_weight,matched_reference_id,confidence_level,estimation_method)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(productId, c.material_type, c.packaging_type, c.length, c.width, c.height, c.unit, c.known_weight || null, est.weight, est.ref?.id || null, est.confidence, est.method);
    inserted.push({ ...c, estimated_weight: est.weight, confidence_level: est.confidence, estimation_method: est.method });
  }
  const qty = Number(p.quantity || 0);
  const total = inserted.reduce((a, c) => a + Number(c.estimated_weight || 0), 0) * qty;
  const material: Record<string, number> = {};
  const ptype: Record<string, number> = {};
  inserted.forEach((c) => {
    material[c.material_type] = (material[c.material_type] || 0) + Number(c.estimated_weight || 0) * qty;
    ptype[c.packaging_type] = (ptype[c.packaging_type] || 0) + Number(c.estimated_weight || 0) * qty;
  });
  db.prepare('INSERT INTO epr_calculations (product_id,total_weight,material_breakdown_json,calculation_notes) VALUES (?,?,?,?)')
    .run(productId, total, JSON.stringify({ material, packagingType: ptype }), 'Estimated using reference library matching by volume.');
  res.status(201).json({ id: productId });
});
