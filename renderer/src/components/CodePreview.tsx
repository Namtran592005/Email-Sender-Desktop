import React from 'react';
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
        background: '#1E1E1E',
        color: '#D4D4D4',
        border: `1px solid ${palette.hairline}`,
        borderRadius: radii.md,
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
  return (
    <iframe
      srcDoc={html || '<p style="color:#98989E">Nội dung thư sẽ hiển thị ở đây…</p>'}
      title="Xem trước"
      style={{
        width: '100%',
        minHeight: 340,
        border: `1px solid ${palette.hairline}`,
        borderRadius: radii.md,
        background: '#FFF',
      }}
    />
  );
}
