import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Copy, Check, Terminal } from 'lucide-react';

export interface TerminalWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title = 'bash',
  code,
  language,
  showLineNumbers = false,
  children,
  className,
  ...props
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const lines = code ? code.trim().split('\n') : [];

  return (
    <div
      className={clsx(
        'rounded-2xl bg-[#090b10] border border-[#1e2432] shadow-elevated overflow-hidden font-mono text-xs',
        className
      )}
      {...props}
    >
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f1218] border-b border-[#1e2432] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-gray-600 font-mono text-xs" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[11px]">
            <Terminal className="w-3 h-3 text-[#00f0ff]" aria-hidden="true" />
            <span className="text-gray-300 font-medium">{title}</span>
            {language && (
              <span className="px-1.5 py-0.2 rounded bg-[#1e2432] text-[10px] text-gray-400 uppercase">
                {language}
              </span>
            )}
          </div>
        </div>

        {code && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-white hover:bg-[#1e2432] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] cursor-pointer"
            title="Copy code"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00e676]" aria-hidden="true" />
                <span className="text-[#00e676]">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>COPY</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Terminal Content */}
      <div className="p-4 overflow-x-auto text-gray-300 leading-relaxed font-mono selection:bg-[#ff004f]/30">
        {code ? (
          showLineNumbers ? (
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-[#141822]/40">
                  <span className="table-cell select-none pr-4 text-right text-gray-600 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </div>
          ) : (
            <pre className="whitespace-pre">{code}</pre>
          )
        ) : (
          children
        )}
      </div>
    </div>
  );
};
