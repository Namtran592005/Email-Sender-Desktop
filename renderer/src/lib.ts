// Shared data structures and logic ported from the mobile app.

export interface SmtpAccount {
  id: string;
  name: string;
  host: string;
  port: string;
  tls: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  data?: string; // base64 (desktop); mobile used uri instead
  uri?: string;
  mimeType?: string;
}

export interface Draft {
  id?: string;
  templateId?: string;
  to: string;
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  attachments: Attachment[];
  updatedAt?: number;
}

export interface Template {
  id: string;
  name: string;
  bodyHtml: string;
  isDefault?: boolean;
}

export interface SentEmail {
  id: string;
  account: { fromName: string; fromEmail: string };
  to: string;
  subject: string;
  html: string;
  attachments: Attachment[];
  date: number;
}

export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export function isFullHtml(s: string): boolean {
  const str = String(s || '');
  return /^\s*<!doctype\s+html/i.test(str) || /<html[\s>]/i.test(str);
}

export function buildEmailHtml(body: string): string {
  const raw = String(body || '');
  if (isFullHtml(raw)) return raw;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px;
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 17px;
    line-height: 1.6;
    color: #1c1c1e;
    word-wrap: break-word;
  }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
</style>
</head>
<body>${raw}</body>
</html>`;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(Number(n)) || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u += 1; }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}
