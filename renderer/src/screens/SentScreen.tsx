import React, { useState } from 'react';
import { Send, Trash2, Paperclip, X } from 'lucide-react';
import { palette, radii, shadows, typography } from '../theme';
import { useApp } from '../AppProvider';
import { useToast } from '../components/Toast';
import { formatBytes, type SentEmail } from '../lib';
import { useLanguage } from '../i18n';

export default function SentScreen({ onReuse }: { onReuse: (email: SentEmail) => void }) {
  const { t } = useLanguage();
  const app = useApp();
  const toast = useToast();
  const [selected, setSelected] = useState<SentEmail | null>(null);

  const remove = async (id: string) => {
    await app.saveSent(app.sent.filter((s) => s.id !== id));
    if (selected?.id === id) setSelected(null);
    toast({ type: 'info', message: 'Đã xóa thư khỏi lịch sử.' });
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* List */}
      <div style={{ width: 360, borderRight: `1px solid ${palette.cardBorder}`, overflowY: 'auto', padding: '20px 14px' }}>
        <h2 style={{ ...typography.title, fontSize: 20, margin: '0 0 4px 8px' }}>Thư đã gửi</h2>
        <p style={{ ...typography.caption, color: palette.mutedStrong, margin: '0 0 10px 8px' }}>
          {app.sent.length} thư
        </p>
        {app.sent.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: palette.mutedStrong, fontSize: 14 }}>Chưa gửi thư nào.</div>
        ) : (
          app.sent.map((s) => {
            const isOn = selected?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  padding: '10px 12px', margin: '4px 0', borderRadius: radii.md, cursor: 'pointer',
                  background: isOn ? palette.bgSoft : 'transparent',
                  border: isOn ? `1.5px solid ${palette.hairline}` : '1.5px solid transparent',
                }}
              >
                <div style={{ ...typography.subtitle, fontSize: 14 }}>{s.subject || <span style={{ color: palette.muted, fontWeight: 400 }}>Không tiêu đề</span>}</div>
                <div style={{ ...typography.caption }}>To: {s.to.split(',')[0]}</div>
                <div style={{ ...typography.caption, color: palette.muted }}>{new Date(s.date).toLocaleString('vi-VN')}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {selected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <h3 style={{ ...typography.title, fontSize: 22, margin: 0, flex: 1 }}>{selected.subject}</h3>
              <button onClick={() => onReuse(selected)} style={{
                background: palette.gold, border: 'none', borderRadius: radii.pill,
                padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Send size={13} /> {t('reuse')}
              </button>
              <button onClick={() => remove(selected.id)} style={{
                background: 'transparent', border: `1px solid rgba(255,59,48,0.3)`, borderRadius: radii.pill,
                padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: palette.error, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Trash2 size={13} /> Xóa
              </button>
            </div>
            <div style={{ ...typography.caption, color: palette.mutedStrong, marginBottom: 16 }}>
              Từ: {selected.account.fromName} &lt;{selected.account.fromEmail}&gt; · {new Date(selected.date).toLocaleString('vi-VN')}
              <div>To: {selected.to}</div>
            </div>
            {selected.attachments?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {selected.attachments.map((a) => (
                  <div key={a.id} style={{
                    background: palette.bgSoft, border: `1px solid ${palette.cardBorder}`, borderRadius: radii.md,
                    padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                  }}>
                    <Paperclip size={13} style={{ color: palette.muted }} />
                    <span style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    <span style={{ color: palette.muted }}>{formatBytes(a.size)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div style={{ border: `1px solid ${palette.cardBorder}`, borderRadius: radii.md, overflow: 'hidden' }}>
              <iframe
                srcDoc={selected.html}
                title="Nội dung thư"
                style={{ width: '100%', minHeight: 420, border: 'none', background: '#FFF' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: palette.mutedStrong, paddingTop: 120 }}>
            <Send size={36} style={{ color: palette.muted, marginBottom: 12, display: 'block', marginInline: 'auto' }} />
            Chọn một thư trong danh sách để xem chi tiết.
          </div>
        )}
      </div>
    </div>
  );
}
