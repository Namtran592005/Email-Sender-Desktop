import React, { useState } from 'react';
import { FileText, Plus, Star, Trash2, Pencil } from 'lucide-react';
import { palette, radii, shadows, typography } from '../theme';
import { useApp } from '../AppProvider';
import { useToast } from '../components/Toast';
import type { Template } from '../lib';

interface TemplatesProps { onUseTemplate: (id: string) => void; }

export default function TemplatesScreen({ onUseTemplate }: TemplatesProps) {
  const app = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);

  const saveTemplate = async (t: Template) => {
    if (!t.name.trim()) { toast({ type: 'error', message: 'Nhập tên mẫu.' }); return; }
    const exists = app.templates.some((x) => x.id === t.id);
    const next = exists ? app.templates.map((x) => (x.id === t.id ? t : x)) : [t, ...app.templates];
    await app.saveTemplates(next);
    setEditing(null);
    setCreating(false);
    toast({ type: 'success', message: 'Đã lưu mẫu.' });
  };

  const remove = async (id: string) => {
    await app.saveTemplates(app.templates.filter((t) => t.id !== id));
    toast({ type: 'info', message: 'Đã xóa mẫu.' });
  };

  const setDefault = async (id: string) => {
    const next = app.templates.map((t) => ({ ...t, isDefault: t.id === id }));
    await app.saveTemplates(next);
    toast({ type: 'success', message: 'Đã đặt mẫu mặc định.' });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ ...typography.title, margin: 0 }}>Mẫu thư</h2>
        <button
          onClick={() => setCreating(true)}
          style={{ background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Tạo mẫu
        </button>
      </div>
      <p style={{ ...typography.caption, color: palette.mutedStrong, marginTop: 0 }}>
        Mẫu giúp bắt đầu thư mới nhanh hơn. Có thể đặt một mẫu làm mặc định, tự động điền khi soạn thư mới.
      </p>

      {(creating || editing) && (
        <TemplateForm
          template={creating ? null : editing}
          onSave={saveTemplate}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {app.templates.length === 0 && !creating && !editing ? (
        <div style={{ background: palette.bgSoft, borderRadius: radii.lg, padding: 48, textAlign: 'center', color: palette.mutedStrong, marginTop: 20 }}>
          <FileText size={34} style={{ color: palette.muted, marginBottom: 10, display: 'block', marginInline: 'auto' }} />
          Chưa có mẫu nào. Tạo mẫu đầu tiên để dùng lại cho các thư sau.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {app.templates.map((t) => (
            <div key={t.id} style={{
              background: '#FFF', border: `1px solid ${palette.cardBorder}`, borderRadius: radii.lg,
              padding: '14px 18px', boxShadow: shadows.soft,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...typography.subtitle, fontSize: 15 }}>
                    {t.name} {t.isDefault && <span style={{ ...typography.caption, color: palette.info }}>· mặc định</span>}
                  </div>
                  <div style={{ ...typography.caption, color: palette.muted, marginTop: 4 }} dangerouslySetInnerHTML={{ __html: t.bodyHtml.slice(0, 140) }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onUseTemplate(t.id)} style={{
                    background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                  }}>Dùng</button>
                  <button onClick={() => setDefault(t.id)} style={{
                    background: t.isDefault ? palette.bgSoft : 'transparent',
                    border: `1px solid ${t.isDefault ? palette.hairline : 'transparent'}`,
                    borderRadius: radii.pill, padding: '6px 10px', cursor: 'pointer', color: t.isDefault ? palette.ink : palette.muted,
                  }}>
                    <Star size={14} />
                  </button>
                  <button onClick={() => setEditing(t)} style={{
                    background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill, padding: '6px 10px', cursor: 'pointer', color: palette.body,
                  }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(t.id)} style={{
                    background: 'transparent', border: `1px solid rgba(255,59,48,0.3)`, borderRadius: radii.pill, padding: '6px 10px', cursor: 'pointer', color: palette.error,
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ template, onSave, onCancel }: { template: Template | null; onSave: (t: Template) => void; onCancel: () => void }) {
  const [name, setName] = useState(template?.name || '');
  const [html, setHtml] = useState(template?.bodyHtml || '');
  return (
    <div style={{
      background: '#FFF', border: `1px solid ${palette.cardBorder}`, borderRadius: radii.lg, padding: 18,
      marginTop: 14, boxShadow: shadows.soft,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên mẫu"
          style={{
            flex: 1, background: palette.inputBg, border: 'none', borderRadius: radii.sm, padding: '9px 12px',
            fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={() => onSave({ id: template?.id || `t${Date.now()}`, name, bodyHtml: html })} style={{
          background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Lưu mẫu
        </button>
        <button onClick={onCancel} style={{ background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
      </div>
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Nội dung HTML của mẫu…"
        spellCheck={false}
        style={{
          width: '100%', minHeight: 160, background: palette.inputBg, border: 'none', borderRadius: radii.sm,
          padding: 12, fontSize: 13, fontFamily: "Menlo, Consolas, monospace", resize: 'vertical', outline: 'none',
        }}
      />
      <div style={{ ...typography.caption, color: palette.muted, marginTop: 6 }}>Viết HTML trực tiếp (thẻ &lt;b&gt;, &lt;h2&gt;, &lt;ul&gt;… đều được hỗ trợ).</div>
    </div>
  );
}
