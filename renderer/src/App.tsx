import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PenSquare, FileText, BookOpenText, Send, Settings, Plus,
} from 'lucide-react';
import { palette, radii, shadows, typography, transitions } from './theme';
import { AppProvider, useApp } from './AppProvider';
import { ToastProvider } from './components/Toast';
import { LanguageProvider, useLanguage } from './i18n';
import type { SentEmail } from './lib';
import ComposeScreen from './screens/ComposeScreen';
import DraftsScreen from './screens/DraftsScreen';
import TemplatesScreen from './screens/TemplatesScreen';
import SentScreen from './screens/SentScreen';
import SettingsScreen from './screens/SettingsScreen';

type Page = 'compose' | 'drafts' | 'templates' | 'sent' | 'settings';

const NAV: { id: Page; labelKey: string; icon: typeof PenSquare; badge?: (app: ReturnType<typeof useApp>) => number }[] = [
  { id: 'drafts', labelKey: 'drafts', icon: FileText, badge: (app) => app.drafts.length },
  { id: 'templates', labelKey: 'templates', icon: BookOpenText, badge: (app) => app.templates.length },
  { id: 'sent', labelKey: 'sent', icon: Send, badge: (app) => app.sent.length },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

function Shell() {
  const app = useApp();
  const { t } = useLanguage();
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
  const [sentEmail, setSentEmail] = useState<SentEmail | null>(null);

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

  const openCompose = (opts?: { draftId?: string; templateId?: string; sentEmail?: SentEmail }) => {
    setDraftId(opts?.draftId || null);
    setTemplateId(opts?.templateId || null);
    setSentEmail(opts?.sentEmail || null);
    setComposeKey((k) => k + 1);
    setPage('compose');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: palette.bg, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <span style={{ position: 'absolute', width: 330, height: 330, borderRadius: '50%', border: `42px solid ${palette.red}`, opacity: 0.08, top: -160, right: -110 }} />
        <span style={{ position: 'absolute', width: 390, height: 390, borderRadius: '50%', border: `48px solid ${palette.gold}`, opacity: 0.08, bottom: -205, left: 110 }} />
        <span style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', border: `34px solid ${palette.green}`, opacity: 0.08, top: '39%', right: -132 }} />
      </div>
      {/* Sidebar */}
      <aside style={{
        width: 236, background: palette.sidebar, borderRight: `1px solid ${palette.cardBorder}`,
        display: 'flex', flexDirection: 'column', padding: '22px 14px', flexShrink: 0, zIndex: 1,
      }}>
        <div style={{ padding: '4px 10px', marginBottom: 20 }}>
          <div style={{ ...typography.title, fontSize: 18 }}>Email Sender</div>
          <div style={{ ...typography.caption, color: palette.gold, marginTop: 3, fontWeight: 600 }}>{t('appTagline')}</div>
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
          <PenSquare size={16} /> {t('newMessage')}
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
                  background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
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
                <span style={{ flex: 1, textAlign: 'left' }}>{t(item.labelKey)}</span>
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: 'transparent', zIndex: 1 }}>
        <motion.div key={page} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto', flex: 1 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}>
          {page === 'compose' && <ComposeScreen key={composeKey} draftId={draftId} templateId={templateId} sentEmail={sentEmail} onDone={() => setPage('sent')} />}
          {page === 'drafts' && <DraftsScreen onOpenDraft={(id) => openCompose({ draftId: id })} />}
          {page === 'templates' && <TemplatesScreen onUseTemplate={(id) => openCompose({ templateId: id })} />}
          {page === 'sent' && <SentScreen onReuse={(email) => openCompose({ sentEmail: email })} />}
          {page === 'settings' && <SettingsScreen />}
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
