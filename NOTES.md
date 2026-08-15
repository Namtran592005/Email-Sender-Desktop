# Email Sender Desktop — trạng thái triển khai

## Nhiệm vụ hiện tại
Người dùng (Namtran592005) yêu cầu: "ok quay lại Email Sender. ta nên làm một bản dành cho pc với giao diện tương tự thay đổi thành desktop"
→ Xây bản desktop (Windows) của Email Sender, giao diện tương tự bản mobile (React Native) nhưng thiết kế cho PC.

## Tech stack
- Electron 43 + Vite 8 + React 19 + TypeScript 7 + lucide-react (install tại /home/ubuntu/email-sender-desktop bằng pnpm)
- Bản mobile gốc đã clone tại /home/ubuntu/email-sender-pc (branch main, repo Namtran592005/Email-Sender)
- Mobile dùng palette trắng/đen + điểm vàng/gold (#C9913B), theme.ts trong renderer/src/theme.ts tái hiện lại (bg #FFFFFF, ink #111111, gold-dark #1C1C1E)

## File đã tạo
- main/main.mjs — SMTP client (net/tls, AUTH PLAIN/LOGIN, STARTTLS), IPC smtp/test/send, file picker base64, JSON stores (~/.email-sender-desktop/{smtp_accounts,smtp_default,drafts,templates,sent}.json)
- preload/preload.cjs — contextBridge: smtpApi, fileApi, draftsApi, templatesApi, sentApi, storeEvents
- renderer: vite.config.ts, index.html, src/{App.tsx,AppProvider.tsx,theme.ts,lib.ts,global.css,main.tsx,window.d.ts}, screens/{Compose,Drafts,Templates,Sent,Settings}Screen.tsx, components/{Toast,RichEditor,Toolbar,CodePreview,TemplatePreview→CodePreview,TemplateLibrary,CcBccModal,AccountPickerModal}
- assets/icon.png (512), icon256.png, icon128.png (envelope đen vàng)
- package.json: main=main/main.mjs, scripts build:renderer / build:win (electron-builder nsis+portable) / typecheck

## LỖI typecheck còn lại cần sửa
1. lucide-react KHÔNG có icon 'Cc' → trong ComposeScreen.tsx đổi import 'Cc' thành 'AtSign' (hoặc Copy)
2. TS2882 global.css side-effect import trong main.tsx → thêm "allowArbitraryExtensions": true vào tsconfig compilerOptions
3. AppProvider.tsx callback params implicit any → thêm kiểu explicit
4. TS paths baseUrl đã sửa xong; đã typecheck được nhưng còn 3 lỗi trên

## Đã kiểm tra bằng screenshot (xvfb-run, headless)
- Script: scripts/shot.sh — seed qua `--url ?seed=1`, chụp qua `--screenshot --url ?page=X` (X = compose/drafts/templates/sent/settings)
- Lưu ý kỹ thuật: `--screenshot --url` phải chạy riêng từng lệnh (background + sleep), file electron ở ./node_modules/.bin/electron, cần flag `--no-dev --disable-gpu`; electron cần --disable-gpu --disable-gpu-compositing trong sandbox headless; capturePage cần waitForFirstPaint
- Trang compose (screenshot đầu) OK: sidebar + soạn thư + toolbar + Write/Code/Preview + cc/bcc + mẫu/đính kèm OK
- Trang settings OK: demo account hiển thị đúng
- Typecheck đã PASS, build renderer PASS

## Bước tiếp theo
1. Sửa 3 lỗi typecheck → pnpm typecheck OK
2. Chạy thử: pnpm dev (vite port 5173 + electron) trong sandbox headless → chụp ảnh màn hình xác nhận UI; nếu không chạy được X server thì pnpm build:renderer xong kiểm tra HTML
3. pnpm build:win → release/ (có thể cần 7zip: apt install 7zip hoặc pnpm dlx)
4. Push source lên GitHub (repo mới Namtran592005/Email-Sender-Desktop — private theo default), KHÔNG upload exe lên github
5. Gửi user: exe portable + thông báo

## Ghi chú bản mobile (nguồn tham chiếu)
- Màn hình: Home (lịch sử), Compose (rich editor 3 chế độ write/code/preview, cc/bcc, đính kèm, mẫu), Drafts, Templates, Settings (SMTP)
- SMTP config: host/port/user/pass/tls/fromName/fromEmail, nhiều tài khoản, mặc định, test kết nối
- Logic build email: isFullHtml + buildEmailHtml + isValidEmail + formatBytes trong mobile src/lib
- Gmail cần App password (quản lý tài khoản → bảo mật)
