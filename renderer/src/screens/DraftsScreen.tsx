import React from 'react';
import { FileText, Trash2, Mail } from 'lucide-react';
import { palette, radii, shadows, typography } from '../theme';
import { useApp } from '../AppProvider';
import { useToast } from '../components/Toast';

function getDeleteSet(): Set<string> {
  const w = window as unknown as { __pendingDraftDeletes?: Set<string> };
  if (!w.__pendingDraftDeletes) w.__pendingDraftDeletes = new Set();
  return w.__pendingDraftDeletes;
}

interface DraftsProps { onOpenDraft: (id: string) => void; }

export default function DraftsScreen({ onOpenDraft }: DraftsProps) {
  const app = useApp();
  const toast = useToast();

  const remove = async (id: string) => {
    // Mark as permanently deleted: even if the compose screen still has this
    // draft open and tries to auto-save, it will be dropped.
    getDeleteSet().add(id);
    await app.saveDrafts(app.drafts.filter((d) => d.id !== id));
    toast({ type: 'info', message: 'Đã xóa nháp.' });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ ...typography.title, margin: '0 0 4px' }}>Nháp</h2>
      <p style={{ ...typography.caption, color: palette.mutedStrong, marginTop: 0 }}>
        Thư đang soạn được lưu tự động. Bấm vào nháp để tiếp tục viết.
      </p>
      {app.drafts.length === 0 ? (
        <div style={{ background: palette.bgSoft, borderRadius: radii.lg, padding: 48, textAlign: 'center', color: palette.mutedStrong, marginTop: 20 }}>
          <FileText size={34} style={{ color: palette.muted, marginBottom: 10, display: 'block', marginInline: 'auto' }} />
          Chưa có nháp nào.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {app.drafts.map((d) => (
            <div
              key={d.id}
              style={{
                background: '#FFF', border: `1px solid ${palette.cardBorder}`, borderRadius: radii.lg,
                padding: '14px 18px', boxShadow: shadows.soft, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              }}
              onClick={() => onOpenDraft(d.id || '')}
            >
              <div style={{
                width: 40, height: 40, borderRadius: radii.md, background: palette.bgSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.mutedStrong,
              }}>
                <Mail size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...typography.subtitle, fontSize: 15 }}>
                  {d.subject || <span style={{ color: palette.muted, fontWeight: 400 }}>Không tiêu đề</span>}
                  {d.attachments?.length ? <span style={{ ...typography.caption, marginLeft: 8 }}>· {d.attachments.length} đính kèm</span> : null}
                </div>
                <div style={{ ...typography.caption }}>
                  To: {d.to || '—'} {d.updatedAt ? `· ${new Date(d.updatedAt).toLocaleString('vi-VN')}` : ''}
                </div>
              </div>
              <button
                data-testid={`draft-delete-${d.id}`}
                aria-label="Xóa nháp"
                onClick={(e) => { e.stopPropagation(); remove(d.id || ''); }}
                style={{ background: 'transparent', border: `1px solid rgba(255,59,48,0.3)`, borderRadius: radii.pill, padding: '6px 10px', cursor: 'pointer', color: palette.error }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
