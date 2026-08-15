import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Draft, SentEmail, SmtpAccount, Template } from './lib';

interface AppData {
  accounts: SmtpAccount[];
  defaultAccountId: string;
  drafts: Draft[];
  templates: Template[];
  sent: SentEmail[];
}

interface AppContextValue extends AppData {
  loading: boolean;
  refresh: () => Promise<void>;
  saveAccounts: (list: SmtpAccount[], defId?: string) => Promise<void>;
  testAccount: (account: SmtpAccount) => Promise<{ ok: boolean; message?: string }>;
  sendEmail: (mail: {
    to: string; cc: string[]; bcc: string[]; subject: string; html: string; attachments: { id: string; name: string; data: string; mimeType?: string }[];
  }, accountId: string) => Promise<{ ok: boolean; message?: string }>;
  saveDrafts: (list: Draft[]) => Promise<void>;
  saveTemplates: (list: Template[]) => Promise<void>;
  saveSent: (list: SentEmail[]) => Promise<void>;
  pickFiles: (options?: { multiple?: boolean }) => Promise<{ canceled: boolean; files: { id: string; name: string; size: number; data: string }[] }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppData>({
    accounts: [], defaultAccountId: '', drafts: [], templates: [], sent: [],
  });

  const refresh = useCallback(async () => {
    try {
      const [accounts, defaultAccountId, drafts, templates, sent] = await Promise.all([
        window.smtpApi.list(),
        window.smtpApi.getDefault(),
        window.draftsApi.list(),
        window.templatesApi.list(),
        window.sentApi.list(),
      ]);
      setData((p) => ({
        accounts: accounts as SmtpAccount[],
        defaultAccountId: String(defaultAccountId || ''),
        drafts: (drafts as Draft[]).map((d) => ({
          ...d,
          attachments: (d.attachments || []).map((a) => ({ ...a, data: a.data || a.uri })),
        })),
        templates: (templates as Template[]).map((t) => ({ isDefault: false, ...t })),
        sent: (sent as SentEmail[]).map((s) => ({
          ...s,
          attachments: (s.attachments || []).map((a) => ({ ...a, data: a.data || a.uri })),
        })),
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const off = window.storeEvents?.onUpdate?.((name: string) => {
      if (name === 'drafts' || name === 'templates' || name === 'sent') refresh();
    });
    return () => off?.();
  }, [refresh]);

  const saveAccounts = useCallback(async (list: SmtpAccount[], defId?: string) => {
    await window.smtpApi.save(list, defId ?? data.defaultAccountId);
    await refresh();
  }, [refresh, data.defaultAccountId]);

  const testAccount = useCallback(async (account: SmtpAccount) => {
    return window.smtpApi.test(account);
  }, []);

  const sendEmail = useCallback(async (mail: { to: string; cc: string[]; bcc: string[]; subject: string; html: string; attachments: { id: string; name: string; data: string; mimeType?: string }[] }, accountId: string) => {
    return window.smtpApi.send({ mail, accountId });
  }, []);

  const saveDrafts = useCallback(async (list: Draft[]) => {
    await window.draftsApi.save(list);
    await refresh();
  }, [refresh]);

  const saveTemplates = useCallback(async (list: Template[]) => {
    await window.templatesApi.save(list);
    await refresh();
  }, [refresh]);

  const saveSent = useCallback(async (list: SentEmail[]) => {
    await window.sentApi.save(list);
    await refresh();
  }, [refresh]);

  const pickFiles = useCallback(async (options?: { multiple?: boolean }) => {
    return window.fileApi.pick(options);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...data, loading, refresh,
        saveAccounts, testAccount, sendEmail,
        saveDrafts, saveTemplates, saveSent, pickFiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
