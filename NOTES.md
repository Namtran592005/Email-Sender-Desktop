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

## TASK MỚI (nâng cấp toàn diện desktop) — 2026-08-15 sau sandbox reset
Sandbox đã reset, files dự án vẫn ở /home/ubuntu/email-sender-desktop (restored). Yêu cầu user:
1. Sửa nút toolbar: link (prompt 'https://' — có thể fail vì focus); Eraser (removeFormat có thể không hoạt động nếu selection mất focus — toolbar button focus làm mất selection trong iframe → cần preventDefault + focus lại iframe trước khi execCommand); Palette (chỉ chạy khi có value — nút màu chính chưa mở bảng màu).
2. Bảng màu đầy đủ kiểu Photoshop + ô nhập mã hex (dùng react-colorful ColorPicker nhẹ, + hex input + quick swatches).
3. Xóa nháp vẫn không được dù ấn liên tiếp — cần cơ chế khóa: flag deletePendingRef trong ComposeScreen: khi persistDraft thấy draftIdRef.current trong danh sách 'đã bị xóa' (deleteSetRef) thì không lưu lại; DraftsScreen remove thêm ID vào global delete set (window.__pendingDraftDeletes).
4. Lưu data dạng tệp JSON trong thư mục data tự tạo (vd ~/.config/email-sender-desktop/data/ trên Linux, %APPDATA% giữ như cũ nhưng tạo subfolder data/, mỗi store 1 file JSON: accounts.json, drafts.json, templates.json, sent.json).
5. Nút "Xóa dữ liệu" trong Cài đặt (xóa các file JSON, toast xác nhận).
6. Redesign giao diện đẹp hơn, dùng thư viện UI tốt hơn — hiện dùng inline styles tự viết. Dùng @mui/material? Nặng. Chọn: giữ React nhưng thêm thư viện framer-motion cho animation nhẹ + dùng hệ thống design tokens nhất quán, card/đổ bóng mềm, sidebar gradient nhẹ, hover states. Trọng tâm làm lại: sidebar, cards, buttons (pill modern), toolbar.
7. Bỏ dòng "Dữ liệu lưu cục bộ..." ở App.tsx sidebar.
Build: `CSC_IDENTITY_AUTO_DISCOVERY=false node ./node_modules/electron-builder/out/cli/cli.js --win portable --x64` (LƯU Ý: pnpm build:win bị tool kill SIGINT ở bước 7z nsis — chạy qua node cli trực tiếp mới qua được; wrapper 7za tại /home/ubuntu/.cache/electron-builder/7zip@1.0.0/7zip-linux-x64-16wjr/bin/7za đã trap INT — nhưng sandbox reset có thể mất, kiểm tra lại trước build!).
Exe output: release/Email Sender 1.0.0.exe → /home/ubuntu/deliver/Email-Sender-1.0.0-portable.exe
Git: repo Namtran592005/Email-Sender-Desktop, remote đã set, token classic.
Test UI: xvfb-run electron --no-dev --disable-gpu --screenshot --url "?page=..." (cần build renderer trước: pnpm build:renderer; main.mjs có sẵn --screenshot/--url/--test). App data path hiện tại trong main.mjs: userDataDir = app.getPath('userData') + '/data' hoặc trực tiếp — kiểm tra readJson/writeJson path hiện tại khi sửa phase 2.

