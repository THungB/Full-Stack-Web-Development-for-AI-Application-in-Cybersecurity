# Phát triển Ứng dụng Web Đa Tầng cho Ứng dụng AI trong An ninh Mạng

[English](README.md) | [Tiếng Việt](README_vi.md)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Python](https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](#)
[![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)](#)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](#)

> Nền tảng phát hiện tin nhắn rác toàn diện tích hợp máy quét OCR, bot Telegram, tiện ích mở rộng trình duyệt và bảng điều khiển phân tích.

---

## Tuyên bố miễn trừ trách nhiệm

- **Mục đích Giáo dục:** Dự án này được phát triển hoàn toàn vì mục đích học thuật nhằm phục vụ môn học COS30049 tại Đại học Công nghệ Swinburne.
- **Độ chính xác của AI:** Việc phân loại tin nhắn rác phụ thuộc vào các mô hình học máy thử nghiệm và API AI (OpenRouter). Kết quả đôi khi có thể bị sai lệch (nhận diện nhầm). Vui lòng không hoàn toàn phụ thuộc vào ứng dụng này cho các quyết định an ninh mạng quan trọng.
- **Bảo mật Dữ liệu:** Do đây là môi trường thử nghiệm cấp trường học (có thể được cập nhật trong tương lai cho các mục đích khác), người dùng được khuyến cáo **không** nên quét hoặc tải lên các thông tin cá nhân, nhạy cảm tột độ hoặc mang tính tuyệt mật.
- **Không Bảo hành:** Phần mềm được cung cấp "nguyên trạng" và không đi kèm bất kỳ chế độ bảo hành hay cam kết pháp lý nào.

---

## Tính năng nổi bật

- **Đầu vào đa kênh:** Quét văn bản từ trang web, trích xuất OCR, bot Telegram hoặc tiện ích mở rộng trình duyệt.
- **Phát hiện bằng AI:** Phân loại tin nhắn thành Spam hoặc Ham cùng với điểm số độ tin cậy.
- **Bảng điều khiển phân tích:** Trực quan hóa lịch sử quét và lưu lượng hệ thống với các biểu đồ tương tác.
- **Đánh giá hàng loạt:** Kiểm tra và đánh giá các mô hình AI thông qua việc tải lên bộ dữ liệu CSV.

---

## Cấu trúc dự án

| Module               | Mô tả                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `frontend/`          | Bảng điều khiển React cho tổng quan, quét và lịch sử.                |
| `backend/`           | API FastAPI, dự đoán ML, xử lý OCR, và cơ sở dữ liệu SQLite.         |
| `backend/bot/`       | Bot Telegram giúp chuyển tiếp tin nhắn đến backend.                  |
| `browser-extension/` | Tiện ích mở rộng bôi đen văn bản để quét trực tiếp trên trình duyệt. |

---

## Bắt đầu nhanh

### 0. Sao chép Mã nguồn (Clone)

Mở Terminal, PowerShell hoặc Command Prompt và tải toàn bộ mã nguồn của dự án về máy tính của bạn:

```bash
git clone https://github.com/THungB/Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity.git
cd Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity
```

### 1. Chạy tự động - Windows

Khởi chạy cả frontend và backend chỉ với một câu lệnh:

**PowerShell:**

```powershell
powershell -ExecutionPolicy Bypass -File .\run-project.ps1
```

**Command Prompt:**

```bat
run-project.bat
```

---

### 2. Khởi chạy thủ công

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Telegram Bot

```bash
cd backend
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Mac/Linux
python bot/telegram_bot.py
```

---

## Cấu hình Môi trường

Tạo một tệp `.env` trong thư mục **backend** dựa trên tệp `.env_example`.

**`backend/.env`**

```env
# Yêu cầu bắt buộc cho API
FASTAPI_URL=http://localhost:8000/scan

# Yêu cầu bắt buộc cho bot Telegram
TELEGRAM_BOT_TOKEN="YOUR_TOKEN_BOT"

# Cấu hình AI Model OpenRouter
OPENROUTER_API_KEY="YOUR_API_KEY"
OPENROUTER_MODEL="YOUR_AI_MODEL"

# Cấu hình phụ trợ
SPAM_MODEL_PATH=
APP_SEED_DEMO=true
DATABASE_URL=sqlite:///spam_detection.db
AI_LABEL_ENABLED=true
AI_LABEL_MIN_CONFIDENCE=0.60
AI_LABEL_TIMEOUT=5.0
```

Nếu cần thiết, bạn có thể thiết lập cho frontend:
**`frontend/.env`**

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Lưu ý Quan trọng

> - Bạn **bắt buộc** phải điền `TELEGRAM_BOT_TOKEN` vào tệp `.env` của backend để bot có thể hoạt động. Bạn có thể lấy token hướng dẫn từ [@BotFather](https://t.me/botfather) trên Telegram.
> - Bạn **bắt buộc** phải cung cấp `OPENROUTER_API_KEY` để chức năng tạo tóm tắt nhãn AI hoạt động tự động.
> - Vui lòng đảm bảo rằng bạn đã cài đặt engine phần mềm `Tesseract OCR` trên hệ điều hành của máy tính để tính năng quét hình ảnh ảnh chụp hoạt động.
> - Theo thiết kế, **Telegram Bot** chỉ tự động theo dõi và quét tin nhắn trong các Nhóm chat (Group Chat) trên Telegram. Bạn phải thiết lập bot để tham gia vào một nhóm chat và cấp quyền admin cho bot để sử dụng bot. Để quét tin nhắn riêng tư 1-1, vui lòng sử dụng công cụ bôi đen văn bản của ** Browser Extension**.

---

## Tài liệu & Hướng dẫn

**Hướng dẫn Cài đặt Telegram Bot:**
Để chạy bot, bạn cần tạo một bot trên Telegram và lấy mã API (Token):

1. Mở ứng dụng Telegram và tìm kiếm bot có tên **@BotFather**.
2. Nhắn lệnh `/start`, sau đó nhập `/newbot`.
3. Đặt Tên hiển thị và Username (điều kiện bắt buộc là phải kết thúc bằng chữ `bot`).
4. BotFather sẽ cung cấp cho bạn một **HTTP API Token** (Ví dụ: `110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`).
5. Sao chép và dán token này vào tệp `backend/.env` của bạn như sau:

```env
TELEGRAM_BOT_TOKEN="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" # Bỏ Token Bot thật của bạn trong đây
```

**Tài liệu Công nghệ:**
Dành cho các nhà phát triển muốn tìm hiểu sâu về hệ thống:

- **[React.js](https://react.dev/learn):** Tài liệu hướng dẫn xây dựng giao diện người dùng.
- **[FastAPI](https://fastapi.tiangolo.com/):** Tài liệu hướng dẫn sử dụng API Backend bất đồng bộ (Python).
- **[Vite](https://vitejs.dev/guide/):** Công cụ đóng gói và khởi chạy frontend của dự án.
- **[Tesseract OCR](https://tesseract-ocr.github.io/):** Hướng dẫn cài đặt phần mềm nhận diện chữ trên hình ảnh (OCR).
- **[Telegram Bot](https://core.telegram.org/bots/tutorial):** Hướng dẫn mọi thứ bạn cần biết để xây dựng Bot Telegram.

---

## Thành viên nhóm

Dự án này được phát triển bởi:

- **Nguyễn Thành Kiên** - [@KindaRusty](https://github.com/KindaRusty)
- **Bùi Tiến Hùng** - [@THungB](https://github.com/THungB)
- **Trương Nam Hùng** - [@NamHung276](https://github.com/NamHung276)
- **Nguyễn Hữu Hiếu** - [@huuhieu9925](https://github.com/huuhieu9925)

---

## Lời cảm ơn

Chúng tôi xin gửi lời tri ân sâu sắc đến các giảng viên hướng dẫn tại **Đại học Công nghệ Swinburne Đà Nẵng**: **Thầy Đặng Phước Nhật** và **Cô Trần Lý Quỳnh**, vì sự hướng dẫn tận tình, những phản hồi quý báu và sự hỗ trợ không ngừng của thầy cô trong suốt quá trình phát triển ứng dụng này.
