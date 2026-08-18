import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { MailPlus, Copy, EyeOff, X, Save } from 'lucide-react';
import { palette, radii, shadows, typography, transitions } from '../theme';

export function CcBccModal({
  cc, bcc, onSave, onClose,
}: { cc: string[]; bcc: string[]; onSave: (cc: string[], bcc: string[]) => void; onClose: () => void }) {
  const [ccText, setCcText] = useState(cc.join('\n'));
  const [bccText, setBccText] = useState(bcc.join('\n'));

  const split = (s: string) =>
    s.split(/[,;\s\n]+/).map((x) => x.trim()).filter(Boolean);

  const count = split(ccText).length + split(bccText).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(12,12,12,0.55)', display: 'flex', backdropFilter: 'blur(6px)',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: '#FFF', borderRadius: 20, boxShadow: shadows.modal, width: 'min(540px, 88vw)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', background: '#FFF', color: palette.ink,
          borderBottom: `1px solid ${palette.cardBorder}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, background: palette.goldSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MailPlus size={17} color={palette.gold} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Thêm Cc / Bcc</div>
            <div style={{ fontSize: 11.5, color: palette.muted }}>Mỗi dòng một địa chỉ email</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: '#FFF', border: `1px solid ${palette.hairline}`, borderRadius: 9, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: palette.mutedStrong,
              transition: transitions.fast,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.inputBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Copy size={14} color={palette.mutedStrong} />
            <span style={{ ...typography.label, margin: 0 }}>Cc</span>
            <span style={{ fontSize: 11, color: palette.muted, marginLeft: 'auto' }}>{split(ccText).length} người nhận</span>
          </div>
          <textarea
            value={ccText}
            onChange={(e) => setCcText(e.target.value)}
            placeholder={`email1@example.com\nemail2@example.com\nemail3@example.com`}
            className="esd-textarea"
            style={{
              width: '100%', minHeight: 72, background: palette.inputBg, border: `1px solid ${palette.hairline}`,
              borderRadius: 12, padding: 11, fontSize: 14, resize: 'vertical', outline: 'none',
              transition: transitions.fast, lineHeight: 1.5,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = palette.gold; e.currentTarget.style.boxShadow = `0 0 0 3px ${palette.goldSoft}`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = palette.hairline; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 18 }}>
            <EyeOff size={14} color={palette.mutedStrong} />
            <span style={{ ...typography.label, margin: 0 }}>Bcc</span>
            <span style={{ fontSize: 11, color: palette.muted, marginLeft: 'auto' }}>{split(bccText).length} người nhận</span>
          </div>
          <textarea
            value={bccText}
            onChange={(e) => setBccText(e.target.value)}
            placeholder={`email1@example.com\nemail2@example.com\nemail3@example.com`}
            className="esd-textarea"
            style={{
              width: '100%', minHeight: 72, background: palette.inputBg, border: `1px solid ${palette.hairline}`,
              borderRadius: 12, padding: 11, fontSize: 14, resize: 'vertical', outline: 'none',
              transition: transitions.fast, lineHeight: 1.5,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = palette.gold; e.currentTarget.style.boxShadow = `0 0 0 3px ${palette.goldSoft}`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = palette.hairline; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        <div style={{
          padding: '12px 20px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: `1px solid ${palette.cardBorder}`, background: '#FBFBFC',
        }}>
          <span style={{ fontSize: 12, color: palette.muted }}>Tổng: {count} người nhận</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ background: '#FFF', border: `1px solid ${palette.hairline}`, borderRadius: 999, padding: '8px 18px', fontSize: 14, cursor: 'pointer', color: palette.ink, transition: transitions.fast }}
              onMouseEnter={(e) => (e.currentTarget.style.background = palette.inputBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}>
              Hủy
            </button>
            <button
              onClick={() => onSave(split(ccText), split(bccText))}
              style={{
                background: palette.gold, color: '#FFF', border: 'none', borderRadius: 999, padding: '9px 24px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: shadows.btn, transition: transitions.fast,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Save size={14} /> Lưu
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