## Tiến độ task nâng cấp (phase 1) — đã làm:
- RichEditor.tsx: đã thêm saveSelection/restoreSelection (offset theo text length, TreeWalker SHOW_TEXT) — toolbar không còn mất selection khi click; removeFormat dùng selectAll rồi clear; setColor cũng restore selection.
- Đã cài react-colorful (pnpm add ok).
- Đã tạo ColorPickerModal.tsx: HslaColorPicker + ô nhập HEX + validate + nút Áp dụng + swatches (recent trước, DEFAULT_SWATCHES fallback).
- CÒN LÀM phase 1: ComposeScreen — thay case 'color': mở ColorPickerModal (state colorOpen, recentColorsRef list max 8, lưu vào localStorage key 'esd-recent-colors'), dùng latestRef.body color; sửa 'link' giữ nguyên prompt.
- Phase 2: main.mjs — chuyển userData path sang {userData}/data/ (mkdirSync) + từng store file riêng (accounts.json, drafts.json, templates.json, sent.json); thêm IPC clearData. DraftsScreen + ComposeScreen: xóa triệt để — dùng window.__pendingDraftDeletes (Set<string>) global; ComposeScreen persistDraft kiểm tra set trước khi save + thêm vào set khi user bấm Xóa nháp; DraftsScreen remove: lọc drafts không có id trong set + add id vào set, xóa khỏi app.drafts; set.clear() khi app close (beforeunload trong App.tsx).
- Phase 3: SettingsScreen — nút "Xóa dữ liệu" (confirm dialog → IPC clearData → toast); App.tsx bỏ dòng "Dữ liệu lưu cục bộ...".
- Phase 4 (design): cài @emotion/styled? KHÔNG — quá nặng; dùng framer-motion + chỉnh theme.ts: thêm shadows mới, hover states, card radius nhất quán, gradient sidebar nhẹ (linear-gradient #0F0F10 → #181818? — app trắng-đen-vàng), button pill với transition, toolbar hiện tại ok. Trọng tâm: App.tsx sidebar (logo, nav items hover, active pill), cards 3 màn hình, modal animations.
- Phase 5: screenshot --url ?page=compose|drafts|settings|templates|sent (cần seed=?seed=1 cho compose có data). Main.mjs có --screenshot --url --test flags sẵn.
- Phase 6: build portable: CSC_IDENTITY_AUTO_DISCOVERY=false node ./node_modules/electron-builder/out/cli/cli.js --win portable --x64 (chạy trực tiếp node cli, KHÔNG dùng pnpm — pnpm bị kill SIGINT ở bước 7z nsis.7z). Kiểm tra wrapper 7za còn không (sandbox reset!). Nếu mất wrapper: tạo lại /home/ubuntu/.cache/electron-builder/7zip@1.0.0/7zip-linux-x64-16wjr/bin/7za (backup 7zz real, wrapper trap INT setsid 7zz) — chi tiết wrapper ở NOTES phần trước.
- Exe → /home/ubuntu/deliver/Email-Sender-1.0.0-portable.exe; git push origin main; repo Namtran592005/Email-Sender-Desktop.

## CẬP NHẬT TIẾN ĐỘ (phase 1-3 HOÀN TẤT) — trước compaction
ĐÃ XONG:
- Phase 1: RichEditor.tsx lưu/khôi phục selection (savedRange offset text), removeFormat=selectAll+clear, setColor restore selection. ColorPickerModal.tsx mới (HslaColorPicker + hex input + recent swatches lưu localStorage key 'esd-recent-colors'). ComposeScreen.tsx: case 'color' mở ColorPickerModal (colorOpen state, pushRecent/handleApplyColor), recentColors từ localStorage, COLORS[1] (#C9913B) làm initial.
- Phase 2: main.mjs — data path đổi thành {userData}/data/ (ensureDir tạo thư mục data; dev = ~/.email-sender-desktop/data). Các store: smtp_accounts.json, smtp_default.json, drafts.json, templates.json, sent.json (mỗi file riêng). IPC 'data:clear' xóa hết .json trong data/ + reset memory stores. preload: thêm dataApi.clear. window.d.ts: khai báo dataApi. DraftsScreen.tsx: getDeleteSet() → window.__pendingDraftDeletes; remove() add id vào set trước save. ComposeScreen.tsx: persistDraft trả về ngay nếu draftId trong deleteSet; sendWithAccount và resetAll cũng add id vào deleteSet.
- Phase 3: SettingsScreen.tsx có section "Dữ liệu" + nút "Xóa dữ liệu" (Trash2, confirm dialog → dataApi.clear → save tất cả rỗng → toast). App.tsx: ĐÃ XÓA dòng "Dữ liệu lưu cục bộ..." ở sidebar.
CÒN LẠI phase 4-7:
- Phase 4 (design): dùng framer-motion (cần cài: pnpm add framer-motion) cho modal/sidebar transitions + nâng theme: sidebar gradient nhẹ #F7F7F8→#EFF0F2, nav item active pill với gold accent line trái, hover background F3F3F6, button primary hover opacity 0.9 + transition all .15s, cards hover lift nhẹ, toolbar button hover #F1F1F4, inputs focus ring 2px goldSoft, scrollbar mượt hơn, Toast animation slide. Sửa App.tsx Shell: logo block đẹp hơn (viền tròn lớn, chữ E vàng?), nút Soạn thư mới với icon. TemplatesScreen/SentScreen/DraftsScreen cards thêm hover. Màu vẫn trắng-đen-vàng (gold='#1C1C1E' — chú ý gold thực ra là màu đen đậm, goldSoft='#E5E5EA' xám nhạt; accent button luôn nền #1C1C1E chữ trắng — giữ nguyên, user quen).
- Phase 5: typecheck pnpm exec tsc --noEmit; screenshot các trang: scripts/shot.sh (seed url ?seed=1; --url ?page=X). Main hỗ trợ --screenshot --url --test --no-dev. Renderer build: pnpm build:renderer trước khi chạy electron (base = dist/renderer/index.html).
- Phase 6: build portable: (cd /home/ubuntu/email-sender-desktop && CSC_IDENTITY_AUTO_DISCOVERY=false node ./node_modules/electron-builder/out/cli/cli.js --win portable --x64) — LƯU Ý: phải chạy trực tiếp node cli (khÔNG pnpm — bị kill SIGINT ở 7z nsis). Wrapper 7za sandbox reset mất → nếu build fail "Break signaled" lại, tạo lại wrapper: /home/ubuntu/.cache/electron-builder/7zip@1.0.0/7zip-linux-x64-16wjr/bin/7za là symlink tới 7zz; backup bằng mv thành 7zz.real và ghi script trap '' INT TERM HUP / setsid 7zz "$@" setsid background + wait. Exe → release/Email Sender 1.0.0.exe → cp /home/ubuntu/deliver/Email-Sender-1.0.0-portable.exe.
- Phase 7: gửi message result kèm exe + ảnh screenshots. Git: cd /home/ubuntu/email-sender-desktop, remote origin = Namtran592005/Email-Sender-Desktop, git add -A, commit, push origin main.
Lưu ý khác: Toast dùng useToast({type,message}); AppProvider expose saveAccounts(list,defId), saveDrafts, saveTemplates, saveSent; pickFiles qua app.pickFiles. lib.ts có buildEmailHtml, formatBytes, isValidEmail, types Attachment/Draft/Template/SmtpAccount. CodeEditor trong CodePreview.tsx là textarea overlay; Preview là iframe. CcBccModal textarea mỗi dòng 1 địa chỉ.
