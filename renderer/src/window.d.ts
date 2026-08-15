export {};

declare global {
  interface Window {
    smtpApi: {
      list: () => Promise<unknown[]>;
      getDefault: () => Promise<unknown>;
      save: (list: unknown[], defId?: string) => Promise<{ ok: boolean }>;
      test: (account: unknown) => Promise<{ ok: boolean; message?: string }>;
      send: (payload: { mail: unknown; accountId: string }) => Promise<{ ok: boolean; message?: string }>;
    };
    fileApi: {
      pick: (options?: { multiple?: boolean }) => Promise<{ canceled: boolean; files: { id: string; name: string; size: number; data: string }[] }>;
    };
    draftsApi: {
      list: () => Promise<unknown[]>;
      save: (list: unknown) => Promise<{ ok: boolean }>;
    };
    templatesApi: {
      list: () => Promise<unknown[]>;
      save: (list: unknown) => Promise<{ ok: boolean }>;
    };
    sentApi: {
      list: () => Promise<unknown[]>;
      save: (list: unknown) => Promise<{ ok: boolean }>;
    };
    storeEvents?: {
      onUpdate: (cb: (name: string) => void) => () => void;
    };
  }
}
