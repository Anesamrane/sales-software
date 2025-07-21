const Database = require('better-sqlite3');
const path = require('path');

// Save the DB in local app folder
const dbPath = path.resolve(__dirname, 'sales.db');
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codebar TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    buyPrice REAL NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  )
`).run();

// Create users table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    displayName TEXT,
    role TEXT DEFAULT 'cashier',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Create sales table if not exists (now with userId)
db.prepare(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceId TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sellPrice REAL NOT NULL,
    userId INTEGER NOT NULL,
    soldAt TEXT DEFAULT (DATETIME('now', '+2 hours')),
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`).run();



module.exports = db;
