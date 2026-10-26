import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../services/api';
import { CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react';

export const PhysicalQrRedeemPage: React.FC = () => {
  const started = useRef(false);
  const [state, setState] = useState<{ loading: boolean; teamCode?: string; accessKey?: string; error?: string }>({ loading: true });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = new URLSearchParams(window.location.hash.slice(1)).get('code');
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    if (!code) {
      setState({ loading: false, error: 'QR code is missing or invalid. Scan the event QR again.' });
      return;
    }
    apiRequest('/round3/qr/mobile-redeem', { method: 'POST', body: JSON.stringify({ code }) })
      .then(result => setState({ loading: false, teamCode: result.teamCode, accessKey: result.accessKey }))
      .catch((error: any) => setState({ loading: false, error: error?.status === 403
        ? 'Sign in with your team account on this phone, then scan the event QR again.'
        : 'This QR code could not be verified for this team. It may be invalid or already used.' }));
  }, []);

  return <main className="min-h-screen bg-[#06070a] text-white flex items-center justify-center p-5">
    <section className="w-full max-w-xl bg-[#12151c] border border-gray-800 rounded-2xl p-7 sm:p-10 space-y-5 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-[#ff004f]">SQUID PROTOCOL · ROUND 3</p>
      {state.loading ? <div role="status" className="space-y-3"><LoaderCircle className="w-8 h-8 animate-spin text-cyan-300 mx-auto" /><h1 className="text-xl font-bold">VERIFYING PHYSICAL QR</h1><p className="text-sm text-gray-400">Keep this page open while the code is checked.</p></div> : state.error ? <div role="alert" className="space-y-3"><ShieldAlert className="w-9 h-9 text-red-400 mx-auto" /><h1 className="text-xl font-bold">QR NOT VERIFIED</h1><p className="text-sm text-gray-300">{state.error}</p>{state.error.startsWith('Sign in') && <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-[#ff004f] text-white text-xs font-mono">TEAM SIGN IN</a>}</div> : <div role="status" className="space-y-4"><CheckCircle2 className="w-9 h-9 text-[#00e676] mx-auto" /><h1 className="text-2xl font-black">TEAM VERIFIED</h1>{state.teamCode && <p className="font-mono text-cyan-300">{state.teamCode}</p>}<div className="p-4 rounded-xl bg-black/50 border border-cyan-400/40"><p className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono mb-2">Round 3 access key</p><code className="block break-all text-base sm:text-lg text-white font-mono select-all">{state.accessKey}</code></div><p className="text-sm text-gray-300">Copy this key to your team laptop and enter it on the Round 3 screen. Keep this page open until the key is entered.</p><button type="button" onClick={() => state.accessKey && void navigator.clipboard?.writeText(state.accessKey)} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-mono">COPY ACCESS KEY</button></div>}
    </section>
  </main>;
};
