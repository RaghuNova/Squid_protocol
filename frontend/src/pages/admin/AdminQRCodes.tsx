import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { QrCode, Printer, RefreshCw } from 'lucide-react';

interface QRItem {
  teamId: string;
  teamCode: string;
  teamName: string;
  isRedeemed: boolean;
  qrDataUrl: string;
}

export const AdminQRCodes: React.FC = () => {
  const [qrList, setQrList] = useState<QRItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchQRs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiRequest<{ success: boolean; qrCodes: QRItem[] }>('/admin/qr-codes');
      setQrList(res.qrCodes || []);
    } catch (err) {
      console.error('Failed to load team QR codes', err);
      setLoadError(err instanceof Error ? err.message : 'QR codes could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchQRs(); }, [fetchQRs]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="font-mono text-sm text-gray-400">GENERATING HIGH-RESOLUTION SQUAD QR MATRICES...</div>;
  }

  if (loadError) {
    return <div className="max-w-2xl rounded-2xl border border-red-800 bg-red-950/30 p-6 space-y-4">
      <h1 className="font-display font-bold text-xl text-white">Team QR codes could not be loaded</h1>
      <p role="alert" className="font-mono text-sm text-red-300">{loadError}</p>
      <button type="button" onClick={() => void fetchQRs()} className="inline-flex items-center gap-2 rounded-lg bg-[#ff004f] px-4 py-2 text-xs font-mono font-bold text-white">
        <RefreshCw className="h-4 w-4" /> RETRY
      </button>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5 print:hidden">
        <div>
          <span className="font-mono text-xs text-[#ff004f] uppercase tracking-widest flex items-center gap-1.5">
            <QrCode className="w-4 h-4" />
            ROUND 3 MATRIX TOKENS
          </span>
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight mt-1">
            Printable Squad QR Codes
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Scan a card with a phone camera, copy the plain-text code shown by the scanner, then paste it into Round 3 on that team’s laptop.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-[#ff004f] hover:bg-[#ff2e7e] text-white font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,79,0.4)] transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT SQUAD QR SHEETS</span>
        </button>
      </div>

      {/* Grid of QR Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
        {qrList.map((item) => (
          <div
            key={item.teamId}
            className="p-6 rounded-2xl bg-[#12151c] border-2 border-gray-800 flex flex-col items-center justify-between text-center space-y-4 shadow-xl print:bg-white print:text-black print:border-black print:rounded-none"
          >
            <div className="space-y-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#ff004f]/20 text-[#ff004f] font-bold border border-[#ff004f]/30 print:border-black print:text-black">
                {item.teamCode}
              </span>
              <h3 className="font-display font-black text-lg text-white print:text-black">
                {item.teamName}
              </h3>
            </div>

            {/* QR Image with Cut Guides */}
            <div className="relative p-3 bg-white rounded-xl border border-gray-300 shadow-inner">
              <img
                src={item.qrDataUrl}
                alt={`${item.teamCode} QR Code`}
                className="w-44 h-44 object-contain"
              />
              {/* Subtle crosshair cutting guideline */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-[1px] bg-red-400/40 border-dashed border-b border-red-500/60" />
              </div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="h-full w-[1px] bg-red-400/40 border-dashed border-r border-red-500/60" />
              </div>
            </div>

            <div className="space-y-1 w-full pt-2 border-t border-gray-800 print:border-black">
              <span className="font-mono text-[10px] text-gray-400 print:text-gray-700 uppercase block">Single-use physical QR</span>
              <span className="font-mono text-xs text-cyan-300 print:text-black">Scan to verify team access</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
