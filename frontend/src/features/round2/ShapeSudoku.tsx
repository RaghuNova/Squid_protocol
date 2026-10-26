import React, { useState, useEffect, useCallback } from 'react';
import { SudokuData } from '../../types/game';
import { SymbolMap } from '../../components/GeometricShapes';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';

interface ShapeSudokuProps {
  data: SudokuData;
  onSuccess: () => void;
}

const SYMBOL_KEYS = ['S', 'T', 'C', 'U', 'A', 'D'];

export const ShapeSudoku: React.FC<ShapeSudokuProps> = ({ data, onSuccess }) => {
  const { refreshMe } = useAuth();
  const { playSuccess, playError } = useSound();

  const [grid, setGrid] = useState<string[]>([]);
  const [fixedCells, setFixedCells] = useState<boolean[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize and load saved local progress
  useEffect(() => {
    if (!data.initialGrid) return;

    const initialChars = data.initialGrid.split('');
    const fixed = initialChars.map(c => c !== '0');
    setFixedCells(fixed);

    const saved = localStorage.getItem(`squid_sudoku_${data.id}`);
    if (saved && saved.length === 36) {
      setGrid(saved.split(''));
    } else {
      setGrid(initialChars);
    }
  }, [data.id, data.initialGrid]);

  // Persist grid changes locally
  const updateGrid = useCallback((newGrid: string[]) => {
    setGrid(newGrid);
    localStorage.setItem(`squid_sudoku_${data.id}`, newGrid.join(''));
  }, [data.id]);

  // Select a symbol for the active cell
  const handleSetSymbol = useCallback((symbol: string) => {
    if (selectedCell === null || fixedCells[selectedCell] || data.isCompleted) return;

    const updated = [...grid];
    updated[selectedCell] = symbol;
    updateGrid(updated);
    setErrorMessage(null);
  }, [selectedCell, fixedCells, data.isCompleted, grid, updateGrid]);

  // Clear active cell
  const handleClearCell = useCallback(() => {
    if (selectedCell === null || fixedCells[selectedCell] || data.isCompleted) return;

    const updated = [...grid];
    updated[selectedCell] = '0';
    updateGrid(updated);
  }, [selectedCell, fixedCells, data.isCompleted, grid, updateGrid]);

  // Reset grid to initial state
  const handleResetToInitial = () => {
    if (data.isCompleted) return;
    const initial = data.initialGrid.split('');
    updateGrid(initial);
    setErrorMessage(null);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell === null || fixedCells[selectedCell] || data.isCompleted) return;

      const key = e.key.toUpperCase();
      if (SYMBOL_KEYS.includes(key)) {
        handleSetSymbol(key);
      } else if (key === 'BACKSPACE' || key === 'DELETE' || key === '0') {
        handleClearCell();
      } else if (key === 'ARROWUP' && selectedCell >= 6) {
        setSelectedCell(selectedCell - 6);
      } else if (key === 'ARROWDOWN' && selectedCell < 30) {
        setSelectedCell(selectedCell + 6);
      } else if (key === 'ARROWLEFT' && selectedCell % 6 !== 0) {
        setSelectedCell(selectedCell - 1);
      } else if (key === 'ARROWRIGHT' && selectedCell % 6 !== 5) {
        setSelectedCell(selectedCell + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, fixedCells, data.isCompleted, handleSetSymbol, handleClearCell]);

  const isFilled = grid.length === 36 && !grid.includes('0');

  const handleSubmit = async () => {
    if (!isFilled || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiRequest('/round2/sudoku/submit', {
        method: 'POST',
        body: JSON.stringify({
          submittedGrid: grid.join(''),
        })
      });

      playSuccess();
      await refreshMe();
      onSuccess();
    } catch (err: any) {
      playError();
      setErrorMessage('Incorrect solution. Review the grid and try again while time remains.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#12151c] rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-6">
      {/* Title & Stage Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="font-mono text-xs text-[#00f0ff] uppercase tracking-wider">
            ROUND 2 — STAGE 1
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
            6×6 Shape Sudoku
          </h3>
        </div>

        {data.isCompleted ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>SOLVED & VERIFIED (+100 PTS)</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetToInitial}
              aria-label="Reset puzzle to starting state"
              title="Reset to puzzle starting state"
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-300 leading-relaxed font-mono">
        Fill the 6×6 grid using the 6 geometric symbols. Every <strong>row</strong>, <strong>column</strong>, and <strong>2×3 block</strong> must contain each symbol exactly once.
      </p>

      {/* Sudoku Grid & Controls Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* The 6x6 Sudoku Grid */}
        <div className="lg:col-span-8 flex justify-center">
          <div
            role="grid"
            aria-label="6 by 6 Shape Sudoku Grid"
            className="grid grid-cols-6 gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl bg-[#090b0f] border-2 border-gray-700 shadow-2xl"
          >
            {grid.map((cellVal, idx) => {
              const isFixed = fixedCells[idx];
              const isSelected = selectedCell === idx;
              const symbolObj = cellVal !== '0' ? SymbolMap[cellVal] : null;
              const Icon = symbolObj ? symbolObj.component : null;

              // 2x3 block border styling:
              const r = Math.floor(idx / 6);
              const c = idx % 6;
              const isBottomBlockEdge = r === 1 || r === 3;
              const isRightBlockEdge = c === 2;

              const cellLabel = `Cell Row ${r + 1}, Column ${c + 1}: ${
                symbolObj ? symbolObj.label : 'Empty'
              }${isFixed ? ', fixed starting clue' : ''}${isSelected ? ', selected' : ''}`;

              return (
                <button
                  key={idx}
                  type="button"
                  role="gridcell"
                  aria-label={cellLabel}
                  aria-selected={isSelected}
                  disabled={data.isCompleted}
                  onClick={() => setSelectedCell(idx)}
                  className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090b0f] ${
                    isSelected
                      ? 'ring-2 ring-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : isFixed
                      ? 'bg-[#181c26] border border-gray-700/60 opacity-90'
                      : 'bg-[#12151c] border border-gray-800/80 hover:border-gray-600 hover:bg-[#1a202c]'
                  } ${isBottomBlockEdge ? 'mb-1 sm:mb-2' : ''} ${isRightBlockEdge ? 'mr-1 sm:mr-2' : ''}`}
                >
                  {Icon && (
                    <Icon
                      size={28}
                      color={isFixed ? '#e2e8f0' : symbolObj?.color}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Symbol Palette & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl bg-[#090b0f] border border-gray-800 space-y-4">
            <h4 className="font-mono text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Symbol Selector
            </h4>

            <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Available geometric symbols">
              {SYMBOL_KEYS.map((symKey) => {
                const sObj = SymbolMap[symKey];
                const Icon = sObj.component;

                return (
                  <button
                    key={symKey}
                    type="button"
                    aria-label={`Insert ${sObj.label} symbol into selected cell`}
                    disabled={data.isCompleted || selectedCell === null || fixedCells[selectedCell]}
                    onClick={() => handleSetSymbol(symKey)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#12151c] border border-gray-800 hover:border-[#ff004f]/60 hover:bg-[#181c26] transition-all disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090b0f]"
                  >
                    <Icon size={26} color={sObj.color} />
                    <span className="font-mono text-[10px] text-gray-400 group-hover:text-white uppercase font-bold">
                      {sObj.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                aria-label="Clear contents of selected cell"
                disabled={data.isCompleted || selectedCell === null || fixedCells[selectedCell]}
                onClick={handleClearCell}
                className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 cursor-pointer"
              >
                Clear Cell (Del / Backspace)
              </button>
            </div>
          </div>

          {/* Submission Feedback */}
          {errorMessage && (
            <div role="alert" className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 text-xs font-mono">
              {errorMessage}
            </div>
          )}

          {/* Submit Grid */}
          {!data.isCompleted && (
            <button
              type="button"
              disabled={!isFilled || isSubmitting}
              onClick={handleSubmit}
              className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c] ${
                !isFilled
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-[#ff004f] text-white hover:bg-[#ff2e7e] shadow-[0_0_20px_rgba(255,0,79,0.4)] cursor-pointer focus-visible:ring-[#ff004f]'
              }`}
            >
              {isSubmitting ? (
                'CHECKING WITH CENTRAL DAEMON...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>TRANSMIT SUDOKU SOLUTION</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
