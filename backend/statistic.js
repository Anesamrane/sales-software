// Suggested Visual Stats for your POS System

// === Stats Overview ===
// 1. Total Revenue
// 2. Total Products Sold
// 3. Top 5 Best Selling Products
// 4. Revenue Per Day (Bar Chart)
// 5. Revenue Per Cashier (Pie or Bar Chart)
// 6. Inventory Value (Current value of products in stock)
// 7. Profit Analysis (Revenue - Total Buy Cost)

const express = require('express');
const db = require('./db'); // your better-sqlite3 setup
const router = express.Router();

// 1. Total Revenue
router.get('/api/stats/total-revenue', (req, res) => {
  const row = db.prepare(`SELECT SUM(sellPrice * quantity) AS totalRevenue FROM sales`).get();
  res.json(row);
});

// 2. Total Products Sold
router.get('/api/stats/total-products-sold', (req, res) => {
  const row = db.prepare(`SELECT SUM(quantity) AS totalSold FROM sales`).get();
  res.json(row);
});

// 3. Top 5 Best Selling Products
router.get('/api/stats/top-products', (req, res) => {
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
router.get('/api/stats/revenue-daily', (req, res) => {
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
router.get('/api/stats/revenue-by-user', (req, res) => {
  const rows = db.prepare(`
    SELECT u.displayName, SUM(s.sellPrice * s.quantity) AS totalRevenue
    FROM sales s
    JOIN users u ON s.userId = u.id
    GROUP BY s.userId
  `).all();
  res.json(rows);
});

// 6. Inventory Value
router.get('/api/stats/inventory-value', (req, res) => {
  const row = db.prepare(`SELECT SUM(quantity * buyPrice) AS inventoryValue FROM products`).get();
  res.json(row);
});

// 7. Profit = Revenue - Buy Cost
router.get('/api/stats/profit', (req, res) => {
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

module.exports = router;
