# Price Tracker Pro - Hướng dẫn cài đặt

Dự án này bao gồm hai phần:
1.  **`backend`**: Một máy chủ Node.js/Express để xử lý scraping và quản lý cơ sở dữ liệu SQLite.
2.  **`frontend`**: Một ứng dụng React (Vite) để hiển thị giao diện người dùng.

Bạn cần chạy cả hai phần này cùng lúc để ứng dụng hoạt động đầy đủ.

## Yêu cầu
*   [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
*   npm (thường được cài đặt cùng với Node.js)

## Cài đặt và Chạy Backend

1.  **Mở một cửa sổ terminal mới.**
2.  **Di chuyển vào thư mục `backend`:**
    ```bash
    cd backend
    ```
3.  **Cài đặt các gói phụ thuộc:**
    ```bash
    npm install
    ```
4.  **Khởi động máy chủ backend:**
    ```bash
    npm start
    ```
    Máy chủ sẽ bắt đầu chạy trên `http://localhost:8080`. File cơ sở dữ liệu `database.db` sẽ được tự động tạo trong thư mục `backend` nếu chưa tồn tại.

## Cài đặt và Chạy Frontend

1.  **Mở một cửa sổ terminal thứ hai** (giữ nguyên cửa sổ terminal của backend đang chạy).
2.  **Di chuyển vào thư mục `frontend`:**
    ```bash
    cd frontend
    ```
3.  **Cài đặt các gói phụ thuộc:**
    ```bash
    npm install
    ```
4.  **Khởi động máy chủ phát triển frontend:**
    ```bash
    npm run dev
    ```
    Terminal sẽ hiển thị một địa chỉ URL, thường là `http://localhost:5173`.

## Sử dụng ứng dụng

1.  Sau khi cả hai máy chủ đã chạy, hãy mở trình duyệt và truy cập vào địa chỉ URL của frontend (ví dụ: `http://localhost:5173`).
2.  Frontend sẽ tự động kết nối đến backend ở `http://localhost:8080` để lấy dữ liệu sản phẩm và thực hiện scraping.
3.  Bây giờ bạn có thể thêm, xóa và kiểm tra giá sản phẩm. Dữ liệu sẽ được lưu trong file `database.db`.

Chúc bạn thành công!
