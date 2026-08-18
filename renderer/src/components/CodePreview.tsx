import React, { useState } from 'react';
import { palette, radii } from '../theme';

export function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      style={{
        width: '100%',
        minHeight: 340,
        background: palette.editorBg,
        color: palette.editorText,
        border: `1px solid ${palette.hairline}`,
        borderRadius: 0,
        padding: 14,
        fontSize: 14,
        fontFamily: "'SF Mono', Menlo, Consolas, 'Courier New', monospace",
        lineHeight: '1.55',
        resize: 'vertical',
        outline: 'none',
        tabSize: 2,
      }}
    />
  );
}

export function Preview({ html }: { html: string }) {
  const [failed, setFailed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  if (failed) {
    return (
      <div style={{ minHeight: 340, border: `1px solid ${palette.hairline}`, background: palette.surface, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <strong style={{ color: palette.ink }}>Không thể tải bản xem trước.</strong>
          <p style={{ color: palette.mutedStrong, margin: '8px 0 14px' }}>Nội dung vẫn được giữ nguyên. Hãy thử tải lại vùng xem trước.</p>
          <button onClick={() => { setFailed(false); setEpoch((v) => v + 1); }} style={{ background: palette.gold, color: '#FFF', border: 0, borderRadius: radii.pill, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Thử lại</button>
        </div>
      </div>
    );
  }
  return (
    <iframe
      key={epoch}
      srcDoc={html || '<p style="color:#98989E">Nội dung thư sẽ hiển thị ở đây…</p>'}
      title="Xem trước"
      sandbox=""
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        minHeight: 340,
        border: `1px solid ${palette.hairline}`,
        borderRadius: 0,
        background: '#FFF',
      }}
    />
  );
}
