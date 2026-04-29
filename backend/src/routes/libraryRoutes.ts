import { Router } from 'express';
import { db } from '../config/db.js';
import { authGuard } from '../middleware/auth.js';
export const libraryRouter = Router();
libraryRouter.use(authGuard);
libraryRouter.get('/', (_req, res) => res.json(db.prepare('SELECT * FROM packaging_reference_library').all()));
