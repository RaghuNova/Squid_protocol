import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../services/api';
import { CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react';
import { parseRound3QrPayload } from '../features/round3/qrPayload';

export const PhysicalQrRedeemPage: React.FC = () => {
  const started = useRef(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<{ loading: boolean; teamCode?: string; accessKey?: string; error?: string }>({ loading: true });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = parseRound3QrPayload(window.location.href);
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    if (!code) {
      setState({ loading: false, error: 'QR code is missing or invalid. Scan the event QR again.' });
      return;
    }
    apiRequest('/round3/qr/mobile-redeem', { method: 'POST', body: JSON.stringify({ code }) })
      .then(result => setState({ loading: false, teamCode: result.teamCode, accessKey: result.accessKey }))
      .catch((error: any) => setState({ loading: false, error: error?.message || 'This QR code could not be verified. Scan your team’s printed Round 3 QR again.' }));
  }, []);

  const copyCode = async () => {
    if (!state.accessKey) return;
    try {
      await navigator.clipboard.writeText(state.accessKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The visible, selectable code remains available on browsers without clipboard access.
      setCopied(false);
    }
  };

  return <main className="min-h-screen bg-[#06070a] text-white flex items-center justify-center p-5">
    <section className="w-full max-w-xl bg-[#12151c] border border-gray-800 rounded-2xl p-7 sm:p-10 space-y-5 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-[#ff004f]">SQUID PROTOCOL · ROUND 3</p>
      {state.loading ? <div role="status" className="space-y-3"><LoaderCircle className="w-8 h-8 animate-spin text-cyan-300 mx-auto" /><h1 className="text-xl font-bold">CHECKING QR CODE</h1><p className="text-sm text-gray-400">Keep this page open while the code is checked.</p></div> : state.error ? <div role="alert" className="space-y-3"><ShieldAlert className="w-9 h-9 text-red-400 mx-auto" /><h1 className="text-xl font-bold">QR NOT VERIFIED</h1><p className="text-sm text-gray-300">{state.error}</p></div> : <div role="status" className="space-y-4"><CheckCircle2 className="w-9 h-9 text-[#00e676] mx-auto" /><h1 className="text-2xl font-black">YOUR TEAM PIN</h1>{state.teamCode && <p className="font-mono text-cyan-300">{state.teamCode}</p>}<div className="p-4 rounded-xl bg-black/50 border border-cyan-400/40"><p className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono mb-2">Enter this PIN on your team laptop</p><code className="block break-all text-lg sm:text-xl text-white font-mono select-all">{state.accessKey}</code></div><button type="button" onClick={() => void copyCode()} className="w-full px-4 py-3 rounded-lg bg-[#ff004f] hover:bg-[#ff2e7e] text-white text-sm font-mono font-bold">{copied ? 'PIN COPIED' : 'COPY PIN'}</button><p className="text-xs text-gray-400">Open Round 3 on your laptop and enter this in the Team account PIN box.</p></div>}
    </section>
  </main>;
};
