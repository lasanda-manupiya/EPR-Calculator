import { Router } from 'express';
import { db } from '../config/db.js';
import { authGuard, AuthedRequest } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
export const reportRouter = Router();
reportRouter.use(authGuard);
reportRouter.get('/summary', (req: AuthedRequest, res) => {
  const rows = db.prepare(`SELECT p.id, p.product_name, p.quantity, e.total_weight, e.material_breakdown_json
  FROM products p JOIN epr_calculations e ON e.product_id = p.id WHERE p.user_id = ?`).all(req.user!.id) as any[];
  const materialTotals: Record<string, number> = {}; let total=0;
  rows.forEach((r)=>{ total += r.total_weight || 0; const b=JSON.parse(r.material_breakdown_json||'{}').material||{}; Object.entries(b).forEach(([k,v])=>materialTotals[k]=(materialTotals[k]||0)+Number(v));});
  res.json({ numberOfProducts: rows.length, totalPackagingWeight: total, materialTotals, estimationMethod: 'Known weights and nearest reference volume matching' });
});
reportRouter.get('/export.csv', (req: AuthedRequest, res) => {
  const rows = db.prepare(`SELECT p.product_name,p.category,p.sku,p.quantity,e.total_weight FROM products p JOIN epr_calculations e ON e.product_id=p.id WHERE p.user_id=?`).all(req.user!.id) as any[];
  const csv = ['Product,Category,SKU,Quantity,Total Packaging Weight(g)', ...rows.map(r => `${r.product_name},${r.category},${r.sku||''},${r.quantity},${r.total_weight||0}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv'); res.send(csv);
});
reportRouter.get('/export.pdf', (req: AuthedRequest, res) => {
  const summary = db.prepare(`SELECT COUNT(*) as count, SUM(e.total_weight) as total FROM products p JOIN epr_calculations e ON e.product_id=p.id WHERE p.user_id=?`).get(req.user!.id) as any;
  const doc = new PDFDocument(); res.setHeader('Content-Type', 'application/pdf'); doc.pipe(res);
  doc.fontSize(22).fillColor('#0b3d91').text('SustainZone EPR Packaging Report'); doc.moveDown();
  doc.fontSize(12).fillColor('black').text(`Products assessed: ${summary.count || 0}`); doc.text(`Total packaging weight: ${summary.total || 0} g`);
  doc.text('Assumptions: nearest reference by volume and material where known weight is unavailable.');
  doc.end();
});
