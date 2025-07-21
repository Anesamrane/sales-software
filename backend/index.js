
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const db = require('./database');


const app = express();
const PORT = 3001;

// CORS: allow credentials and set origin
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

// Logout endpoint: destroy session
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});
// --- USERS CRUD ---
// (Moved below after app/db initialization)

app.get('/', (req, res) => {
  res.send('✅ Express backend is running!');
});

// --- USERS CRUD ---
// Get all users (no password)
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, displayName, role, createdAt FROM users').all();
  res.json(users);
});

// Get user by id (no password)
app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, displayName, role, createdAt FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Create user
app.post('/api/users', (req, res) => {
  const { username, password, displayName, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const stmt = db.prepare('INSERT INTO users (username, password, displayName, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(username, password, displayName || null, role || 'cashier');
    const user = db.prepare('SELECT id, username, displayName, role, createdAt FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user (change password, displayName, or role)
app.put('/api/users/:id', (req, res) => {
  const { password, displayName, role } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  try {
    const stmt = db.prepare('UPDATE users SET password = ?, displayName = ?, role = ? WHERE id = ?');
    stmt.run(password, displayName || null, role || 'cashier', req.params.id);
    const user = db.prepare('SELECT id, username, displayName, role, createdAt FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const info = stmt.run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.sendStatus(204);
});



// Get all products
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

app.get('/api/sales/bulk', (req, res) => {
  const sales = db.prepare('SELECT * FROM sales').all();
  res.json(sales);
});
// Add a product
app.post('/api/products', (req, res) => {
  const { codebar, name, price, quantity, buyPrice } = req.body;
  if (!codebar || !name || price == null || quantity == null || buyPrice == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const stmt = db.prepare('INSERT INTO products (codebar, name, price, quantity, buyPrice) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(codebar, name, price, quantity, buyPrice);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  stmt.run(req.params.id);
  res.sendStatus(204);
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { codebar, name, price, quantity, buyPrice } = req.body;
  if (!codebar || !name || price == null || quantity == null || buyPrice == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const stmt = db.prepare(
      'UPDATE products SET codebar = ?, name = ?, price = ?, quantity = ?, buyPrice = ? WHERE id = ?'
    );
    stmt.run(codebar, name, price, quantity, buyPrice, req.params.id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
const { v4: uuidv4 } = require('uuid'); // 👈 install with: npm install uuid


app.post('/api/sales/bulk', (req, res) => {
  const items = req.body.items; // [{ productId, quantity, sellPrice }]
  const userId = req.body.userId;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Empty invoice' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const invoiceId = uuidv4(); // unique invoice ID

  const insertSale = db.prepare(`
    INSERT INTO sales (invoiceId, productId, quantity, sellPrice, userId)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateStock = db.prepare(`
    UPDATE products SET quantity = quantity - ? WHERE id = ?
  `);

  const productCheck = db.prepare(`SELECT * FROM products WHERE id = ?`);

  const tx = db.transaction(() => {
    for (const item of items) {
      const { productId, quantity, sellPrice } = item;

      const product = productCheck.get(productId);
      if (!product || product.quantity < quantity) {
        throw new Error(`Invalid stock for product ${productId}`);
      }

      insertSale.run(invoiceId, productId, quantity, sellPrice, userId);
      updateStock.run(quantity, productId);
    }
  });

  try {
    tx();
    res.json({ success: true, invoiceId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// how much ticket for cashier
app.get('/api/sales/today-tickets-by-user', (req, res) => {
  const rows = db.prepare(`
    SELECT u.displayName, COUNT(DISTINCT s.invoiceId) AS ticketCount
    FROM sales s
    JOIN users u ON s.userId = u.id
    WHERE DATE(s.soldAt) = DATE('now', 'localtime')
    GROUP BY s.userId
  `).all();

  res.json(rows);
});



// 1. Total Revenue
app.get('/api/stats/total-revenue', (req, res) => {
  const row = db.prepare(`SELECT SUM(sellPrice * quantity) AS totalRevenue FROM sales`).get();
  res.json(row);
});

// 2. Total Products Sold
app.get('/api/stats/total-products-sold', (req, res) => {
  const row = db.prepare(`SELECT SUM(quantity) AS totalSold FROM sales`).get();
  res.json(row);
});

// 3. Top 5 Best Selling Products
app.get('/api/stats/top-products', (req, res) => {
  const rows = db.prepare(`
    SELECT p.name, SUM(s.quantity) AS totalSold
    FROM sales s
    JOIN products p ON s.productId = p.id
    GROUP BY s.productId
    ORDER BY totalSold DESC
    LIMIT 5
  `).all();
  res.json(rows);
});

// 4. Revenue Per Day
app.get('/api/stats/revenue-daily', (req, res) => {
  const rows = db.prepare(`
    SELECT DATE(soldAt) AS day, SUM(sellPrice * quantity) AS dailyRevenue
    FROM sales
    GROUP BY day
    ORDER BY day DESC
    LIMIT 7
  `).all();
  res.json(rows);
});

// 5. Revenue Per Cashier
app.get('/api/stats/revenue-by-user', (req, res) => {
  const rows = db.prepare(`
    SELECT u.displayName, SUM(s.sellPrice * s.quantity) AS totalRevenue
    FROM sales s
    JOIN users u ON s.userId = u.id
    GROUP BY s.userId
  `).all();
  res.json(rows);
});

// 6. Inventory Value
app.get('/api/stats/inventory-value', (req, res) => {
  const row = db.prepare(`SELECT SUM(quantity * buyPrice) AS inventoryValue FROM products`).get();
  res.json(row);
});

// 7. Profit = Revenue - Buy Cost
app.get('/api/stats/profit', (req, res) => {
  const row = db.prepare(`
    SELECT 
      SUM(s.sellPrice * s.quantity) AS revenue,
      SUM(p.buyPrice * s.quantity) AS cost,
      SUM(s.sellPrice * s.quantity) - SUM(p.buyPrice * s.quantity) AS profit
    FROM sales s
    JOIN products p ON s.productId = p.id
  `).get();
  res.json(row);
});


app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
