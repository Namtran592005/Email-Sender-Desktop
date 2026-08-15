import { app, BrowserWindow, dialog, ipcMain, nativeTheme } from 'electron';
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('use-angle', 'swiftshader-webgl');
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = (!app.isPackaged || process.argv.includes('--dev')) && !process.argv.includes('--no-dev');

// ---------------------------------------------------------------------------
// Data store — self-created `data/` folder with one JSON file per store:
//   {base}/data/accounts.json | drafts.json | templates.json | sent.json
// where base = app.getPath('userData') (packed) or ~/.email-sender-desktop (dev).
// ---------------------------------------------------------------------------
function userDataDir() {
  if (isDev) return path.join(app.getPath('home'), '.email-sender-desktop');
  return app.getPath('userData');
}
function ensureDir() {
  const dir = path.join(userDataDir(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function readJson(name, fallback) {
  try {
    const p = path.join(ensureDir(), `${name}.json`);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJson(name, data) {
  const p = path.join(ensureDir(), `${name}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

const SMTP_KEY = 'smtp_accounts';
const DEFAULT_KEY = 'smtp_default';

let smtpAccounts = readJson(SMTP_KEY, []);
let defaultSmtpId = readJson(DEFAULT_KEY, '');

const cleanAccount = (a) => ({
  id: a && typeof a.id === 'string' && a.id ? a.id : `a${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
  name: typeof (a && a.name) === 'string' ? a.name : '',
  host: typeof (a && a.host) === 'string' ? a.host : '',
  port: typeof (a && a.port) === 'string' && a.port ? a.port : '465',
  tls: (a && a.tls) !== false,
  user: typeof (a && a.user) === 'string' ? a.user : '',
  pass: typeof (a && a.pass) === 'string' ? a.pass : '',
  fromName: typeof (a && a.fromName) === 'string' ? a.fromName : 'Email Sender',
  fromEmail: typeof (a && a.fromEmail) === 'string' ? a.fromEmail : '',
});
const persistAccounts = () => writeJson(SMTP_KEY, smtpAccounts);

function smtpIsConfigured(c) {
  return Boolean(c && c.host && c.user && c.fromEmail && c.id);
}

// ---------------------------------------------------------------------------
// SMTP client — same protocol flow as the mobile app (smtp.js)
// ---------------------------------------------------------------------------
const CONNECT_TIMEOUT = 15000;
const SESSION_TIMEOUT = 60000;

function utf8Bytes(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < s.length) {
      const lo = s.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (lo - 0xdc00);
        i += 1;
      }
    }
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return bytes;
}
const b64 = (s) => Buffer.from(utf8Bytes(s)).toString('base64');
function wrapBase64(b64str, width = 76) {
  const out = [];
  for (let i = 0; i < b64str.length; i += width) out.push(b64str.slice(i, i + width));
  return out.join('\r\n');
}
function sanitizeFilename(name) {
  return String(name || 'file').replace(/[\r\n"]/g, '').trim() || 'file';
}
function isAscii(s) {
  return /^[\x20-\x7E]*$/.test(s);
}
function encodeHeader(value) {
  const str = String(value || '');
  return isAscii(str) ? str : `=?UTF-8?B?${b64(str)}?=`;
}
function parseReply(lines) {
  const last = lines[lines.length - 1];
  const codeMatch = last.match(/^(\d{3})\s/);
  return { code: codeMatch ? parseInt(codeMatch[1], 10) : 0, text: lines.join('\n').trim() };
}
const isStartTlsPort = (p) => {
  const n = Number(p) || 465;
  return n === 587 || n === 25;
};

function runSession(cfg, actions) {
  const c = { tls: true, port: 465, tlsCheckValidity: true, ...cfg };
  const port = Number(c.port) || 465;
  const secure = c.tls !== false;
  const starttls = secure && isStartTlsPort(port);
  const tlsOpts =
    c.tlsCheckValidity === false
      ? { rejectUnauthorized: false }
      : { servername: c.host };
  return new Promise((resolve, reject) => {
    let sock = null;
    let settled = false;
    let sessionTimer = null;
    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      if (sessionTimer) clearTimeout(sessionTimer);
      if (sock) {
        try { sock.removeAllListeners(); } catch {}
        try { sock.destroy(); } catch {}
      }
      if (err) reject(err);
      else resolve(value);
    };
    let buffer = '';
    const waiters = [];
    const flush = () => {
      while (true) {
        const lines = buffer.split('\r\n');
        let parseAt = -1;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line && /^\d{3}\s/.test(line)) { parseAt = i; break; }
        }
        if (parseAt < 0) break;
        const reply = parseReply(lines.slice(0, parseAt + 1));
        buffer = lines.slice(parseAt + 1).join('\r\n');
        const w = waiters.shift();
        if (w) w.resolveReply(reply);
        else break;
      }
    };
    const recv = () =>
      new Promise((resolveReply, rejectReply) => {
        const t = setTimeout(
          () => rejectReply(new Error(`SMTP timeout waiting for server. Received: ${JSON.stringify(buffer.slice(-200))}`)),
          20000
        );
        waiters.push({
          resolveReply: (v) => { clearTimeout(t); resolveReply(v); },
          rejectReply: (e) => { clearTimeout(t); rejectReply(e); },
        });
        flush();
      });
    const sendCmd = (line) => {
      if (sock) sock.write(line + '\r\n');
      else throw new Error('Not connected');
    };
    const writeRaw = (s) => {
      if (sock) sock.write(s);
      else throw new Error('Not connected');
    };
    sessionTimer = setTimeout(() => finish(new Error('SMTP session timeout')), SESSION_TIMEOUT);
    const upgradeToTls = () => {
      if (!starttls) return Promise.resolve();
      const secureSocket = tls.connect({ socket: sock, ...tlsOpts });
      secureSocket.on('secure', () => {});
      secureSocket.on('error', (e) => finish(new Error(`STARTTLS error: ${e.message}`)));
      sock = secureSocket;
      return new Promise((r) => setTimeout(r, 250));
    };
    const doActions = () => {
      try {
        const api = { send: sendCmd, write: writeRaw, recv, finish, starttls, upgrade: upgradeToTls };
        const p = actions(api);
        if (p && p.catch) p.catch((e) => finish(e));
      } catch (e) { finish(e); }
    };
    if (secure && !starttls) {
      sock = tls.connect({ host: c.host, port, connectTimeout: CONNECT_TIMEOUT, ...tlsOpts }, doActions);
    } else {
      sock = net.createConnection({ host: c.host, port, connectTimeout: CONNECT_TIMEOUT }, doActions);
      sock.on('connect', () => {});
    }
    sock.on('data', (chunk) => { buffer += chunk.toString('utf8'); flush(); });
    sock.on('error', (e) => finish(new Error(`Connection error: ${e.message}`)));
    sock.on('close', () => finish(new Error('SMTP connection closed')));
  });
}

async function authFlow(send, recv, c) {
  send(`AUTH PLAIN ${b64(`\u0000${c.user}\u0000${c.pass}`)}`);
  let auth = await recv();
  if (auth.code !== 235) {
    send('AUTH LOGIN');
    let r = await recv();
    if (r.code !== 334) throw new Error('SMTP auth failed');
    send(b64(c.user));
    r = await recv();
    if (r.code !== 334) throw new Error('SMTP auth failed');
    send(b64(c.pass));
    auth = await recv();
  }
  if (auth.code !== 235) throw new Error(`Auth failed: ${auth.text}`);
}

async function buildMessage(mail, cfg) {
  const c = { ...cfg };
  const recipients = (Array.isArray(mail.to) ? mail.to : String(mail.to || '').split(',')).map((s) => s.trim()).filter(Boolean);
  const ccList = (Array.isArray(mail.cc) ? mail.cc : String(mail.cc || '').split(',')).map((s) => s.trim()).filter(Boolean);
  const bccList = (Array.isArray(mail.bcc) ? mail.bcc : String(mail.bcc || '').split(',')).map((s) => s.trim()).filter(Boolean);
  const fromHeader = `From: ${encodeHeader(c.fromName || c.fromEmail)} <${c.fromEmail}>`;
  const toHeader = recipients.length ? `To: ${recipients.join(', ')}` : null;
  const ccHeader = ccList.length ? `Cc: ${ccList.join(', ')}` : null;
  const subjectHeader = `Subject: ${encodeHeader(mail.subject)}`;
  const html = String(mail.html || '').trim();
  const attachments = Array.isArray(mail.attachments) ? mail.attachments.filter((a) => a && a.data) : [];
  const boundary = `----=_Part_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const headersWithoutType = [
    fromHeader, toHeader, ccHeader, subjectHeader,
    'MIME-Version: 1.0',
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${crypto.randomBytes(6).toString('hex')}@${c.host}>`,
  ].filter(Boolean).join('\r\n');
  let messageBody;
  if (attachments.length) {
    const parts = [];
    parts.push(`--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${html}`);
    for (const att of attachments) {
      const mime = att.mimeType || 'application/octet-stream';
      const name = sanitizeFilename(att.name);
      const encodedName = isAscii(name) ? name : `=?UTF-8?B?${b64(name)}?=`;
      parts.push(
        `--${boundary}\r\nContent-Type: ${mime}; name="${encodedName}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${encodedName}"\r\n\r\n${wrapBase64(att.data)}`
      );
    }
    parts.push(`--${boundary}--`);
    messageBody = `${headersWithoutType}\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n${parts.join('\r\n')}`;
  } else {
    messageBody = `${headersWithoutType}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${html}`;
  }
  const dotStuffed = messageBody
    .split('\n')
    .map((l) => (/^\./.test(l) ? '.' + l : l).replace(/\r$/, ''))
    .join('\r\n');
  return { dotStuffed, recipients, ccList, bccList };
}

async function sendEmailWithConfig(mail, cfg) {
  const c = { ...cfg };
  if (!c.host || !c.port) throw new Error('Missing SMTP host/port. Configure SMTP in Settings.');
  if (!c.user || !c.pass) throw new Error('Missing SMTP username/password.');
  if (!c.fromEmail) throw new Error('Missing sender email.');
  const { dotStuffed, recipients, ccList, bccList } = await buildMessage(mail, c);
  return runSession(c, async ({ send, write, recv, finish, starttls, upgrade }) => {
    const greet = await recv();
    if (greet.code !== 220) throw new Error(greet.text);
    send(`EHLO ${c.host || 'localhost'}`);
    const ehlo = await recv();
    if (ehlo.code !== 250) throw new Error(ehlo.text);
    if (starttls) {
      send('STARTTLS');
      const st = await recv();
      if (st.code !== 220) throw new Error(st.text);
      await upgrade();
      send(`EHLO ${c.host || 'localhost'}`);
      const ehlo2 = await recv();
      if (ehlo2.code !== 250) throw new Error(ehlo2.text);
    }
    await authFlow(send, recv, c);
    send(`MAIL FROM:<${c.fromEmail}>`);
    const mf = await recv();
    if (mf.code !== 250) throw new Error(mf.text);
    for (const addr of [...recipients, ...ccList, ...bccList]) {
      send(`RCPT TO:<${addr}>`);
      const rcpt = await recv();
      if (rcpt.code !== 250 && rcpt.code !== 251) throw new Error(`Recipient rejected: ${rcpt.text}`);
    }
    send('DATA');
    const dc = await recv();
    if (dc.code !== 354) throw new Error(dc.text);
    write(dotStuffed + '\r\n.\r\n');
    const done = await recv();
    if (done.code !== 250) throw new Error(`Send failed: ${done.text}`);
    send('QUIT');
    await recv().catch(() => {});
    finish(null, { ok: true });
  });
}

async function testConnection(cfg) {
  const c = { ...cfg };
  if (!c.host || !c.port) throw new Error('Missing host/port.');
  return runSession(c, async ({ send, recv, finish, starttls, upgrade }) => {
    const greet = await recv();
    if (greet.code !== 220) throw new Error(`Server: ${greet.text}`);
    send(`EHLO ${c.host}`);
    const ehlo = await recv();
    if (ehlo.code !== 250) throw new Error(`EHLO failed: ${ehlo.text}`);
    if (c.user && c.pass) {
      if (starttls) {
        send('STARTTLS');
        const st = await recv();
        if (st.code !== 220) throw new Error(st.text);
        await upgrade();
        send(`EHLO ${c.host}`);
        const ehlo2 = await recv();
        if (ehlo2.code !== 250) throw new Error(`EHLO failed: ${ehlo2.text}`);
      }
      await authFlow(send, recv, c);
    } else {
      throw new Error('Enter username and password to test authentication.');
    }
    send('QUIT');
    await recv().catch(() => {});
    finish(null, { ok: true });
  });
}

// ---------------------------------------------------------------------------
// Generic store helpers (drafts, templates, sent) with change events
// ---------------------------------------------------------------------------
const stores = new EventEmitter();
function makeStore(name, fallback) {
  return {
    name,
    list: () => readJson(name, fallback),
    write(list) {
      writeJson(name, list);
      stores.emit(name, list);
    },
  };
}
const draftsStore = makeStore('drafts', []);
const templatesStore = makeStore('templates', []);
const sentStore = makeStore('sent', []);

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'Email Sender',
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });
  const shouldScreenshot = process.argv.includes('--screenshot');
  const isTest = process.argv.includes('--test');
  // NOTE: screenshot listener must be attached BEFORE any load()
  let screenCount = 0;
  if (shouldScreenshot) {
    let captured = false;
    const capture = async (out) => {
      try {
        const img = await mainWindow.webContents.capturePage({ waitForFirstPaint: true });
        fs.writeFileSync(out, img.toPNG());
      } catch (e) {
        fs.writeFileSync(out, Buffer.from(String(e)));
      }
    };
    mainWindow.webContents.on('did-finish-load', async () => {
      screenCount += 1;
      if (captured) return;
      await new Promise((r) => setTimeout(r, 2500));
      try {
        captured = true;
        if (isTest) {
          // click the delete button of the first draft
          const deleted = await mainWindow.webContents.executeJavaScript(`
            (() => {
              const btn = document.querySelector('button[aria-label="Xóa nháp"]');
              if (!btn) return 'no-button';
              btn.closest('button').click();
              return 'clicked';
            })()
          `).catch(() => 'err');
          await new Promise((r) => setTimeout(r, 800));
          await capture('/tmp/email-sender-ui-after.png');
          // report counts
          const counts = await mainWindow.webContents.executeJavaScript(`window.smtpApi.list().then(a => a.length)`).catch(() => 'acc-err');
          // use draftsApi via preload (exposed on window)
          const draftCounts = await mainWindow.webContents.executeJavaScript(`
            (async () => {
              try {
                const api = window.draftsApi || (window.api && window.api.draftsApi);
                if (api && api.list) {
                  const list = await api.list();
                  return list.length;
                }
                return 'noapi';
              } catch (e) { return 'err: ' + e.message; }
            })()
          `).catch(() => 'err');
          fs.writeFileSync('/tmp/email-sender-test-result.json', JSON.stringify({ deleted, counts, draftCounts }));
        } else {
          await capture('/tmp/email-sender-ui.png');
        }
      } catch (e) {
        fs.writeFileSync('/tmp/email-sender-ui.png', Buffer.from(String(e)));
      }
      app.quit();
    });
    setTimeout(() => { if (screenCount === 0) app.quit(); }, 15000);
  }
  const urlArg = (() => {
    const idx = process.argv.indexOf('--url');
    return idx >= 0 ? process.argv[idx + 1] : null;
  })();
  const base = path.join(__dirname, '..', 'dist', 'renderer', 'index.html');
  if (isDev && !urlArg) {
    mainWindow.loadURL('http://localhost:5173' + (urlArg || '')).catch(() => {});
  } else if (urlArg) {
    // file:// URLs with query strings may not fire did-finish-load reliably;
    // set the query after the first page completes.
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`location.search = ${JSON.stringify(urlArg)};`).catch(() => {});
    });
    mainWindow.loadFile(base);
  } else {
    mainWindow.loadFile(base);
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------
ipcMain.handle('smtp:list', () => smtpAccounts.map(cleanAccount));
ipcMain.handle('smtp:default', () => defaultSmtpId || '');
ipcMain.handle('smtp:save', (event, list, defId) => {
  smtpAccounts = (Array.isArray(list) ? list : []).map(cleanAccount);
  persistAccounts();
  if (defId !== undefined) {
    defaultSmtpId = typeof defId === 'string' ? defId : (smtpAccounts[0]?.id || '');
    writeJson(DEFAULT_KEY, defaultSmtpId);
  }
  return { ok: true };
});
ipcMain.handle('smtp:test', async (event, account) => {
  try {
    await testConnection(cleanAccount(account));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
});
ipcMain.handle('smtp:send', async (event, { mail, accountId }) => {
  try {
    const account = smtpAccounts.find((a) => a.id === accountId);
    if (!account || !smtpIsConfigured(account)) throw new Error('Configure SMTP in Settings before sending.');
    await sendEmailWithConfig(mail, cleanAccount(account));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
});

// Clear all local data: deletes every JSON file in the self-created data/ folder.
ipcMain.handle('data:clear', () => {
  try {
    const dir = ensureDir();
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.json')) fs.unlinkSync(path.join(dir, file));
    }
    smtpAccounts = [];
    defaultSmtpId = '';
    draftsStore.write([]);
    templatesStore.write([]);
    sentStore.write([]);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e && e.message ? e.message : e) };
  }
});

// Attachments: desktop picks files and reads base64 into memory.
ipcMain.handle('file:pick', async (event, { multiple = true } = {}) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
  });
  if (res.canceled || !res.filePaths.length) return { canceled: true, files: [] };
  const files = await Promise.all(
    res.filePaths.map(async (filePath) => {
      const data = await fs.promises.readFile(filePath);
      return {
        id: `a${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        name: path.basename(filePath),
        size: data.length,
        data: data.toString('base64'),
      };
    })
  );
  return { canceled: false, files };
});

// Generic key/value stores (drafts, templates, sent)
for (const store of [draftsStore, templatesStore, sentStore]) {
  ipcMain.handle(`${store.name}:list`, () => store.list());
  ipcMain.handle(`${store.name}:save`, (event, list) => {
    store.write(list);
    return { ok: true };
  });
}

// Notify renderer when a store file changes (e.g. another window)
for (const store of [draftsStore, templatesStore, sentStore]) {
  stores.on(store.name, () => {
    mainWindow?.webContents?.send(`store:updated`, store.name);
  });
}
