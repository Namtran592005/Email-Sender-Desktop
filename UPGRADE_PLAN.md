# Email Sender Desktop — Lộ trình nâng cấp v2.0.0

## Mục tiêu

Đưa bản Electron desktop lên mức chức năng và trải nghiệm tương đương Email Sender mobile v2.0.0, trong khi vẫn giữ ưu thế desktop: lưu dữ liệu cục bộ, gửi SMTP trực tiếp từ máy và hỗ trợ tệp đính kèm.

| Hạng mục | Trạng thái desktop hiện tại | Nâng cấp cần thực hiện |
|---|---|---|
| Giao diện | Theme đơn sắc, bố cục sidebar | Thiết kế Glass với nền trắng, ba vòng tròn đỏ/xanh dương/xanh lục, surface sạch và accent đa sắc. |
| Compose | Có Write/Code/Preview cơ bản | Hoàn thiện editor/preview chống lỗi, có trạng thái chờ, fallback và tải lại; giữ Write/Code/Preview phẳng. |
| SMTP | TLS cơ bản, LOGIN/PLAIN và timeout cố định | Chế độ nâng cao: SSL/TLS, STARTTLS, None; LOGIN, PLAIN, CRAM-MD5, None; timeout, EHLO/HELO, TLS bắt buộc, chứng chỉ tự ký, giới hạn kết nối. |
| Ngôn ngữ | Chuỗi tiếng Việt viết trực tiếp | Language provider và tám ngôn ngữ: English, Việt, Indonesia, Thai, Japanese, Korean, Chinese, Spanish. |
| Thư đã gửi | Xem và xóa | Thêm thao tác sử dụng lại nội dung, người nhận và tiêu đề trong Compose. |
| Ổn định | Editor iframe và preview iframe chưa có recovery | Cô lập lỗi iframe, đảm bảo Compose luôn thoát loading, fallback dạng textarea và nút thử lại. |
| Phát hành | Metadata và README cũ | README mới, cập nhật version/package desktop, build artifact nền tảng phù hợp. |

## Nguyên tắc triển khai

Nâng cấp được chia thành hai lớp. Lớp renderer đảm nhiệm giao diện Glass, i18n, trải nghiệm Compose và các fallback editor. Lớp Electron main process là nguồn tin cậy cho lưu trữ và SMTP, chịu trách nhiệm chuẩn hóa dữ liệu cũ, kiểm tra cấu hình và quản lý kết nối SMTP. Mọi trường mới phải có giá trị mặc định để tài khoản đã lưu vẫn mở được.

Không gửi thử thư đến dịch vụ bên ngoài trong quá trình build. Việc xác minh sẽ ưu tiên kiểm tra TypeScript, renderer build, Electron packaging và các luồng xử lý lỗi cục bộ; người dùng chỉ cần gửi một thư kiểm tra có chủ đích sau khi cài.
