import React, { useState } from 'react';
import { palette, radii, shadows, typography } from '../theme';
import type { SmtpAccount } from '../lib';

export function AccountPickerModal({
  accounts, defaultAccountId, pickedId, onPick, onClose,
}: {
  accounts: SmtpAccount[];
  defaultAccountId: string;
  pickedId: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(pickedId || defaultAccountId || accounts[0]?.id || '');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFF', borderRadius: radii.xl, boxShadow: shadows.card, width: 'min(480px, 88vw)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ ...typography.subtitle, margin: 0 }}>Gửi từ tài khoản nào?</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: palette.mutedStrong }}>×</button>
        </div>
        <div style={{ padding: 8 }}>
          {accounts.map((a) => {
            const isOn = selected === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelected(a.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', margin: '6px 8px',
                  borderRadius: radii.md, cursor: 'pointer',
                  background: isOn ? palette.bgSoft : 'transparent',
                  border: isOn ? `1.5px solid ${palette.gold}` : '1.5px solid transparent',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isOn ? palette.gold : palette.muted}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isOn && <div style={{ width: 9, height: 9, borderRadius: '50%', background: palette.gold }} />}
                </div>
                <div>
                  <div style={{ ...typography.subtitle, fontSize: 14 }}>{a.fromName || a.fromEmail}</div>
                  <div style={{ ...typography.caption }}>{a.fromEmail}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '10px 20px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
          <button
            onClick={() => { onPick(selected); }}
            disabled={!selected}
            style={{ background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill, padding: '8px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Gửi thư
          </button>
        </div>
      </div>
    </div>
  );
}
