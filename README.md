# Email Sender Desktop

**Email Sender Desktop** là ứng dụng Electron giúp soạn, kiểm tra và gửi email HTML trực tiếp qua SMTP tiêu chuẩn. Bản `2.0.0` được nâng cấp đồng bộ theo trải nghiệm Email Sender mobile: giao diện **Glass** sạch, Compose có khả năng phục hồi, SMTP cấu hình sâu và tám ngôn ngữ phổ biến.

> Ứng dụng không chuyển thông tin SMTP qua máy chủ trung gian. Tài khoản, bản nháp, mẫu thư và lịch sử gửi được lưu cục bộ trên máy tính.

## Các nâng cấp trong v2.0.0

| Hạng mục | Nâng cấp desktop |
|---|---|
| Giao diện Glass | Bề mặt trắng sạch, viền nhẹ, accent xanh dương/đỏ/xanh lục và nền ba vòng tròn trang trí. |
| Compose | Ba vùng **Write**, **Code**, **Preview** phẳng, tách bạch và không dùng card bo góc. |
| Độ ổn định editor | Write/Code/Preview có trạng thái chờ, fallback và nút thử lại khi iframe không khởi tạo được; nội dung đang soạn được giữ lại. |
| SMTP nâng cao | SSL/TLS, STARTTLS hoặc không mã hóa; LOGIN, PLAIN, CRAM-MD5 hoặc không xác thực; timeout, HELO/client name, bắt buộc TLS, chứng chỉ tự ký và giới hạn kết nối. |
| Tài khoản đơn giản | Chế độ nâng cao mặc định tắt, giữ form host, port, TLS, tài khoản, mật khẩu và địa chỉ gửi gọn gàng. |
| Ngôn ngữ | English, Tiếng Việt, Bahasa Indonesia, ไทย, 日本語, 한국어, 中文 và Español; lựa chọn được lưu riêng trên máy. |
| Thư đã gửi | Nút **Sử dụng lại** đưa người nhận, tiêu đề, HTML và tệp đính kèm về Compose để chỉnh sửa. |
| Lưu cục bộ | Auto-save bản nháp, nhiều tài khoản SMTP, mẫu thư, tệp đính kèm và lịch sử gửi qua các tệp JSON riêng biệt. |

## Ảnh giao diện v2.0.0

Các ảnh dưới đây được chụp lại từ build Electron hiện tại ở trạng thái dữ liệu cục bộ trống. Chúng phản ánh giao diện Glass sáng, vùng Compose phẳng, thanh điều hướng và trang Settings sau tối ưu hiệu năng.

| Compose | Cài đặt SMTP |
|---|---|
| ![Màn hình soạn thư](docs/readme-compose.png) | ![Màn hình cài đặt SMTP](docs/readme-settings.png) |

| Nháp | Mẫu | Thư đã gửi |
|---|---|---|
| ![Màn hình nháp](docs/readme-drafts.png) | ![Màn hình mẫu](docs/readme-templates.png) | ![Màn hình thư đã gửi](docs/readme-sent.png) |

## Sử dụng

1. Mở **Settings**, thêm tài khoản SMTP và dùng **Test connection** trước khi gửi thư thật.
2. Dùng form cơ bản cho đa số nhà cung cấp. Chỉ bật **Advanced mode** nếu máy chủ cần cấu hình đặc biệt.
3. Trong **Compose**, soạn bằng **Write**, dán HTML trong **Code**, rồi dùng **Preview** để xem email.
4. Sau khi gửi, mở **Sent** và chọn **Reuse** để khởi tạo thư mới từ nội dung đã gửi.

## Tương thích SMTP

| Loại cấu hình | Thiết lập đề xuất |
|---|---|
| SMTPS, cổng 465 | Security: `SSL/TLS`; Authentication theo nhà cung cấp. |
| SMTP Submission, cổng 587 | Security: `STARTTLS`; yêu cầu TLS nếu máy chủ bắt buộc. |
| Máy chủ nội bộ không mã hóa | Security: `None`; chỉ dùng trên mạng tin cậy. |
| Chứng chỉ tự ký | Bật `Ignore TLS certificate errors` **chỉ** khi bạn tin cậy máy chủ. |
| Cơ chế đặc biệt | Chọn LOGIN, PLAIN, CRAM-MD5 hoặc None theo tài liệu nhà cung cấp. |

## Dữ liệu cục bộ

Trên Windows, dữ liệu được lưu tại `%APPDATA%\email-sender-desktop\data\`.

| Tệp | Nội dung |
|---|---|
| `accounts.json` | Tài khoản SMTP, bao gồm cấu hình nâng cao. |
| `drafts.json` | Bản nháp được tự động lưu. |
| `templates.json` | Mẫu email HTML. |
| `sent.json` | Thư đã gửi để xem lại hoặc sử dụng lại. |
| `settings.json` | Ngôn ngữ giao diện. |
| `smtp_default.json` | ID tài khoản gửi mặc định. |

## Phát triển và build

Yêu cầu: Node.js 20+ và pnpm.

```bash
pnpm install
pnpm typecheck
pnpm build:renderer
pnpm start
```

Build bản Windows portable x64:

```bash
pnpm build:win
```

Nếu đóng gói trên Linux, Electron Builder có thể yêu cầu Wine và Xvfb. Artifact được đặt trong `release/`.

## Kiến trúc

| Thành phần | Công nghệ và trách nhiệm |
|---|---|
| Renderer | React 19, TypeScript, Vite 8, giao diện Glass, Compose, i18n và fallback editor. |
| Main process | Electron 43 quản lý cửa sổ, lưu cục bộ, SMTP, MIME, tệp đính kèm và IPC handler. |
| Preload bridge | API giới hạn quyền cho SMTP, dữ liệu, file, ngôn ngữ, nháp, mẫu và thư đã gửi. |
| SMTP | Nodemailer áp dụng cấu hình transport đã chuẩn hóa cho kiểm tra kết nối và gửi thư. |

## Định danh phát hành

| Thuộc tính | Giá trị |
|---|---|
| Product name | `Email Sender` |
| Version | `2.0.0` |
| Desktop application ID | `com.namtran.es.desktop` |
| Mục tiêu đóng gói | Windows portable x64 |
