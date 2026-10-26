/** Extract the opaque bearer token from the event's Round 3 QR URL. */
export function parseRound3QrPayload(payload: string): string | null {
  const value = payload.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.pathname.replace(/\/+$/, '').endsWith('/qr/redeem')) return null;
    const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
    const token = fragment.get('code') || url.searchParams.get('code');
    return token?.trim() || null;
  } catch {
    return null;
  }
}
