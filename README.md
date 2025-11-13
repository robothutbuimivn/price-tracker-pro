# Price Tracker Pro - Hướng dẫn cài đặt & Deploy

Dự án này bao gồm hai phần:
1. **Backend**: Một máy chủ Node.js/Express để xử lý scraping và quản lý cơ sở dữ liệu SQLite
2. **Frontend**: Một ứng dụng React (Vite) để hiển thị giao diện người dùng

Bạn cần chạy cả hai phần này cùng lúc để ứng dụng hoạt động đầy đủ.

## Yêu cầu
- [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
- npm (thường được cài đặt cùng với Node.js)
- (Tùy chọn cho production) Reverse proxy như Nginx hoặc Apache

---

## Part 1: Cài đặt & Chạy trên Local Development

### Backend Setup (Development)

1. **Mở terminal và di chuyển vào thư mục `backend`:**
   ```bash
   cd price-tracker-pro/backend
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Khởi động máy chủ backend:**
   ```bash
   npm start
   ```
   
   Máy chủ sẽ chạy trên `http://localhost:8080`

### Frontend Setup (Development)

1. **Mở terminal thứ 2 và di chuyển vào thư mục `frontend`:**
   ```bash
   cd price-tracker-pro/frontend
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Khởi động dev server:**
   ```bash
   npm run dev
   ```
   
   Frontend sẽ chạy trên `http://localhost:5173`

4. **Truy cập ứng dụng:**
   Mở trình duyệt và vào `http://localhost:5173`

---

## Part 2: Build & Deploy lên Server Production

### Architecture Production:

```
Browser (HTTPS)
    ↓
Nginx (Reverse Proxy + SSL)
    ├→ /        → Frontend (dist/)
    └→ /api/    → Backend (localhost:8080)
         ↓
    Node.js Backend
         ↓
    SQLite Database
```

### Step 1: Chuẩn bị Server

**Yêu cầu:**
- Server OS: Ubuntu 22.04 LTS
- Node.js 18+ 
- Nginx hoặc Apache
- Thư mục `/data` để lưu database

### Step 2: Setup Backend

```bash
# Clone repo
git clone https://github.com/robothutbuimivn/price-tracker-pro.git
cd price-tracker-pro/backend

# Cài dependencies
npm install

# Tạo .env từ example
cp .env.example .env

# Edit .env
nano .env
```

**Cấu hình .env:**
```env
NODE_ENV=production
PORT=8080
DATABASE_PATH=/data/database.db
FRONTEND_URL=https://your-domain.com
```

**Khởi động với PM2:**
```bash
npm install -g pm2
pm2 start server.js --name "price-tracker-backend"
pm2 startup
pm2 save
```

### Step 3: Build Frontend

```bash
cd frontend
npm install
npm run build
```

Output: `frontend/dist/` folder

### Step 4: Cấu hình Nginx

Tạo `/etc/nginx/sites-available/price-tracker`:

```nginx
upstream backend {
    server localhost:8080;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend
    location / {
        root /home/user/price-tracker-pro/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/price-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### Step 6: Update Frontend Config

Edit `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://your-domain.com/api
```

Rebuild và deploy:
```bash
npm run build
sudo cp -r dist/* /home/user/price-tracker-pro/frontend/dist/
```

### Step 7: Setup Database

```bash
sudo mkdir -p /data
sudo chown www-data:www-data /data
```

---

## Environment Variables

### Backend (.env)
- `NODE_ENV` - "development" hoặc "production"
- `PORT` - Port backend (default: 8080)
- `DATABASE_PATH` - Path để lưu database (default: database.db)
- `FRONTEND_URL` - CORS whitelist (frontend domain)

### Frontend (.env.production)
- `VITE_API_BASE_URL` - Backend API URL (e.g., https://your-domain.com/api)

---

## Troubleshooting

### Backend không kết nối
```bash
# Check backend
curl http://localhost:8080/health

# Check logs
pm2 logs price-tracker-backend
```

### Database error
```bash
# Fix permissions
sudo chmod 755 /data
sudo chmod 644 /data/database.db
```

### Nginx 502 Bad Gateway
```bash
# Check backend
systemctl status price-tracker-backend

# Check nginx logs
tail -f /var/log/nginx/error.log
```

---

## Monitoring

```bash
# View logs
pm2 logs price-tracker-backend

# Restart backend
pm2 restart price-tracker-backend

# Backup database
tar -czf backup-$(date +%Y%m%d).tar.gz /data/database.db
```

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Author**: Thế Anh 💖
