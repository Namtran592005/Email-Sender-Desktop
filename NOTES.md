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

## ĐÃ HOÀN THÀNH (build + push)
- Typecheck PASS, screenshot 5 trang UI đều OK (compose mở draft, settings, drafts, templates, sent)
- Build: `CSC_IDENTITY_AUTO_DISCOVERY=false pnpm build:win` → release/Email Sender 1.0.0.exe (portable, 90MB). wine sign NSIS fail trên Linux → chỉ dùng target portable
- Test wine: win-unpacked/Email Sender.exe chạy được (Chromium spawn OK) — xác nhận app khởi động trên Windows
- Git: repo Namtran592005/Email-Sender-Desktop (đã tồn tại, private), push main thành công; .gitignore bỏ node_modules/dist/release
- Còn lại: gửi user exe portable + screenshots

## Ghi chú bản mobile (nguồn tham chiếu)
- Màn hình: Home (lịch sử), Compose (rich editor 3 chế độ write/code/preview, cc/bcc, đính kèm, mẫu), Drafts, Templates, Settings (SMTP)
- SMTP config: host/port/user/pass/tls/fromName/fromEmail, nhiều tài khoản, mặc định, test kết nối
- Logic build email: isFullHtml + buildEmailHtml + isValidEmail + formatBytes trong mobile src/lib
- Gmail cần App password (quản lý tài khoản → bảo mật)

## TASK MỚI (fix 3 lỗi desktop) — 2026-08-15
Yêu cầu user: (1) nháp không xóa được, (2) lưu nháp tự động spawn quá nhiều, (3) Cc/Bcc xuống hàng như mobile.

### Phân tích lỗi
**Lỗi 1: không xóa được nháp** — race condition: DraftsScreen.remove(id) gọi saveDrafts(filter) → setData(drafts) → storeEvents.onUpdate('drafts') fired → refresh() gọi draftsApi.list() và đè lại data (refresh xảy ra sau setData nên list cũ từ main process có thể vẫn còn item vừa xóa nếu timing; khả năng cao hơn: ComposeScreen mount draft → open draft → save tự động sau 800ms đè lại item vừa xóa, vì ComposeScreen vẫn mở với draftIdRef = id → persistDraft(true) tạo lại nháp). Fix: khi xóa nháp trong DraftsScreen, nếu Compose đang mở nháp đó thì không có — nhưng race saveDrafts vs refresh; đơn giản nhất: saveDrafts không setData trực tiếp, mà refresh() luôn là nguồn sự thật duy nhất (setData(list) gây race); và refresh nên debounce nhẹ.
**Lỗi 2: lưu nháp spawn quá nhiều** — saveTimer 800ms debounce nhưng mỗi keystroke gọi scheduleSave → clear+set lại OK, nhưng vấn đề: markDirty gọi cả khi không có thay đổi thực (vd focus). Fix: tăng debounce lên 3000ms + chỉ lưu khi body/subject/to/attachments/cc/bcc khác lần lưu trước (content hash) + tránh lưu sau khi gửi.
**Lỗi 3: Cc/Bcc xuống hàng như mobile** — bản mobile (ComposeScreen.js old repo) cho phép nhập nhiều dòng: textarea mỗi dòng = 1 địa chỉ, tự parse khi gửi. Desktop hiện dùng CcBccModal + mảng string hiển thị chips. Fix: chuyển Cc/Bcc trong modal thành textarea mỗi dòng 1 địa chỉ (giống mobile) + parse theo dòng và dấu phẩy.

### Fix plan
1. AppProvider.saveDrafts: không setData trực tiếp — gọi api.save rồi refresh() (nguồn thật duy nhất). Tương tự saveTemplates/saveSent.
2. ComposeScreen.scheduleSave: debounce 3000ms + prevSnapshotRef so sánh với lần lưu cuối; bỏ markDirty ở những chỗ không cần; sau khi gửi reset timer + dirtyRef=false.
3. CcBccModal: textarea ' mỗi dòng một địa chỉ ' thay cho input + chip; parse: split [\n,]; validate isValidEmail.
4. Typecheck → screenshot xác nhận → build: `CSC_IDENTITY_AUTO_DISCOVERY=false pnpm build:win` (chỉ portable) → push git → gửi.

## Trạng thái fix task (2026-08-15 ~07:20)
ĐÃ SỬA: (1) xóa nháp OK — saveDrafts giờ dùng refresh() duy nhất; test tích hợp --test xác nhận draftCounts=0 sau click xóa, ảnh "Chưa có nháp nào"; (2) auto-save debounce 3000ms + snapshot diff savedRef (chỉ lưu khi nội dung thực sự đổi, không lưu trùng sau gửi/load); (3) To + Cc/Bcc textarea xuống hàng như mobile, parse /[,\n]+/; placeholder 1 dòng; CcBccModal placeholder ví dụ xuống dòng.
ĐÃ TEST: typecheck PASS, screenshot compose OK, test xóa nháp PASS (deleted=clicked, draftCounts=0).
BUILD: `CSC_IDENTITY_AUTO_DISCOVERY=false pnpm build:win` — 2 lần đều bị "Break signaled" khi 7za nén 375MB app.asar (393MB) — khả năng sandbox kill do memory/CPU spike của 7za. Giải pháp: dùng electron-builder portable --x64 nhưng asar vẫn nặng; thử đặt asarUnpack ít hơn hoặc tăng RAM: kiểm tra swap (/swap/swapfile2, /swap/swapfile3 8GB mỗi cái — nếu mất thì tạo lại: sudo fallocate -l 8G /swap/swapfile2 && sudo mkswap && sudo swapon), hoặc build với --x64 và env FORCE_COLOR=0 để log nhẹ. Lần đầu build (trước fix) thành công trong ~8 phút, file exe 90MB; hiện tại chỉ khác code renderer (nhỏ hơn nhiều).
Ghi chú: file asar app 375MB = win-unpacked resources; 7za cần ~1-2GB RAM khi nén.
Sau khi build OK: cp "release/Email Sender 1.0.0.exe" /home/ubuntu/deliver/Email-Sender-1.0.0-portable.exe; git add -A; git commit -m "fix: xóa nháp, auto-save nhàn hơn, Cc/Bcc + To xuống hàng như mobile"; git push origin main; gửi user.
Repo: https://github.com/Namtran592005/Email-Sender-Desktop (PAT classic: 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 — remote dùng token này).
Ảnh giao diện có sẵn trong /home/ubuntu/deliver/ (ui-compose.png mới, ui-drafts.png trước fix, ui-settings.png, ui-templates.png, ui-sent.png).
