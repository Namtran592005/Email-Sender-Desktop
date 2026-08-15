import React, { useState } from 'react';
import { palette, radii, shadows, typography } from '../theme';

export function CcBccModal({
  cc, bcc, onSave, onClose,
}: { cc: string[]; bcc: string[]; onSave: (cc: string[], bcc: string[]) => void; onClose: () => void }) {
  const [ccText, setCcText] = useState(cc.join(', '));
  const [bccText, setBccText] = useState(bcc.join(', '));

  const split = (s: string) =>
    s.split(/[,;\s\n]+/).map((x) => x.trim()).filter(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFF', borderRadius: radii.xl, boxShadow: shadows.card, width: 'min(520px, 88vw)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ ...typography.subtitle, margin: 0 }}>Cc / Bcc</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: palette.mutedStrong }}>×</button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ ...typography.label, marginBottom: 6 }}>Cc</div>
          <textarea
            value={ccText}
            onChange={(e) => setCcText(e.target.value)}
            placeholder={`email1@example.com\nemail2@example.com\n(email3@example.com)`}
            style={{
              width: '100%', minHeight: 64, background: palette.inputBg, border: 'none', borderRadius: radii.sm,
              padding: 10, fontSize: 14, resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{ ...typography.label, marginTop: 14, marginBottom: 6 }}>Bcc</div>
          <textarea
            value={bccText}
            onChange={(e) => setBccText(e.target.value)}
            placeholder={`email1@example.com\nemail2@example.com\n(email3@example.com)`}
            style={{
              width: '100%', minHeight: 64, background: palette.inputBg, border: 'none', borderRadius: radii.sm,
              padding: 10, fontSize: 14, resize: 'vertical', outline: 'none',
            }}
          />
        </div>
        <div style={{ padding: '10px 20px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
          <button
            onClick={() => onSave(split(ccText), split(bccText))}
            style={{ background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill, padding: '8px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
