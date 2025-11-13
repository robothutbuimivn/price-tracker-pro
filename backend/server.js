const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 8080;
const dbPath = process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/data/database.db' : 'database.db');
const nodeEnv = process.env.NODE_ENV || 'development';
const db = new Database(dbPath, { verbose: nodeEnv === 'development' ? console.log : false });

console.log(`[${new Date().toISOString()}] Starting server in ${nodeEnv} mode on port ${port}`);
console.log(`[${new Date().toISOString()}] Database path: ${dbPath}`);

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Khởi tạo bảng trong DB nếu chưa tồn tại
const createTableStmt = db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    instanceId TEXT PRIMARY KEY,
    productId TEXT,
    name TEXT,
    url TEXT,
    website TEXT,
    scraperType TEXT,
    category TEXT,
    brand TEXT
  )
`);
createTableStmt.run();

// Tạo bảng price_history để lưu lịch sử giá
const createPriceHistoryTableStmt = db.prepare(`
  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instanceId TEXT NOT NULL,
    productId TEXT NOT NULL,
    website TEXT NOT NULL,
    price REAL NOT NULL,
    checkedDate DATE NOT NULL,
    checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instanceId) REFERENCES products(instanceId) ON DELETE CASCADE
  )
`);
createPriceHistoryTableStmt.run();

// Tạo index cho query nhanh hơn
const createIndexStmt = db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(productId, checkedDate)
`);
createIndexStmt.run();

// Kiểm tra và thêm các cột mới nếu chưa tồn tại
const checkAndAddColumns = () => {
  try {
    // Lấy thông tin về cột trong bảng products
    const columns = db.prepare("PRAGMA table_info(products)").all();
    const columnNames = columns.map(col => col.name);
    
    // Nếu chưa có cột category, thêm nó
    if (!columnNames.includes('category')) {
      console.log('Adding category column to products table...');
      db.exec('ALTER TABLE products ADD COLUMN category TEXT');
    }
    
    // Nếu chưa có cột brand, thêm nó
    if (!columnNames.includes('brand')) {
      console.log('Adding brand column to products table...');
      db.exec('ALTER TABLE products ADD COLUMN brand TEXT');
    }
    
    console.log('Database schema is up to date');
  } catch (err) {
    console.error('Error checking/adding columns:', err.message);
  }
};

checkAndAddColumns();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// --- API Endpoints for Products ---

