import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { palette, radii, shadows, typography } from '../theme';
import type { Template } from '../lib';

export function TemplateLibrary({
  templates, onSelect, onClose, onCreateFromCurrent,
}: {
  templates: Template[];
  onSelect: (t: Template) => void;
  onClose: () => void;
  onCreateFromCurrent: () => void;
}) {
  const [viewing, setViewing] = useState<Template | null>(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex', backdropFilter: 'blur(3px)',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.16 }}
        style={{
          background: '#FFF', borderRadius: radii.xl, boxShadow: shadows.card,
          width: 'min(720px, 90vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ ...typography.subtitle, margin: 0 }}>Thư viện mẫu</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCreateFromCurrent} style={{
              background: palette.bgSoft, border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
              padding: '7px 14px', fontSize: 13, cursor: 'pointer',
            }}>
              + Lưu nội dung hiện tại thành mẫu
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: palette.mutedStrong }}>×</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', color: palette.mutedStrong, padding: 32, fontSize: 14 }}>
              Chưa có mẫu nào. Soạn thư rồi bấm "Lưu nội dung hiện tại thành mẫu" để tạo mẫu đầu tiên.
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                style={{
                  border: `1px solid ${palette.cardBorder}`, borderRadius: radii.md, padding: 14, marginBottom: 10,
                  cursor: 'pointer', background: viewing?.id === t.id ? palette.bgSoft : '#FFF',
                }}
                onClick={() => setViewing(t)}
              >
                <div style={{ ...typography.subtitle, fontSize: 15 }}>{t.name} {t.isDefault ? <span style={{ ...typography.caption, color: palette.info }}>(mặc định)</span> : null}</div>
                <div style={{ ...typography.caption, color: palette.muted }} dangerouslySetInnerHTML={{ __html: t.bodyHtml.slice(0, 120) }} />
              </div>
            ))
          )}
        </div>
        {viewing && (
          <div style={{ padding: '12px 22px', borderTop: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => { onSelect(viewing); onClose(); }} style={{
              background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill,
              padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Dùng mẫu này
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
