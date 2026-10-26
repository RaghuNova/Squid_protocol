import { randomBytes } from 'node:crypto';

export function generateQrToken(): string {
  return randomBytes(32).toString('base64url');
}

export function isStrongQrToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value) || /^[A-Fa-f0-9]{64}$/.test(value);
}
