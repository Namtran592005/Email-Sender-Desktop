import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Selection saved when the editor last had focus, so toolbar button clicks
  // (which steal focus) can restore the caret/range before running a command.
  const savedRange = useRef<{ start: number; end: number } | null>(null);

  useImperativeHandle(ref, () => ({
    setHtml: (html: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const body = doc.body;
      if (body) body.innerHTML = html;
    },
    getHtml: () => iframeRef.current?.contentDocument?.body?.innerHTML || '',
    runCommand: (cmd: string, value?: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
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
    },
    setColor: (color: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      restoreSelection(doc);
      doc.execCommand('foreColor', false, color);
      doc.defaultView?.focus();
      saveSelection(doc);
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
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.designMode = 'on';
    doc.body.innerHTML = initialHtml;
    doc.body.className = 'editor-body';
    readyRef.current = true;
    doc.addEventListener('input', () => onChangeRef.current?.(doc.body.innerHTML));
    doc.addEventListener('mouseup', () => onChangeRef.current?.(doc.body.innerHTML));
    doc.addEventListener('keyup', () => onChangeRef.current?.(doc.body.innerHTML));
  };

  return (
    <iframe
      ref={iframeRef}
      onLoad={onLoad}
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
        borderRadius: radii.md,
        background: '#FFF',
      }}
      title="Soạn thư"
    />
  );
});

RichEditor.displayName = 'RichEditor';
export default RichEditor;
