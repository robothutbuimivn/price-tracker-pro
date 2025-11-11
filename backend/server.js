const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 8080;
const dbPath = process.env.NODE_ENV === 'production' ? '/data/database.db' : 'database.db';
const db = new Database(dbPath, { verbose: console.log });

// Middleware
app.use(cors());
app.use(express.json());

// Khởi tạo bảng trong DB nếu chưa tồn tại
const createTableStmt = db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    instanceId TEXT PRIMARY KEY,
    productId TEXT,
    name TEXT,
    url TEXT,
    website TEXT,
    scraperType TEXT
  )
`);
createTableStmt.run();

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
    const { instanceId, productId, name, url, website, scraperType } = req.body;
    if (!instanceId || !productId || !name || !url || !website || !scraperType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const stmt = db.prepare('INSERT INTO products (instanceId, productId, name, url, website, scraperType) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(instanceId, productId, name, url, website, scraperType);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
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
    console.log(`Backend server listening at http://localhost:${port}`);
});
