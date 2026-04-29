import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request { user?: { id: number; email: string } }

export const authGuard = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorised' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
