import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../config/db.js';

export const authRouter = Router();

authRouter.post('/register', [body('email').isEmail(), body('password').isLength({ min: 8 })], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password, company_name } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (name,email,password_hash,company_name) VALUES (?,?,?,?)');
  try {
    const result = stmt.run(name, email.toLowerCase(), hash, company_name);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1d' });
    res.json({ token });
  } catch {
    res.status(409).json({ message: 'Email already exists' });
  }
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase()) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1d' });
  res.json({ token });
});
