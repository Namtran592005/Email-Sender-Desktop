import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { palette, radii } from '../theme';

export interface RichEditorHandle {
  setHtml: (html: string) => void;
  getHtml: () => string;
  runCommand: (cmd: string, value?: string) => void;
  setColor: (color: string) => void;
}

/**
 * Simple WYSIWYG editor backed by an iframe + contentEditable + execCommand.
 * Mirrors the mobile RichEditor capability set: bold/italic/underline/strike,
 * h2, lists, blockquote, links, colors.
 */
const RichEditor = forwardRef<RichEditorHandle, { initialHtml?: string; onChange?: (html: string) => void }>(({ initialHtml = '', onChange }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const inputFrame = useRef<number | null>(null);
  const pendingHtml = useRef('');
  // Selection saved when the editor last had focus, so toolbar button clicks
  // (which steal focus) can restore the caret/range before running a command.
  const savedRange = useRef<{ start: number; end: number } | null>(null);

  // An iframe may emit several DOM events for one edit. Coalesce content
  // snapshots to one React update per painted frame instead of re-rendering
  // the entire compose screen for every raw browser event.
  function emitChange(doc?: Document) {
    const body = doc?.body || iframeRef.current?.contentDocument?.body;
    if (!body) return;
    pendingHtml.current = body.innerHTML;
    if (inputFrame.current !== null) return;
    inputFrame.current = window.requestAnimationFrame(() => {
      inputFrame.current = null;
      onChangeRef.current?.(pendingHtml.current);
    });
  }

  useEffect(() => () => {
    if (inputFrame.current !== null) window.cancelAnimationFrame(inputFrame.current);
  }, []);

  useImperativeHandle(ref, () => ({
    setHtml: (html: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !readyRef.current) return;
      const body = doc.body;
      if (body) body.innerHTML = html;
    },
    getHtml: () => iframeRef.current?.contentDocument?.body?.innerHTML || '',
    runCommand: (cmd: string, value?: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !readyRef.current) return;
      restoreSelection(doc);
      if (cmd === 'removeFormat') {
        // deselect everything after clearing formats so subsequent typing is plain
        doc.execCommand('selectAll', false);
        doc.execCommand('removeFormat', false);
        doc.defaultView?.getSelection()?.removeAllRanges();
        doc.defaultView?.focus();
        return;
      }
      doc.execCommand(cmd, false, value);
      doc.defaultView?.focus();
      saveSelection(doc);
      emitChange(doc);
    },
    setColor: (color: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !readyRef.current) return;
      restoreSelection(doc);
      doc.execCommand('foreColor', false, color);
      doc.defaultView?.focus();
      saveSelection(doc);
      emitChange(doc);
    },
  }), []);

  function saveSelection(doc: Document) {
    const sel = doc.defaultView?.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const pre = doc.createRange();
    pre.selectNodeContents(doc.body);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + range.toString().length;
    savedRange.current = { start, end };
  }

  function restoreSelection(doc: Document) {
    if (!savedRange.current) {
      doc.defaultView?.focus();
      return;
    }
    const body = doc.body;
    if (!body) return;
    const { start, end } = savedRange.current;
    const walker = doc.createTreeWalker(body, 4 /* NodeFilter.SHOW_TEXT */);
    let offset = 0;
    let startNode: Text | null = null;
    let startOff = 0;
    let endNode: Text | null = null;
    let endOff = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const len = node.textContent?.length || 0;
      if (!startNode && offset + len >= start) { startNode = node; startOff = start - offset; }
      if (!endNode && offset + len >= end) { endNode = node; endOff = end - offset; break; }
      offset += len;
    }
    const range = doc.createRange();
    if (startNode && endNode) {
      range.setStart(startNode, Math.min(startOff, startNode.textContent?.length || 0));
      range.setEnd(endNode, Math.min(endOff, endNode.textContent?.length || 0));
    } else {
      range.selectNodeContents(body);
    }
    const sel = doc.defaultView?.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  const onLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !doc.body) throw new Error('Không thể truy cập editor iframe.');
      doc.designMode = 'on';
      doc.body.innerHTML = initialHtml;
      doc.body.className = 'editor-body';
      readyRef.current = true;
      setFailed(false);
      doc.addEventListener('input', () => emitChange(doc));
    } catch {
      readyRef.current = false;
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div style={{ minHeight: 340, border: `1px solid ${palette.hairline}`, background: palette.surface, padding: 14 }}>
        <div style={{ color: palette.mutedStrong, fontSize: 13, marginBottom: 10 }}>Write editor không thể khởi tạo. Bạn vẫn có thể sửa HTML trực tiếp hoặc tải lại editor.</div>
        <textarea value={initialHtml} onChange={(e) => onChangeRef.current?.(e.target.value)} spellCheck={false} style={{ width: '100%', minHeight: 230, background: palette.editorBg, color: palette.editorText, border: 0, padding: 12, fontFamily: "'SF Mono', Menlo, Consolas, monospace", resize: 'vertical', outline: 'none' }} />
        <button onClick={() => { setFailed(false); setEpoch((value) => value + 1); }} style={{ marginTop: 12, background: palette.gold, color: '#FFF', border: 0, borderRadius: radii.pill, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Tải lại Write</button>
      </div>
    );
  }

  return (
    <iframe
      key={epoch}
      ref={iframeRef}
      onLoad={onLoad}
      onError={() => { readyRef.current = false; setFailed(true); }}
      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 16px; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 17px; line-height: 1.6; color: #1c1c1e; }
        img { max-width: 100%; height: auto; }
        ::selection { background: ${palette.goldSoft}; }
      </style></head><body></body></html>`}
      style={{
        width: '100%',
        minHeight: 340,
        border: `1px solid ${palette.hairline}`,
        borderRadius: 0,
        background: '#FFF',
      }}
      title="Soạn thư"
    />
  );
});

RichEditor.displayName = 'RichEditor';
export default RichEditor;
