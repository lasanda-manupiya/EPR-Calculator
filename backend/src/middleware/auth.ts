import { Request, Response, NextFunction } from 'express';

export interface AuthedRequest extends Request { user?: { id: number; email: string } }

export const authGuard = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  req.user = { id: 1, email: 'guest@sustainzone.local' };
  next();
};
