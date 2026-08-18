import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, X } from 'lucide-react';
import { palette, shadows, transitions, typography } from '../theme';

export function LinkModal({ onApply, onClose }: { onApply: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('https://');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const apply = () => {
    const v = url.trim();
    if (v && v !== 'https://' && v !== 'http://') onApply(v);
  };

  const valid = url.trim().startsWith('http');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(12,12,12,0.55)', display: 'flex', backdropFilter: 'blur(6px)',
      alignItems: 'center', justifyContent: 'center', zIndex: 120,
    }} onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: '#FFF', borderRadius: 16, boxShadow: shadows.modal, width: 'min(420px, 90vw)', overflow: 'hidden' }}
      >
        <div style={{
          padding: '14px 18px', background: '#FFF', color: palette.ink,
          borderBottom: `1px solid ${palette.cardBorder}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: palette.goldSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Link2 size={16} color={palette.gold} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Chèn liên kết</div>
            <div style={{ fontSize: 11.5, color: palette.muted }}>Văn bản được chọn sẽ trở thành liên kết</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: '#FFF', border: `1px solid ${palette.hairline}`, borderRadius: 9, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: palette.mutedStrong,
              transition: transitions.fast,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.inputBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <label style={{ ...typography.label, display: 'block', marginBottom: 8 }}>Địa chỉ liên kết</label>
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') apply(); if (e.key === 'Escape') onClose(); }}
            placeholder="https://example.com"
            style={{
              width: '100%', background: palette.inputBg, border: `1px solid ${valid ? palette.hairline : palette.error}`,
              borderRadius: 12, padding: '10px 13px', fontSize: 14, outline: 'none', transition: transitions.fast,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = palette.gold; e.currentTarget.style.boxShadow = `0 0 0 3px ${palette.goldSoft}`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = valid ? palette.hairline : palette.error; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {!valid && <div style={{ fontSize: 11.5, color: palette.error, marginTop: 6 }}>Bắt đầu bằng https:// hoặc http://</div>}
        </div>

        <div style={{
          padding: '10px 18px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8,
          borderTop: `1px solid ${palette.cardBorder}`, background: '#FBFBFC',
        }}>
          <button
            onClick={onClose}
            style={{ background: '#FFF', border: `1px solid ${palette.hairline}`, borderRadius: 999, padding: '8px 18px', fontSize: 14, cursor: 'pointer', color: palette.ink, transition: transitions.fast }}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.inputBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}>
            Hủy
          </button>
          <button
            onClick={apply}
            disabled={!valid}
            style={{
              background: palette.gold, color: '#FFF', border: 'none', borderRadius: 999, padding: '9px 24px',
              fontSize: 14, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed',
              opacity: valid ? 1 : 0.45, boxShadow: shadows.btn, transition: transitions.fast,
            }}
            onMouseEnter={(e) => { if (valid) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { if (valid) e.currentTarget.style.opacity = '1'; }}
          >
            Chèn liên kết
          </button>
        </div>
      </motion.div>
    </div>
  );
}
