# 🚀 Quick Deploy Guide

## Nhanh chóng Deploy lên VPS - 5 Bước Đơn Giản

### ⏱️ Thời gian: ~5 phút

### **Bước 1: SSH vào VPS**
```bash
ssh ubuntu@vaycuoineo.vn
```

### **Bước 2: Vào thư mục dự án**
```bash
cd /home/ubuntu/apps/price-tracker-pro
```

### **Bước 3: Update code từ git**
```bash
git pull origin main
```

### **Bước 4: Chạy deploy script**
```bash
chmod +x deploy.sh
./deploy.sh
```

### **Bước 5: Kiểm tra kết quả**
```bash
# Kiểm tra backend
curl http://localhost:8080/health

# Truy cập ứng dụng
http://vaycuoineo.vn
```

---

## 📋 Lần Đầu Setup (Full)

Nếu đây là lần đầu setup hoặc Nginx chưa được cấu hình:

```bash
# SSH vào VPS
ssh ubuntu@vaycuoineo.vn

# Vào thư mục
cd /home/ubuntu/apps/price-tracker-pro

# Setup Nginx (chỉ cần 1 lần)
chmod +x setup-nginx.sh
sudo ./setup-nginx.sh

# Deploy dự án
chmod +x deploy.sh
./deploy.sh

# Xác nhận
curl http://vaycuoineo.vn
```

---

## 🔍 Kiểm Tra Status

```bash
# Backend logs
tail -f /home/ubuntu/apps/price-tracker-pro/backend/backend.log

# Nginx status
sudo systemctl status nginx

# Backend health
curl http://localhost:8080/health
```

---

## 📚 Hướng dẫn Chi Tiết

Xem file: `DEPLOYMENT.md`

---

## ⚡ Common Issues

| Issue | Solution |
|-------|----------|
| Backend không khởi động | `ps aux \| grep "node server.js"` rồi kill process cũ |
| Frontend không hiển thị | Kiểm tra build: `ls frontend/dist` |
| Port 8080 đang dùng | `sudo lsof -i :8080` rồi kill process |
| Nginx error | `sudo nginx -t` để test config |

---

**Bạn có thể chạy deploy.sh bất cứ lúc nào khi có code mới từ git!**
