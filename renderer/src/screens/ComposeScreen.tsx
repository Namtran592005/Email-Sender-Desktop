import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Paperclip, BookOpenText, AtSign, RotateCcw, Plus, X, Save } from 'lucide-react';
import { palette, radii, shadows, typography } from '../theme';
import { useApp } from '../AppProvider';
import { useToast } from '../components/Toast';
import { Toolbar } from '../components/Toolbar';
import RichEditor, { type RichEditorHandle } from '../components/RichEditor';
import { CodeEditor, Preview } from '../components/CodePreview';
import { CcBccModal } from '../components/CcBccModal';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { AccountPickerModal } from '../components/AccountPickerModal';
import { TemplateLibrary } from '../components/TemplateLibrary';
import { buildEmailHtml, formatBytes, isValidEmail, type Attachment, type Draft, type Template } from '../lib';

const COLORS = ['#282522', '#C9913B', '#B3261E', '#1E6B3A', '#1B5BA6', '#6B1B8F', '#817A73', '#F3D27A'];

interface ComposeProps { draftId?: string | null; templateId?: string | null; onDone?: () => void; }

export default function ComposeScreen({ draftId, templateId, onDone }: ComposeProps) {
  const app = useApp();
  const toast = useToast();

  const editorRef = useRef<RichEditorHandle>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<'write' | 'code' | 'preview'>('write');
  const [states, setStates] = useState<Record<string, boolean>>({});

  const [to, setTo] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [draftActive, setDraftActive] = useState(false);
  const draftIdRef = useRef<string | null>(null);
  const templateRef = useRef<Template | null>(null);
  const dirtyRef = useRef(false);
  const loadedRef = useRef(false);
  const sentRef = useRef(false);
  const latestRef = useRef({ to: '', cc: [] as string[], bcc: [] as string[], subject: '', body: '', attachments: [] as Attachment[] });
  const savedRef = useRef({ to: '', cc: [] as string[], bcc: [] as string[], subject: '', body: '', attachments: [] as Attachment[] });
  const saveTimer = useRef<number | null>(null);
  const lastSaveAt = useRef(0);

  useEffect(() => {
    latestRef.current = { to, cc, bcc, subject, body, attachments };
  }, [to, cc, bcc, subject, body, attachments]);

  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  // Load draft or template on open
  useEffect(() => {
    let mounted = true;
    (async () => {
      let restored: Draft | null = null;
      if (draftId) restored = app.drafts.find((d) => d.id === draftId) || null;
      if (restored) {
        draftIdRef.current = restored.id || null;
        setTo(restored.to || '');
        setCc(Array.isArray(restored.cc) ? restored.cc : []);
        setBcc(Array.isArray(restored.bcc) ? restored.bcc : []);
        setSubject(restored.subject || '');
        setBody(restored.bodyHtml || '');
        setAttachments(Array.isArray(restored.attachments) ? restored.attachments.filter((a) => a && a.data) : []);
        const t = (restored.templateId && app.templates.find((x) => x.id === restored!.templateId)) || app.templates.find((x) => x.isDefault) || null;
        setTemplate(t);
        setDraftActive(true);
        // snapshot the restored content so auto-save skips unchanged re-saves
        savedRef.current = {
          to: restored.to || '', cc: Array.isArray(restored.cc) ? restored.cc : [],
          bcc: Array.isArray(restored.bcc) ? restored.bcc : [],
          subject: restored.subject || '', body: restored.bodyHtml || '',
          attachments: Array.isArray(restored.attachments) ? restored.attachments.filter((a) => a && a.data) : [],
        };
        toast({ type: 'info', message: 'Đã khôi phục nháp.' });
      } else {
        const t = (templateId && app.templates.find((x) => x.id === templateId)) || app.templates.find((x) => x.isDefault) || null;
        setTemplate(t);
        setBody((t && t.bodyHtml) || '');
        savedRef.current = { to: '', cc: [], bcc: [], subject: '', body: (t && t.bodyHtml) || '', attachments: [] };
      }
      if (mounted) { loadedRef.current = true; setLoaded(true); }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyHtmlToEditors = useCallback((html: string) => {
    editorRef.current?.setHtml(html);
    if (codeRef.current) codeRef.current.value = html;
  }, []);

  useEffect(() => {
    if (loaded) applyHtmlToEditors(body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const persistDraft = useCallback(async (withId: boolean) => {
    if (sentRef.current) return;
    // Respect permanent deletion: if this draft id was removed from the
    // drafts list (e.g. from the Nháp screen), do not resurrect it.
    const deleteSet = (window as unknown as { __pendingDraftDeletes?: Set<string> }).__pendingDraftDeletes;
    if (deleteSet?.has(draftIdRef.current || '')) return;
    const latest = latestRef.current;
    const snapshotKey = JSON.stringify({ to: latest.to.trim(), cc: latest.cc, bcc: latest.bcc, subject: latest.subject.trim(), body: latest.body, count: latest.attachments.length });
    if (snapshotKey === JSON.stringify({ to: savedRef.current.to, cc: savedRef.current.cc, bcc: savedRef.current.bcc, subject: savedRef.current.subject, body: savedRef.current.body, count: savedRef.current.attachments.length })) return;
    const payload: Draft = {
      id: draftIdRef.current || undefined,
      templateId: templateRef.current?.id,
      to: latest.to, cc: latest.cc, bcc: latest.bcc,
      subject: latest.subject, bodyHtml: latest.body,
      attachments: latest.attachments.map((a) => ({ id: a.id, name: a.name, size: a.size, data: a.data, mimeType: a.mimeType })),
      updatedAt: Date.now(),
    };
    if (withId && !latest.body && !latest.subject && !latest.to) return;
    let next = app.drafts.filter((d) => d.id !== (payload.id || draftIdRef.current));
    next = [payload, ...next];
    await app.saveDrafts(next);
    draftIdRef.current = payload.id || null;
    savedRef.current = { to: latest.to, cc: latest.cc, bcc: latest.bcc, subject: latest.subject, body: latest.body, attachments: latest.attachments };
    lastSaveAt.current = Date.now();
    setDraftActive(true);
  }, [app]);

  const scheduleSave = useCallback(() => {
    if (!loadedRef.current || !dirtyRef.current || sentRef.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persistDraft(true), 3000);
  }, [persistDraft]);

  const markDirty = useCallback(() => {
    if (!loadedRef.current) return;
    dirtyRef.current = true;
    setDraftActive(true);
    scheduleSave();
  }, [scheduleSave]);

  useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); }, []);

  const handleToolbar = (action: string, value?: string) => {
    if (view !== 'write') { toast({ type: 'info', message: 'Chuyển sang chế độ Write để dùng thanh công cụ.' }); return; }
    const e = editorRef.current;
    if (!e) return;
    if (['bold', 'italic', 'underline', 'strike', 'h2', 'ul', 'ol', 'quote'].includes(action)) setStates((p) => ({ ...p, [action]: !p[action] }));
    switch (action) {
      case 'bold': e.runCommand('bold'); break;
      case 'italic': e.runCommand('italic'); break;
      case 'underline': e.runCommand('underline'); break;
      case 'strike': e.runCommand('strikeThrough'); break;
      case 'h2': e.runCommand('formatBlock', '<h2>'); break;
      case 'ul': e.runCommand('insertUnorderedList'); break;
      case 'ol': e.runCommand('insertOrderedList'); break;
      case 'quote': e.runCommand('formatBlock', '<blockquote>'); break;
      case 'undo': e.runCommand('undo'); break;
      case 'clear': e.runCommand('removeFormat'); break;
      case 'link': {
        const url = window.prompt('Nhập địa chỉ link:', 'https://');
        if (url) e.runCommand('createLink', url);
        break;
      }
      case 'color': {
        if (value) {
          e.setColor(value);
          pushRecent(value);
        } else {
          setColorOpen(true);
        }
        break;
      }
    }
    markDirty();
  };

  const pushRecent = (color: string) => {
    const list = [color, ...recentRef.current.filter((c) => c.toUpperCase() !== color.toUpperCase())].slice(0, 8);
    recentRef.current = list;
    setRecentColors(list);
    localStorage.setItem('esd-recent-colors', JSON.stringify(list));
  };

  const handleApplyColor = (hex: string) => {
    editorRef.current?.setColor(hex);
    pushRecent(hex);
    markDirty();
  };

  const onCodeChange = (v: string) => {
    setBody(v);
    editorRef.current?.setHtml(v);
    markDirty();
  };

  const applyTemplate = (t: Template) => {
    setTemplate(t);
    setBody(t.bodyHtml);
    editorRef.current?.setHtml(t.bodyHtml);
    if (codeRef.current) codeRef.current.value = t.bodyHtml;
    setLibraryOpen(false);
    markDirty();
  };

  const pickAttachments = async () => {
    try {
      const res = await app.pickFiles({ multiple: true });
      if (res.canceled || !res.files.length) return;
      setAttachments((prev) => [...prev, ...res.files.map((f) => ({ ...f, mimeType: '' }))].slice(0, 12));
      markDirty();
    } catch (e) {
      toast({ type: 'error', message: `Không mở được trình chọn tệp: ${(e as Error).message}` });
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    markDirty();
  };

  const [ccbccOpen, setCcbccOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('esd-recent-colors') || '[]'); } catch { return []; }
  });
  const recentRef = useRef<string[]>(recentColors);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickedAccountId, setPickedAccountId] = useState<string | null>(null);

  const contentForSend = () => {
    const content = body && body.trim();
    return content && content !== '<br>' && !/^<(\w+)>\s*<\/\1>$/.test(content) ? content : '';
  };

  const sendWithAccount = async (accountId: string) => {
    const smtp = app.accounts.find((a) => a.id === accountId);
    if (!smtp) { toast({ type: 'error', message: 'Chọn tài khoản gửi thư.' }); return; }
    setSending(true);
    try {
      const allRecipients = [...to.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean), ...cc, ...bcc];
      const html = buildEmailHtml(contentForSend());
      await app.sendEmail({
        to: to.trim(), cc, bcc, subject, html,
        attachments: attachments.map((a) => ({ id: a.id, name: a.name, data: a.data || '', mimeType: a.mimeType })),
      }, smtp.id);
      // remove draft
      sentRef.current = true;
      const deleteSet = (window as unknown as { __pendingDraftDeletes?: Set<string> }).__pendingDraftDeletes;
      if (!deleteSet) (window as unknown as { __pendingDraftDeletes: Set<string> }).__pendingDraftDeletes = new Set();
      if (draftIdRef.current) (window as unknown as { __pendingDraftDeletes: Set<string> }).__pendingDraftDeletes.add(draftIdRef.current);
      let next = app.drafts.filter((d) => d.id !== draftIdRef.current);
      await app.saveDrafts(next);
      draftIdRef.current = null;
      dirtyRef.current = false;
      if (saveTimer.current) { window.clearTimeout(saveTimer.current); saveTimer.current = null; }
      // add to sent
      const sentItem = {
        id: `s${Date.now()}`,
        account: { fromName: smtp.fromName, fromEmail: smtp.fromEmail },
        to: allRecipients.join(', '), subject, html,
        attachments: attachments.map((a) => ({ id: a.id, name: a.name, size: a.size, data: a.data })),
        date: Date.now(),
      };
      await app.saveSent([sentItem, ...app.sent]);
      toast({ type: 'success', message: 'Gửi thư thành công!' });
      if (onDone) onDone();
    } catch (e) {
      toast({ type: 'error', message: (e as Error).message });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const allRecipients = [...to.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean), ...cc, ...bcc];
    if (allRecipients.length === 0 || !allRecipients.every(isValidEmail)) {
      toast({ type: 'error', message: 'Nhập đúng địa chỉ email người nhận.' }); return;
    }
    if (!subject.trim()) { toast({ type: 'error', message: 'Nhập tiêu đề thư.' }); return; }
    if (!contentForSend()) { toast({ type: 'error', message: 'Nội dung thư đang trống.' }); return; }
    if (app.accounts.filter((a) => a.host && a.user && a.fromEmail).length === 0) {
      toast({ type: 'error', message: 'Chưa cấu hình tài khoản SMTP. Mở Cài đặt để thêm.' }); return;
    }
    const configured = app.accounts.filter((a) => a.host && a.user && a.fromEmail);
    if (configured.length === 1) { sendWithAccount(configured[0].id); return; }
    setAccountPickerOpen(true);
  };

  const saveNow = async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    const latest = latestRef.current;
    if (!latest.body && !latest.subject && !latest.to) {
      toast({ type: 'info', message: 'Chưa có gì để lưu — hãy viết gì đó trước.' }); return;
    }
    await persistDraft(true);
    toast({ type: 'success', message: 'Đã lưu nháp.' });
  };

  const resetAll = async () => {
    setTo(''); setCc([]); setBcc([]); setSubject(''); setBody('');
    setAttachments([]);
    editorRef.current?.setHtml('');
    if (codeRef.current) codeRef.current.value = '';
    sentRef.current = false;
    dirtyRef.current = false;
    if (draftIdRef.current) {
      // permanent-delete so any lingering auto-save cannot bring it back
      const deleteSet = (window as unknown as { __pendingDraftDeletes?: Set<string> }).__pendingDraftDeletes;
      if (!deleteSet) (window as unknown as { __pendingDraftDeletes: Set<string> }).__pendingDraftDeletes = new Set();
      (window as unknown as { __pendingDraftDeletes: Set<string> }).__pendingDraftDeletes.add(draftIdRef.current);
      const next = app.drafts.filter((d) => d.id !== draftIdRef.current);
      await app.saveDrafts(next);
    }
    draftIdRef.current = null;
    setDraftActive(false);
    toast({ type: 'info', message: 'Đã xóa nội dung và nháp.' });
  };

  const confirmSendAccount = () => {
    if (!pickedAccountId) { toast({ type: 'error', message: 'Chọn tài khoản để gửi thư.' }); return; }
    setAccountPickerOpen(false);
    sendWithAccount(pickedAccountId);
  };

  if (!loaded) {
    return <div style={{ padding: 40, color: palette.muted }}>Đang tải…</div>;
  }

  const configuredCount = app.accounts.filter((a) => a.host && a.user && a.fromEmail).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
        borderBottom: `1px solid ${palette.cardBorder}`,
      }}>
        <h2 style={{ ...typography.title, fontSize: 20, margin: 0, flex: 1 }}>Soạn thư</h2>
        {configuredCount === 0 && (
          <span style={{ ...typography.caption, color: palette.error, fontWeight: 600 }}>Chưa cấu hình SMTP</span>
        )}
        <button onClick={saveNow} style={{
          background: palette.bgSoft, border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
          padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: palette.ink,
        }}>
          <Save size={14} /> {draftActive ? 'Lưu nháp' : 'Lưu'}
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill,
            padding: '8px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, opacity: sending ? 0.7 : 1,
          }}
        >
          <Send size={15} /> {sending ? 'Đang gửi…' : 'Gửi thư'}
        </button>
      </div>

      {/* Recipient fields */}
      <div style={{ padding: '14px 24px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...typography.label, width: 64 }}>To</span>
          <textarea
            value={to}
            onChange={(e) => { setTo(e.target.value); markDirty(); }}
            placeholder="email@example.com — mỗi dòng một địa chỉ"
            style={{
              flex: 1, background: palette.inputBg, border: 'none', borderRadius: radii.sm, padding: '9px 12px',
              fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
            }}
          />
          <button
            onClick={() => setCcbccOpen(true)}
            style={{
              background: cc.length || bcc.length ? palette.bgSoft : 'transparent',
              border: `1px solid ${cc.length || bcc.length ? palette.hairline : 'transparent'}`,
              borderRadius: radii.pill, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, color: palette.body,
            }}
          >
            <AtSign size={14} /> {cc.length || bcc.length ? `Cc ${cc.length} · Bcc ${bcc.length}` : 'Cc / Bcc'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...typography.label, width: 64 }}>Subject</span>
          <input
            value={subject}
            onChange={(e) => { setSubject(e.target.value); markDirty(); }}
            placeholder="Tiêu đề thư"
            style={{ flex: 1, background: palette.inputBg, border: 'none', borderRadius: radii.sm, padding: '9px 12px', fontSize: 14, outline: 'none' }}
          />
        </div>
        {(cc.length > 0 || bcc.length > 0) && (
          <div style={{ display: 'flex', gap: 14, padding: '2px 0 2px 76px', ...typography.caption }}>
            {cc.length > 0 && <span>Cc: {cc.join(', ')}</span>}
            {bcc.length > 0 && <span style={{ color: palette.muted }}>Bcc: {bcc.join(', ')}</span>}
          </div>
        )}
      </div>

      {/* Body toolbar + mode switcher */}
      <div style={{ padding: '8px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', background: palette.bgSoft, borderRadius: radii.pill, border: `1px solid ${palette.cardBorder}`, overflow: 'hidden' }}>
          {(['write', 'code', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              style={{
                background: view === m ? palette.gold : 'transparent',
                color: view === m ? '#FFF' : palette.body,
                border: 'none', padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {m === 'write' ? 'Write' : m === 'code' ? 'Code' : 'Preview'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setLibraryOpen(true)} style={{
          background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
          padding: '6px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: palette.body,
        }}>
          <BookOpenText size={14} /> Mẫu
        </button>
        <button onClick={pickAttachments} style={{
          background: 'transparent', border: `1px solid ${palette.hairline}`, borderRadius: radii.pill,
          padding: '6px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: palette.body,
        }}>
          <Paperclip size={14} /> Đính kèm
        </button>
        <button onClick={resetAll} style={{
          background: 'transparent', border: `1px solid rgba(255,59,48,0.35)`, borderRadius: radii.pill,
          padding: '6px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: palette.error,
        }}>
          <RotateCcw size={14} /> Xóa hết
        </button>
      </div>

      {/* Toolbar for write mode */}
      {view === 'write' && (
        <div style={{ padding: '0 24px 8px' }}>
          <Toolbar onAction={handleToolbar} states={states} />
        </div>
      )}

      {/* Body editor */}
      <div style={{ flex: 1, padding: '0 24px 8px', minHeight: 0, overflowY: 'auto' }}>
        {view === 'write' && (
          <RichEditor ref={editorRef} initialHtml={body} onChange={(html) => { setBody(html); markDirty(); }} />
        )}
        {view === 'code' && <CodeEditor value={body} onChange={onCodeChange} />}
        {view === 'preview' && <Preview html={buildEmailHtml(contentForSend())} />}
      </div>

      {/* Attachments strip */}
      {attachments.length > 0 && (
        <div style={{ padding: '4px 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {attachments.map((a) => (
            <div key={a.id} style={{
              background: palette.bgSoft, border: `1px solid ${palette.cardBorder}`, borderRadius: radii.md,
              padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            }}>
              <Paperclip size={13} style={{ color: palette.muted }} />
              <span style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              <span style={{ color: palette.muted }}>{formatBytes(a.size)}</span>
              <button onClick={() => removeAttachment(a.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: palette.muted, padding: 0 }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {colorOpen && (
        <ColorPickerModal initial={COLORS[1]} recent={recentColors} onApply={handleApplyColor} onClose={() => setColorOpen(false)} />
      )}
      {ccbccOpen && (
        <CcBccModal cc={cc} bcc={bcc} onSave={(c, b) => { setCc(c); setBcc(b); setCcbccOpen(false); markDirty(); }} onClose={() => setCcbccOpen(false)} />
      )}
      {accountPickerOpen && (
        <AccountPickerModal
          accounts={app.accounts.filter((a) => a.host && a.user && a.fromEmail)}
          defaultAccountId={app.defaultAccountId}
          pickedId={pickedAccountId}
          onPick={confirmSendAccount}
          onClose={() => setAccountPickerOpen(false)}
        />
      )}
      {libraryOpen && (
        <TemplateLibrary
          templates={app.templates}
          onSelect={applyTemplate}
          onClose={() => setLibraryOpen(false)}
          onCreateFromCurrent={async () => {
            const content = contentForSend();
            if (!content) { toast({ type: 'info', message: 'Nội dung trống — soạn thư trước khi lưu thành mẫu.' }); return; }
            const name = window.prompt('Tên mẫu:', 'Mẫu của tôi') || 'Mẫu của tôi';
            const t: Template = { id: `t${Date.now()}`, name, bodyHtml: content };
            const next = [...app.templates, t];
            await app.saveTemplates(next);
            setLibraryOpen(false);
            toast({ type: 'success', message: 'Đã lưu nội dung hiện tại thành mẫu.' });
          }}
        />
      )}
    </div>
  );
}
