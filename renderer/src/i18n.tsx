import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'vi' | 'id' | 'th' | 'ja' | 'ko' | 'zh' | 'es';
export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' }, { id: 'vi', label: 'Tiếng Việt' },
  { id: 'id', label: 'Bahasa Indonesia' }, { id: 'th', label: 'ไทย' },
  { id: 'ja', label: '日本語' }, { id: 'ko', label: '한국어' },
  { id: 'zh', label: '中文' }, { id: 'es', label: 'Español' },
];

const en: Record<string, string> = {
  appTagline: 'Glass desktop mailer', compose: 'Compose', newMessage: 'New message', drafts: 'Drafts', templates: 'Templates', sent: 'Sent', settings: 'Settings',
  language: 'Language', advancedMode: 'Advanced mode', advancedHint: 'Use standard SMTP options for providers with specific requirements.',
  security: 'Security', authMethod: 'Authentication', connectTimeout: 'Connect timeout (sec)', socketTimeout: 'Socket timeout (sec)', heloName: 'HELO / client name', requireTls: 'Require TLS', ignoreTlsErrors: 'Ignore TLS certificate errors', maxConnections: 'Maximum connections',
  ssl: 'SSL/TLS', starttls: 'STARTTLS', none: 'None', login: 'LOGIN', plain: 'PLAIN', cramMd5: 'CRAM-MD5',
  retry: 'Retry', editorUnavailable: 'The editor could not load. Your content is preserved.', save: 'Save', cancel: 'Cancel', testConnection: 'Test connection', reuse: 'Reuse', reusedMessage: 'The sent email is ready to edit.',
};
const dictionaries: Record<Language, Record<string, string>> = {
  en,
  vi: { ...en, appTagline: 'Trình gửi thư Glass cho desktop', compose: 'Soạn thư', newMessage: 'Soạn thư mới', drafts: 'Nháp', templates: 'Mẫu', sent: 'Đã gửi', settings: 'Cài đặt', language: 'Ngôn ngữ', advancedMode: 'Chế độ nâng cao', advancedHint: 'Dùng các tùy chọn SMTP tiêu chuẩn cho nhà cung cấp có yêu cầu riêng.', security: 'Bảo mật', authMethod: 'Xác thực', connectTimeout: 'Thời hạn kết nối (giây)', socketTimeout: 'Thời hạn socket (giây)', heloName: 'HELO / tên client', requireTls: 'Bắt buộc TLS', ignoreTlsErrors: 'Bỏ qua lỗi chứng chỉ TLS', maxConnections: 'Số kết nối tối đa', ssl: 'SSL/TLS', starttls: 'STARTTLS', none: 'Không dùng', login: 'LOGIN', plain: 'PLAIN', cramMd5: 'CRAM-MD5', retry: 'Thử lại', editorUnavailable: 'Không thể tải editor. Nội dung của bạn vẫn được giữ.', save: 'Lưu', cancel: 'Hủy', testConnection: 'Test kết nối' },
  id: { ...en, compose: 'Tulis', newMessage: 'Pesan baru', drafts: 'Draf', templates: 'Template', sent: 'Terkirim', settings: 'Pengaturan', language: 'Bahasa', advancedMode: 'Mode lanjutan', advancedHint: 'Gunakan opsi SMTP standar untuk penyedia dengan persyaratan khusus.', security: 'Keamanan', authMethod: 'Autentikasi', connectTimeout: 'Batas waktu koneksi (detik)', socketTimeout: 'Batas waktu soket (detik)', heloName: 'Nama HELO / klien', requireTls: 'Wajib TLS', ignoreTlsErrors: 'Abaikan kesalahan sertifikat TLS', maxConnections: 'Koneksi maksimum', none: 'Tidak ada', retry: 'Coba lagi', editorUnavailable: 'Editor tidak dapat dimuat. Konten Anda tetap tersimpan.', save: 'Simpan', cancel: 'Batal', testConnection: 'Uji koneksi', reuse: 'Gunakan kembali', reusedMessage: 'Email terkirim siap diedit.' },
  th: { ...en, compose: 'เขียน', newMessage: 'ข้อความใหม่', drafts: 'ฉบับร่าง', templates: 'เทมเพลต', sent: 'ส่งแล้ว', settings: 'การตั้งค่า', language: 'ภาษา', advancedMode: 'โหมดขั้นสูง', advancedHint: 'ใช้ตัวเลือก SMTP มาตรฐานสำหรับผู้ให้บริการที่มีข้อกำหนดเฉพาะ', security: 'ความปลอดภัย', authMethod: 'การยืนยันตัวตน', connectTimeout: 'หมดเวลาการเชื่อมต่อ (วินาที)', socketTimeout: 'หมดเวลาซ็อกเก็ต (วินาที)', heloName: 'ชื่อ HELO / ไคลเอนต์', requireTls: 'ต้องใช้ TLS', ignoreTlsErrors: 'ละเว้นข้อผิดพลาดใบรับรอง TLS', maxConnections: 'การเชื่อมต่อสูงสุด', none: 'ไม่มี', retry: 'ลองอีกครั้ง', editorUnavailable: 'ไม่สามารถโหลดตัวแก้ไขได้ เนื้อหาของคุณยังคงอยู่', save: 'บันทึก', cancel: 'ยกเลิก', testConnection: 'ทดสอบการเชื่อมต่อ', reuse: 'ใช้ซ้ำ', reusedMessage: 'อีเมลที่ส่งพร้อมแก้ไขแล้ว' },
  ja: { ...en, compose: '作成', newMessage: '新規メール', drafts: '下書き', templates: 'テンプレート', sent: '送信済み', settings: '設定', language: '言語', advancedMode: '詳細モード', advancedHint: '特別な要件を持つプロバイダーには標準 SMTP オプションを使用します。', security: 'セキュリティ', authMethod: '認証', connectTimeout: '接続タイムアウト（秒）', socketTimeout: 'ソケットタイムアウト（秒）', heloName: 'HELO / クライアント名', requireTls: 'TLS を必須にする', ignoreTlsErrors: 'TLS 証明書エラーを無視', maxConnections: '最大接続数', none: 'なし', retry: '再試行', editorUnavailable: 'エディターを読み込めません。内容は保持されています。', save: '保存', cancel: 'キャンセル', testConnection: '接続をテスト', reuse: '再利用', reusedMessage: '送信済みメールを編集用に開きました。' },
  ko: { ...en, compose: '작성', newMessage: '새 메시지', drafts: '임시 보관함', templates: '템플릿', sent: '보낸 편지함', settings: '설정', language: '언어', advancedMode: '고급 모드', advancedHint: '특별한 요구 사항이 있는 제공업체에는 표준 SMTP 옵션을 사용합니다.', security: '보안', authMethod: '인증', connectTimeout: '연결 시간 제한(초)', socketTimeout: '소켓 시간 제한(초)', heloName: 'HELO / 클라이언트 이름', requireTls: 'TLS 필수', ignoreTlsErrors: 'TLS 인증서 오류 무시', maxConnections: '최대 연결 수', none: '없음', retry: '다시 시도', editorUnavailable: '편집기를 불러올 수 없습니다. 내용은 보존됩니다.', save: '저장', cancel: '취소', testConnection: '연결 테스트', reuse: '다시 사용', reusedMessage: '보낸 이메일을 편집할 수 있습니다.' },
  zh: { ...en, compose: '撰写', newMessage: '新邮件', drafts: '草稿', templates: '模板', sent: '已发送', settings: '设置', language: '语言', advancedMode: '高级模式', advancedHint: '为有特殊要求的服务商使用标准 SMTP 选项。', security: '安全', authMethod: '身份验证', connectTimeout: '连接超时（秒）', socketTimeout: '套接字超时（秒）', heloName: 'HELO / 客户端名称', requireTls: '要求 TLS', ignoreTlsErrors: '忽略 TLS 证书错误', maxConnections: '最大连接数', none: '无', retry: '重试', editorUnavailable: '无法加载编辑器，您的内容已保留。', save: '保存', cancel: '取消', testConnection: '测试连接', reuse: '重复使用', reusedMessage: '已打开已发送邮件以供编辑。' },
  es: { ...en, compose: 'Redactar', newMessage: 'Nuevo mensaje', drafts: 'Borradores', templates: 'Plantillas', sent: 'Enviados', settings: 'Ajustes', language: 'Idioma', advancedMode: 'Modo avanzado', advancedHint: 'Use opciones SMTP estándar para proveedores con requisitos específicos.', security: 'Seguridad', authMethod: 'Autenticación', connectTimeout: 'Tiempo de conexión (seg.)', socketTimeout: 'Tiempo de socket (seg.)', heloName: 'Nombre HELO / cliente', requireTls: 'Requerir TLS', ignoreTlsErrors: 'Ignorar errores de certificado TLS', maxConnections: 'Máximo de conexiones', none: 'Ninguno', retry: 'Reintentar', editorUnavailable: 'No se pudo cargar el editor. Su contenido se conserva.', save: 'Guardar', cancel: 'Cancelar', testConnection: 'Probar conexión', reuse: 'Reutilizar', reusedMessage: 'El correo enviado está listo para editarse.' },
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => Promise<void>; t: (key: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');
  useEffect(() => { window.languageApi.get().then((value) => { if (LANGUAGES.some((item) => item.id === value)) setLanguageState(value as Language); }).catch(() => {}); }, []);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: async (next) => { setLanguageState(next); await window.languageApi.set(next); },
    t: (key) => dictionaries[language]?.[key] || en[key] || key,
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
}
