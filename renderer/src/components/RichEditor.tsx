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
      doc.execCommand(cmd, false, value);
      doc.defaultView?.focus();
    },
    setColor: (color: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      doc.execCommand('foreColor', false, color);
    },
  }), []);

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
