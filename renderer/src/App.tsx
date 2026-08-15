import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PenSquare, FileText, BookOpenText, Send, Settings, Plus,
} from 'lucide-react';
import { palette, radii, shadows, typography, transitions } from './theme';
import { AppProvider, useApp } from './AppProvider';
import { ToastProvider } from './components/Toast';
import ComposeScreen from './screens/ComposeScreen';
import DraftsScreen from './screens/DraftsScreen';
import TemplatesScreen from './screens/TemplatesScreen';
import SentScreen from './screens/SentScreen';
import SettingsScreen from './screens/SettingsScreen';

type Page = 'compose' | 'drafts' | 'templates' | 'sent' | 'settings';

const NAV: { id: Page; label: string; icon: typeof PenSquare; badge?: (app: ReturnType<typeof useApp>) => number }[] = [
  { id: 'drafts', label: 'Nháp', icon: FileText, badge: (app) => app.drafts.length },
  { id: 'templates', label: 'Mẫu', icon: BookOpenText, badge: (app) => app.templates.length },
  { id: 'sent', label: 'Đã gửi', icon: Send, badge: (app) => app.sent.length },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

function Shell() {
  const app = useApp();
  const initialPage = (() => {
    const p = new URLSearchParams(location.search).get('page');
    return (['compose', 'drafts', 'templates', 'sent', 'settings'] as const).includes(p as Page) ? (p as Page) : 'compose';
  })();
  const [page, setPage] = useState<Page>(initialPage);
  const initialDraftId = new URLSearchParams(location.search).get('draftId');
  const initialTemplateId = new URLSearchParams(location.search).get('templateId');
  const [composeKey, setComposeKey] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId);

  // Resolve URL-based draft/template after the seed has populated data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('page') as Page | null;
    const d = params.get('draftId');
    const t = params.get('templateId');
    if (d && app.drafts.some((x) => x.id === d)) {
      setDraftId(d);
      if (p && p !== 'compose') setPage(p);
      else setPage('compose');
      setComposeKey((k) => k + 1);
    } else if (t && app.templates.some((x) => x.id === t)) {
      setTemplateId(t);
      setPage('compose');
      setComposeKey((k) => k + 1);
    }
  }, [app.drafts.length, app.templates.length]);

  const openCompose = (opts?: { draftId?: string; templateId?: string }) => {
    setDraftId(opts?.draftId || null);
    setTemplateId(opts?.templateId || null);
    setComposeKey((k) => k + 1);
    setPage('compose');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: palette.bg }}>
      {/* Sidebar */}
      <aside style={{
        width: 236, background: palette.sidebar, borderRight: `1px solid ${palette.cardBorder}`,
        display: 'flex', flexDirection: 'column', padding: '22px 14px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 10px', marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14, background: palette.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0D78C', fontWeight: 800, fontSize: 19,
            boxShadow: shadows.circle, border: `1px solid rgba(255,255,255,0.6)`,
          }}>
            ✉
          </div>
          <div>
            <div style={{ ...typography.subtitle, fontSize: 17 }}>Email Sender</div>
            <div style={{ ...typography.caption }}>Gửi thư HTML trực tiếp</div>
          </div>
        </div>

        <button
          onClick={() => openCompose()}
          style={{
            background: palette.gold, color: '#FFF', border: 'none', borderRadius: radii.pill,
            padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: shadows.circle, transition: transitions.fast,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <PenSquare size={16} /> Soạn thư mới
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {NAV.map((item) => {
            const active = page === item.id;
            const Icon = item.icon;
            const count = item.badge?.(app);
            return (
              <motion.button
                key={item.id}
                onClick={() => setPage(item.id)}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: active ? '#FFFFFF' : 'transparent',
                  border: '1.5px solid transparent',
                  borderLeft: `3px solid ${active ? palette.gold : 'transparent'}`,
                  borderRadius: '10px 14px 14px 10px',
                  padding: '11px 12px 11px 14px',
                  display: 'flex', alignItems: 'center', gap: 11,
                  cursor: 'pointer',
                  color: active ? palette.ink : palette.body,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.035)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={17} color={active ? palette.ink : palette.mutedStrong} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {count !== undefined && count > 0 && (
                  <span style={{
                    background: palette.goldSoft, color: palette.ink, borderRadius: radii.pill,
                    padding: '1px 9px', fontSize: 12, fontWeight: 600, minWidth: 22, textAlign: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: palette.bg }}>
        <motion.div key={page} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto', flex: 1 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}>
          {page === 'compose' && <ComposeScreen key={composeKey} draftId={draftId} templateId={templateId} onDone={() => setPage('sent')} />}
          {page === 'drafts' && <DraftsScreen onOpenDraft={(id) => openCompose({ draftId: id })} />}
          {page === 'templates' && <TemplatesScreen onUseTemplate={(id) => openCompose({ templateId: id })} />}
          {page === 'sent' && <SentScreen />}
          {page === 'settings' && <SettingsScreen />}
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ToastProvider>
  );
}
