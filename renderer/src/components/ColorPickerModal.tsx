import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { HslaColorPicker } from 'react-colorful';
import { palette, radii, shadows, typography } from '../theme';

interface Props {
  initial: string;
  recent: string[];
  onApply: (hex: string) => void;
  onClose: () => void;
}

const DEFAULT_SWATCHES = ['#282522', '#B3261E', '#C9913B', '#1E6B3A', '#1B5BA6', '#6B1B8F', '#817A73', '#F3D27A', '#FFFFFF', '#000000'];

function hslaToHex(h: number, s: number, l: number, a: number): string {
  void a;
  const sat = s / 100;
  const lit = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => lit - sat * Math.min(lit, 1 - lit) * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

function hexToHsla(hex: string): { h: number; s: number; l: number; a: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a: 1 };
}

export function ColorPickerModal({ initial, recent, onApply, onClose }: Props) {
  const [hex, setHex] = useState(initial.toUpperCase());
  const [hsla, setHsla] = useState<{ h: number; s: number; l: number; a: number }>(() =>
    /^#[0-9a-f]{6}$/i.test(initial) ? hexToHsla(initial) : hexToHsla('#C9913B')
  );
  const hexIsValid = /^#[0-9a-f]{6}$/i.test(hex);

  const apply = (c: string) => {
    onApply(c.toUpperCase());
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex', backdropFilter: 'blur(3px)',
        alignItems: 'center', justifyContent: 'center', zIndex: 110,
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ duration: 0.16 }}
        style={{ background: '#FFF', borderRadius: radii.xl, boxShadow: shadows.card, width: 300, overflow: 'hidden' }}
      >
        <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ ...typography.subtitle, margin: 0, fontSize: 15 }}>Chọn màu chữ</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: palette.mutedStrong }}>×</button>
        </div>

        <div style={{ padding: '0 18px 12px' }}>
          <HslaColorPicker color={hsla} onChange={(c) => { setHsla(c); setHex(hslaToHex(c.h, c.s, c.l, c.a)); }} />
        </div>

        <div style={{ padding: '0 18px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...typography.label, fontSize: 12, color: palette.mutedStrong }}>HEX</span>
          <input
            value={hex}
            maxLength={7}
            onChange={(e) => setHex(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && hexIsValid) apply(hex); }}
            style={{
              flex: 1, background: palette.inputBg, border: `1px solid ${hexIsValid ? palette.cardBorder : palette.error}`,
              borderRadius: radii.sm, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'ui-monospace, monospace',
            }}
          />
          <button
            onClick={() => hexIsValid && apply(hex)}
            disabled={!hexIsValid}
            style={{
              background: hexIsValid ? palette.gold : palette.bgSoft,
              color: hexIsValid ? '#FFF' : palette.muted,
              border: 'none', borderRadius: radii.pill, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: hexIsValid ? 'pointer' : 'default',
            }}
          >
            Áp dụng
          </button>
        </div>

        {(recent.length > 0 || DEFAULT_SWATCHES.length > 0) && (
          <div style={{ padding: '0 18px 14px' }}>
            <div style={{ ...typography.caption, color: palette.mutedStrong, marginBottom: 6 }}>{recent.length ? 'Màu gần đây' : 'Màu nhanh'}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(recent.length ? recent : DEFAULT_SWATCHES).map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => apply(c)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c,
                    border: `2px solid ${c.toUpperCase() === hex.toUpperCase() ? palette.ink : 'rgba(0,0,0,0.10)'}`,
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
