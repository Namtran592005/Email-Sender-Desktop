import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { palette, radii, shadows, typography } from '../theme';
import { useApp } from '../AppProvider';
import { useToast } from '../components/Toast';
import type { SmtpAccount } from '../lib';
import { LANGUAGES, type Language, useLanguage } from '../i18n';

const emptyAccount = (): SmtpAccount => ({
  id: '', name: '', host: '', port: '465', tls: true, user: '', pass: '', fromName: '', fromEmail: '',
  advancedMode: false, security: 'SSL', authMethod: 'LOGIN', connectTimeout: '30', socketTimeout: '60',
  heloName: '', requireTls: false, ignoreTLSErrors: false, maxConnections: '1',
});

function Field({ label, value, onChange, placeholder, type = 'text', small = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; small?: boolean;
}) {
  return (
    <div style={{ flex: small ? 1 : 2, minWidth: small ? 110 : 220 }}>
      <div style={{ ...typography.label, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'off' : undefined}
        style={{
          width: '100%',
          background: palette.inputBg,
          border: 'none',
          borderRadius: radii.sm,
          padding: '9px 12px',
          fontSize: 14,
          color: palette.ink,
          outline: 'none',
        }}
      />
    </div>
  );
}

export default function SettingsScreen() {
  const app = useApp();
  const toast = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [editing, setEditing] = useState<SmtpAccount | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const openNew = () => setEditing({ ...emptyAccount() });
  const openEdit = (a: SmtpAccount) => setEditing({ ...a });

  const save = async () => {
    if (!editing) return;
    if (!editing.host || !editing.user || !editing.fromEmail) {
      toast({ type: 'error', message: 'Nhập đủ Host, Username và Sender email.' });
      return;
    }
    if (editing.pass.length < 1 && app.accounts.some((a) => a.id === editing.id)) {
      // keep existing password when editing
    }
    let list: SmtpAccount[] = app.accounts;
    if (editing.id && list.some((a) => a.id === editing.id)) {
      list = list.map((a) => (a.id === editing.id ? { ...a, ...editing } : a));
      if (!editing.pass && editing.id) {
        const existing = app.accounts.find((a) => a.id === editing.id);
        list = list.map((a) => (a.id === editing.id ? { ...a, pass: existing?.pass || '' } : a));
      }
    } else {
      list = [{ ...editing, id: editing.id || `a${Date.now()}`, pass: editing.pass }, ...list];
    }
    await app.saveAccounts(list);
    setEditing(null);
    toast({ type: 'success', message: 'Đã lưu tài khoản.' });
  };

  const remove = async (id: string) => {
    const next = app.accounts.filter((a) => a.id !== id);
    await app.saveAccounts(next, next[0]?.id || '');
    if (editing?.id === id) setEditing(null);
    toast({ type: 'info', message: 'Đã xóa tài khoản.' });
  };

  const setDefault = async (id: string) => {
    await app.saveAccounts(app.accounts, id);
    toast({ type: 'success', message: 'Đã đặt tài khoản mặc định.' });
  };

  const test = async (a: SmtpAccount) => {
    if (!a.host || !a.port || !a.user || !a.pass) {
      toast({ type: 'error', message: 'Nhập đủ Host, Port, Username và Password để kiểm tra.' });
      return;
    }
    setTesting(a.id);
    const res = await app.testAccount({ ...a, pass: a.pass || app.accounts.find((x) => x.id === a.id)?.pass || '' });
    setTesting(null);
    if (res.ok) toast({ type: 'success', message: 'Kết nối SMTP thành công!' });
    else toast({ type: 'error', message: `Kết nối thất bại: ${res.message}` });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ ...typography.title, margin: 0 }}>Cài đặt SMTP</h2>
        <button
          onClick={openNew}
          style={{
            background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill,
            padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Thêm tài khoản
        </button>
      </div>
      <p style={{ ...typography.caption, color: palette.mutedStrong, marginTop: 0 }}>
        App gửi thư trực tiếp qua SMTP từ máy của bạn. Với Gmail, dùng App password (Quản lý tài khoản → Bảo mật → Ứng dụng có mật khẩu).
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 18px', padding: '11px 13px', background: 'rgba(255,255,255,0.84)', border: `1px solid ${palette.cardBorder}`, borderRadius: radii.md }}>
        <label htmlFor="language-select" style={{ ...typography.label, flex: 1 }}>{t('language')}</label>
        <select id="language-select" value={language} onChange={(e) => { void setLanguage(e.target.value as Language); }} style={{ border: `1px solid ${palette.hairline}`, borderRadius: radii.sm, padding: '7px 10px', color: palette.ink, background: '#FFF' }}>
          {LANGUAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {app.accounts.length === 0 && !editing && (
        <div style={{ background: palette.bgSoft, borderRadius: radii.lg, padding: 28, textAlign: 'center', color: palette.mutedStrong, marginTop: 16 }}>
          Chưa có tài khoản SMTP nào. Bấm <b>+ Thêm tài khoản</b> để bắt đầu.
        </div>
      )}

      {editing && (
        <div style={{ background: '#FFF', border: `1px solid ${palette.cardBorder}`, borderRadius: radii.lg, padding: 20, marginTop: 16, boxShadow: shadows.soft }}>
          <div style={{ ...typography.subtitle, marginBottom: 14 }}>{editing.id && app.accounts.some((a) => a.id === editing.id) ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Tên hiển thị" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} placeholder="Tài khoản công ty" />
            <Field label="Host" value={editing.host} onChange={(v) => setEditing({ ...editing, host: v })} placeholder="smtp.gmail.com" />
            <Field label="Port" small value={editing.port} onChange={(v) => setEditing({ ...editing, port: v })} placeholder="465" />
            <Field label="Username" value={editing.user} onChange={(v) => setEditing({ ...editing, user: v })} placeholder="email@example.com" />
            <Field label="Password" type="password" value={editing.pass} onChange={(v) => setEditing({ ...editing, pass: v })} placeholder={editing.id ? 'để trống giữ nguyên' : ''} />
            <Field label="Sender name" value={editing.fromName} onChange={(v) => setEditing({ ...editing, fromName: v })} placeholder="Tên gửi đi" />
            <Field label="Sender email" value={editing.fromEmail} onChange={(v) => setEditing({ ...editing, fromEmail: v })} placeholder="email@example.com" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: palette.body }}>
              <input
                type="checkbox"
                checked={editing.tls}
                onChange={(e) => setEditing({ ...editing, tls: e.target.checked })}
              />
              Bật TLS / SSL
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: palette.body }}>
              <input type="checkbox" checked={Boolean(editing.advancedMode)} onChange={(e) => setEditing({ ...editing, advancedMode: e.target.checked })} />
              {t('advancedMode')}
            </label>
            <button
              onClick={() => test(editing)}
              disabled={!!testing}
              style={{
                background: palette.bgSoft, border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
                padding: '8px 18px', fontSize: 14, cursor: 'pointer', color: palette.ink,
              }}
            >
              {testing === editing.id ? 'Đang kiểm tra…' : 'Test kết nối'}
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setEditing(null)}
              style={{ background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              onClick={save}
              style={{ background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill, padding: '8px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Lưu
            </button>
          </div>
          {editing.advancedMode && (
            <div style={{ marginTop: 16, padding: 14, background: palette.bgSoft, border: `1px solid ${palette.cardBorder}`, borderRadius: radii.md }}>
              <div style={{ ...typography.subtitle, fontSize: 14 }}>{t('advancedMode')}</div>
              <p style={{ ...typography.caption, color: palette.mutedStrong, marginTop: 5 }}>{t('advancedHint')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 150 }}><div style={{ ...typography.label, marginBottom: 5 }}>{t('security')}</div><select value={editing.security || 'SSL'} onChange={(e) => setEditing({ ...editing, security: e.target.value as NonNullable<SmtpAccount['security']>, tls: e.target.value !== 'None' })} style={{ width: '100%', padding: '9px 10px', border: 'none', borderRadius: radii.sm, color: palette.ink }}><option value="SSL">{t('ssl')}</option><option value="STARTTLS">{t('starttls')}</option><option value="None">{t('none')}</option></select></div>
                <div style={{ flex: 1, minWidth: 150 }}><div style={{ ...typography.label, marginBottom: 5 }}>{t('authMethod')}</div><select value={editing.authMethod || 'LOGIN'} onChange={(e) => setEditing({ ...editing, authMethod: e.target.value as NonNullable<SmtpAccount['authMethod']> })} style={{ width: '100%', padding: '9px 10px', border: 'none', borderRadius: radii.sm, color: palette.ink }}><option value="LOGIN">{t('login')}</option><option value="PLAIN">{t('plain')}</option><option value="CRAM-MD5">{t('cramMd5')}</option><option value="None">{t('none')}</option></select></div>
                <Field label={t('connectTimeout')} small value={editing.connectTimeout || '30'} onChange={(v) => setEditing({ ...editing, connectTimeout: v })} placeholder="30" />
                <Field label={t('socketTimeout')} small value={editing.socketTimeout || '60'} onChange={(v) => setEditing({ ...editing, socketTimeout: v })} placeholder="60" />
                <Field label={t('maxConnections')} small value={editing.maxConnections || '1'} onChange={(v) => setEditing({ ...editing, maxConnections: v })} placeholder="1" />
                <Field label={t('heloName')} value={editing.heloName || ''} onChange={(v) => setEditing({ ...editing, heloName: v })} placeholder="mail.example.com" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: palette.body }}><input type="checkbox" checked={Boolean(editing.requireTls)} onChange={(e) => setEditing({ ...editing, requireTls: e.target.checked })} />{t('requireTls')}</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: palette.body }}><input type="checkbox" checked={Boolean(editing.ignoreTLSErrors)} onChange={(e) => setEditing({ ...editing, ignoreTLSErrors: e.target.checked })} />{t('ignoreTlsErrors')}</label>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {app.accounts.map((a) => {
          const isDefault = a.id === app.defaultAccountId;
          return (
            <div key={a.id} style={{
              background: '#FFF', border: isDefault ? `2px solid ${palette.gold}` : `1px solid ${palette.cardBorder}`,
              borderRadius: radii.lg, padding: '14px 18px', boxShadow: shadows.soft,
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ ...typography.subtitle, fontSize: 15 }}>{a.name || a.fromEmail} <span style={{ ...typography.caption, fontWeight: 400 }}>· {a.fromEmail}</span></div>
                <div style={{ ...typography.caption }}>{a.host}:{a.port} · {a.tls ? 'TLS' : 'plain'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!isDefault && (
                  <button onClick={() => setDefault(a.id)} style={{
                    background: isDefault ? palette.gold : palette.bgSoft,
                    color: isDefault ? '#FFF' : palette.ink,
                    border: `1px solid ${isDefault ? 'transparent' : palette.hairline}`,
                    borderRadius: radii.pill, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                  }}>
                    Đặt mặc định
                  </button>
                )}
                <button onClick={() => test(a)} disabled={!!testing} style={{
                  background: palette.bgSoft, border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
                  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                }}>
                  {testing === a.id ? 'Đang kiểm tra…' : 'Test'}
                </button>
                <button onClick={() => openEdit(a)} style={{
                  background: palette.bgSoft, border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
                  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                }}>
                  Sửa
                </button>
                <button onClick={() => remove(a.id)} style={{
                  background: 'transparent', border: `1px solid rgba(255,59,48,0.35)`, color: palette.error, borderRadius: radii.pill,
                  padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                }}>
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data management */}
      <div style={{ marginTop: 32, borderTop: `1px solid ${palette.cardBorder}`, paddingTop: 20 }}>
        <div style={{ ...typography.subtitle, fontSize: 16, marginBottom: 6 }}>Dữ liệu</div>
        <p style={{ ...typography.caption, color: palette.mutedStrong, marginTop: 0, maxWidth: 640 }}>
          Tài khoản SMTP, nháp, mẫu thư và thư đã gửi được lưu dưới dạng tệp JSON trong thư mục dữ liệu riêng của ứng dụng trên máy của bạn.
        </p>
        <button
          onClick={async () => {
            const ok = window.confirm('Xóa toàn bộ dữ liệu (tài khoản SMTP, nháp, mẫu, thư đã gửi)?\nHành động này không thể hoàn tác.');
            if (!ok) return;
            const res = await window.dataApi.clear();
            if (res.ok) {
              await app.saveAccounts([], '');
              await app.saveDrafts([]);
              await app.saveTemplates([]);
              await app.saveSent([]);
              toast({ type: 'success', message: 'Đã xóa toàn bộ dữ liệu.' });
            } else {
              toast({ type: 'error', message: res.message || 'Không thể xóa dữ liệu.' });
            }
          }}
          style={{
            background: 'transparent', border: `1px solid rgba(255,59,48,0.4)`, color: palette.error,
            borderRadius: radii.pill, padding: '10px 22px', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
          }}
        >
          <Trash2 size={15} /> Xóa dữ liệu
        </button>
      </div>
    </div>
  );
}