// Lấy tất cả sản phẩm
app.get('/products', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM products ORDER BY website, name');
    const products = stmt.all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm sản phẩm mới
app.post('/products', (req, res) => {
  try {
    const { instanceId, productId, name, url, website, scraperType, category, brand } = req.body;
    console.log('POST /products received:', { instanceId, productId, name, url, website, scraperType, category, brand });
    if (!instanceId || !productId || !name || !url || !website || !scraperType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const stmt = db.prepare('INSERT INTO products (instanceId, productId, name, url, website, scraperType, category, brand) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(instanceId, productId, name, url, website, scraperType, category || null, brand || null);
    console.log('Product inserted successfully:', info);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
    console.error('Error inserting product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Xóa sản phẩm
app.delete('/products/:instanceId', (req, res) => {
  try {
    const { instanceId } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE instanceId = ?');
    const info = stmt.run(instanceId);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật sản phẩm
app.put('/products/:instanceId', (req, res) => {
  try {
    const { instanceId } = req.params;
    const { productId, name, url, website, scraperType, category, brand } = req.body;
    console.log('PUT /products/:instanceId received:', { instanceId, productId, name, url, website, scraperType, category, brand });
    
    if (!productId || !name || !url || !website || !scraperType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const stmt = db.prepare('UPDATE products SET productId = ?, name = ?, url = ?, website = ?, scraperType = ?, category = ?, brand = ? WHERE instanceId = ?');
    const info = stmt.run(productId, name, url, website, scraperType, category || null, brand || null, instanceId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Product updated successfully:', info);
    res.status(200).json({ message: 'Product updated successfully', product: { instanceId, productId, name, url, website, scraperType, category, brand } });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- API Endpoints for Price History ---

// Lấy lịch sử giá (có filter theo date range, productId)
app.get('/price-history', (req, res) => {
  try {
    const { productId, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        ph.id, ph.instanceId, ph.productId, ph.website, ph.price, 
        DATE(ph.checkedAt) as date,
        ph.checkedAt,
        p.name
      FROM price_history ph
      LEFT JOIN products p ON ph.instanceId = p.instanceId
      WHERE 1=1
    `;
    const params = [];
    
    if (productId) {
      query += ` AND ph.productId = ?`;
      params.push(productId);
    }
    
    if (startDate) {
      query += ` AND DATE(ph.checkedAt) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND DATE(ph.checkedAt) <= ?`;
      params.push(endDate);
    }
    
    query += ` ORDER BY ph.checkedAt DESC`;
    
    const stmt = db.prepare(query);
    const history = stmt.all(...params);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử giá theo ngày (lấy lần check cuối cùng mỗi ngày)
app.get('/price-history/daily', (req, res) => {
  try {
    const { productId, startDate, endDate } = req.query;
    console.log('GET /price-history/daily requested with:', { productId, startDate, endDate });
    
    // Use subquery để lấy record cuối cùng mỗi ngày/product/website
    let query = `
      SELECT 
        ph.id, ph.instanceId, ph.productId, ph.website, ph.price, 
        DATE(ph.checkedAt) as date,
        ph.checkedAt,
        p.name
      FROM price_history ph
      LEFT JOIN products p ON ph.instanceId = p.instanceId
      WHERE ph.id IN (
        SELECT MAX(id)
        FROM price_history
        WHERE 1=1
    `;
    const params = [];
    
    if (productId) {
      query += ` AND productId = ?`;
      params.push(productId);
    }
    
    if (startDate) {
      query += ` AND DATE(checkedAt) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND DATE(checkedAt) <= ?`;
      params.push(endDate);
    }
    
    query += ` GROUP BY DATE(checkedAt), productId, website
      )
      ORDER BY ph.checkedAt DESC`;
    
    console.log('Query:', query);
    console.log('Params:', params);
    
    const stmt = db.prepare(query);
    const history = stmt.all(...params);
    
    console.log('Result count:', history.length);
    console.log('Results:', history.slice(0, 3)); // Log first 3 records
    
    res.json(history);
  } catch (err) {
    console.error('Error fetching daily price history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lưu giá vào lịch sử
app.post('/price-history', (req, res) => {
  try {
    const { instanceId, productId, website, price } = req.body;
    
    if (!instanceId || !productId || !website || price === undefined || price === null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stmt = db.prepare(`
      INSERT INTO price_history (instanceId, productId, website, price, checkedDate, checkedAt) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const info = stmt.run(instanceId, productId, website, price, today);
    console.log('Price history recorded:', { instanceId, productId, website, price, date: today });
    res.status(201).json({ id: info.lastInsertRowid, instanceId, productId, website, price, date: today });
  } catch (err) {
    console.error('Error saving price history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Xóa lịch sử giá cũ (tuỳ chọn - xóa data cũ hơn N ngày)
app.delete('/price-history/old/:days', (req, res) => {
  try {
    const { days } = req.params;
    const daysNum = parseInt(days, 10);
    
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({ error: 'Days must be a positive number' });
    }
    
    const stmt = db.prepare(`
      DELETE FROM price_history 
      WHERE checkedAt < datetime('now', '-' || ? || ' days')
    `);
    
    const info = stmt.run(daysNum);
    res.json({ message: `Deleted ${info.changes} old price history records` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- API Endpoint for Scraping ---

const parsePrice = (priceText) => {
    if (!priceText || typeof priceText !== 'string') return null;
    // Loại bỏ tất cả các ký tự không phải là số (giữ lại số)
    const digitsOnly = priceText.replace(/[^\d]/g, '');
    return parseInt(digitsOnly, 10);
};

app.post('/scrape', async (req, res) => {
    const { url, scraperType } = req.body;

    if (!url || !scraperType) {
        return res.status(400).json({ error: 'URL and scraperType are required' });
    }

    try {
        const { data } = await axios.get(url, {
            headers: {
                // Giả lập một trình duyệt thông thường để tránh bị chặn
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        let priceText;

        console.log(`Scraping ${url} with type: ${scraperType}`);

        switch (scraperType) {
            case 'woocommerce':
                priceText = $('.woocommerce-Price-amount.amount').first().text();
                break;
            case 'cellphones':
                priceText = $('.sale-price').first().text();
                break;
            case 'dienmayxanh':
                priceText = $('.bs_price strong').first().text();
                break;
            case 'fptshop':
                // FPT Shop có thể dùng nhiều class khác nhau, thử cả hai
                priceText = $('.price-product').first().text() || $('.text-black-opacity-100.h4-bold').first().text();
                break;
            case 'quang_hanh':
                priceText = $('.prPrice.change-pr').first().text();
                break;
            case 'techzhome':
                priceText = $('.price_info.price_config').first().text();
                break;
            case 'vietnamrobotics':
                priceText = $('.discount.bk-product-price').first().text();
                break;
            case 'meta':
                priceText = $('.p-price').first().text();
                break;
            case 'miworld':
                priceText = $('.price_current.bk-product-price').first().text();
                break;
            case 'gia_khang':
                // Thử cả hai cách vì class name có thể chứa dấu chấm
                priceText = $('[class*="price-de-xuat"]').first().text() || $('div[class=".price-de-xuat"]').first().text();
                break;
            case 'generic':
            default:
                // Thử tìm các thẻ meta tag phổ biến
                priceText = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
                break;
        }

        if (!priceText) {
            console.error('Price element not found for', url);
            return res.status(404).json({ error: 'Price element not found on page.' });
        }
        
        const price = parsePrice(priceText);

        if (price === null || isNaN(price)) {
            console.error('Could not parse price from text:', priceText);
            return res.status(500).json({ error: 'Could not parse price from page.' });
        }

        console.log(`Found price: ${price}`);
        res.json({ price });

    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        res.status(500).json({ error: `Failed to scrape URL. ${error.message}` });
    }
});


app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Backend server listening at http://localhost:${port}`);
    console.log(`[${new Date().toISOString()}] Environment: ${nodeEnv}`);
    if (process.env.FRONTEND_URL) {
        console.log(`[${new Date().toISOString()}] CORS enabled for: ${process.env.FRONTEND_URL}`);
    }
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing database connection...');
    db.close();
    process.exit(0);
});
