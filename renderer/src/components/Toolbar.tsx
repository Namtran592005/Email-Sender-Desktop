import React from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading2, List, ListOrdered,
  Quote, Undo2, Link2, Palette, Eraser,
} from 'lucide-react';
import { palette, radii } from '../theme';

export const TOOLBAR_FORMATS = ['bold', 'italic', 'underline', 'strike', 'h2', 'ul', 'ol', 'quote'] as const;

const COLOR_SWATCHES = ['#282522', '#C9913B', '#B3261E', '#1E6B3A', '#1B5BA6', '#6B1B8F', '#817A73', '#F3D27A'];

interface ToolbarProps {
  onAction: (action: string, value?: string) => void;
  states?: Record<string, boolean>;
}

export function Toolbar({ onAction, states = {} }: ToolbarProps) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
      background: palette.bgSoft, borderRadius: radii.md, padding: 8,
      border: `1px solid ${palette.cardBorder}`,
    }}>
      <ToolButton active={states.bold} onClick={() => onAction('bold')} title="In đậm"><Bold size={16} /></ToolButton>
      <ToolButton active={states.italic} onClick={() => onAction('italic')} title="In nghiêng"><Italic size={16} /></ToolButton>
      <ToolButton active={states.underline} onClick={() => onAction('underline')} title="Gạch chân"><Underline size={16} /></ToolButton>
      <ToolButton active={states.strike} onClick={() => onAction('strike')} title="Gạch ngang"><Strikethrough size={16} /></ToolButton>
      <Divider />
      <ToolButton active={states.h2} onClick={() => onAction('h2')} title="Tiêu đề"><Heading2 size={16} /></ToolButton>
      <ToolButton active={states.ul} onClick={() => onAction('ul')} title="Danh sách"><List size={16} /></ToolButton>
      <ToolButton active={states.ol} onClick={() => onAction('ol')} title="Danh sách đánh số"><ListOrdered size={16} /></ToolButton>
      <ToolButton active={states.quote} onClick={() => onAction('quote')} title="Trích dẫn"><Quote size={16} /></ToolButton>
      <Divider />
      <ToolButton onClick={() => onAction('undo')} title="Hoàn tác"><Undo2 size={16} /></ToolButton>
      <ToolButton onClick={() => onAction('clear')} title="Xóa định dạng"><Eraser size={16} /></ToolButton>
      <Divider />
      <ToolButton onClick={() => onAction('link')} title="Chèn link"><Link2 size={16} /></ToolButton>
      <ToolButton onClick={() => onAction('color')} title="Màu chữ"><Palette size={16} /></ToolButton>
      <div style={{ width: 8 }} />
      {COLOR_SWATCHES.map((c) => (
        <button
          key={c}
          title={c}
          onClick={() => onAction('color', c)}
          style={{
            width: 18, height: 18, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.12)',
            cursor: 'pointer', padding: 0,
          }}
        />
      ))}
    </div>
  );
}

function ToolButton({ children, active, onClick, title }: { children: React.ReactNode; active?: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: active ? palette.gold : '#FFF',
        color: active ? '#FFF' : palette.ink,
        border: `1px solid ${active ? 'transparent' : palette.cardBorder}`,
        borderRadius: radii.sm,
        padding: '6px 8px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 32,
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: palette.cardBorder, margin: '0 4px' }} />;
}
