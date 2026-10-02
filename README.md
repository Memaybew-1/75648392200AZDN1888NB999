# AI Chat Offline 🤖💬

Hệ thống chatbot thông minh chạy hoàn toàn trên trình duyệt (Client-side) mà không cần gọi API bên ngoài hay sử dụng các mô hình AI nặng gây sập trình duyệt. Ứng dụng sử dụng kho tri thức tĩnh (`embeddings.json`) kết hợp thuật toán tìm kiếm từ khóa tối ưu để phản hồi nhanh chóng.

Sử dụng cơ chế markov mix nhiều câu mẫu lại với nhau(Lấy 15 câu mix lại, sau đó lấy 5 câu tương đồng cao nhất để nối từ markov).

Sử dụng miniLM và Transformes.js để tính toán vector.
Cơ chế quét vùng(tránh sập web do có nhiều câu mẫu) quét mỗi vùng 10 câu cho tới hết file, để dòng "suy nghĩ" cho chatbot.

Lưu bộ nhớ(ngữ cảnh) để chatbot không lạc đề.

## 📂 Cấu trúc dự án

Dự án được phân chia thành các module rõ ràng và gọn nhẹ:
```text
📂 Repo-cua-ban/
 ┣ 📜 index.html        # Giao diện chính của ứng dụng
 ┣ 📜 ai.js             # Xử lý logic đọc file JSON, trích xuất từ khóa và tìm kiếm
 ┣ 📜 ui.js             # Quản lý giao diện, hiển thị khung chat và sự kiện người dùng
 ┣ 📜 data.json         # Kho dữ liệu gốc trước khi mã hoá vector
 ┣ 📜 embeddings.json   # Kho dữ liệu vector/văn bản tri thức tĩnh (Bắt buộc phải có)
 ┗ 📜 README.md         # Tài liệu giới thiệu dự án