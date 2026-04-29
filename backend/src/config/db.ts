import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.resolve(process.cwd(), 'data.sqlite');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export const initDb = () => {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    company_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT,
    length REAL, width REAL, height REAL,
    unit TEXT DEFAULT 'mm',
    quantity INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS packaging_reference_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_name TEXT NOT NULL,
    material_type TEXT NOT NULL,
    packaging_type TEXT NOT NULL,
    length REAL, width REAL, height REAL,
    unit TEXT DEFAULT 'mm',
    average_weight REAL NOT NULL,
    density_value REAL,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS packaging_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    material_type TEXT NOT NULL,
    packaging_type TEXT NOT NULL,
    length REAL, width REAL, height REAL,
    unit TEXT DEFAULT 'mm',
    known_weight REAL,
    estimated_weight REAL,
    matched_reference_id INTEGER,
    confidence_level TEXT,
    estimation_method TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
  CREATE TABLE IF NOT EXISTS epr_calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    total_weight REAL,
    material_breakdown_json TEXT,
    calculation_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    report_name TEXT NOT NULL,
    reporting_period TEXT,
    total_packaging_weight REAL,
    report_data_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`);
};
