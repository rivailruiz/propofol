import { useState } from 'react';
import { Delete, X } from 'lucide-react';
import { usePumpStore } from '../store/pumpStore';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

export function NumericKeypad() {
  const isOpen = usePumpStore((s) => s.isKeypadOpen);
  const target = usePumpStore((s) => s.target);
  const config = usePumpStore((s) => s.config);
  const setTarget = usePumpStore((s) => s.setTarget);
  const toggleKeypad = usePumpStore((s) => s.toggleKeypad);
  const [draft, setDraft] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayValue = draft ?? target.toFixed(1);
  const numericValue = parseFloat(displayValue);
  const isValid =
    !Number.isNaN(numericValue) &&
    numericValue >= config.targetMin &&
    numericValue <= config.targetMax;

  function handleKey(key: string) {
    setDraft((prev) => {
      const current = prev ?? '';
      if (key === 'del') return current.slice(0, -1);
      if (key === '.' && current.includes('.')) return current;
      if (current.length >= 5) return current;
      return current + key;
    });
  }

  function handleConfirm() {
    if (isValid) {
      setTarget(numericValue);
      setDraft(null);
      toggleKeypad(false);
    }
  }

  function handleClose() {
    setDraft(null);
    toggleKeypad(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-xs flex-col gap-2 rounded-xl border border-chassis-600 bg-chassis-800 p-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-gray-300">
            AJUSTAR ALVO (Cpt)
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar teclado"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-chassis-700"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={`tabular rounded-lg border px-3 py-2 text-center text-3xl font-bold ${
            isValid
              ? 'border-chassis-500 bg-chassis-900 text-white'
              : 'border-status-alarm/60 bg-status-alarm/10 text-status-alarm'
          }`}
        >
          {displayValue || '0'} <span className="text-sm font-medium text-gray-400">µg/mL</span>
        </div>
        <p className="text-center text-[11px] text-gray-500">
          Limite: {config.targetMin.toFixed(1)}–{config.targetMax.toFixed(1)} µg/mL
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="flex h-12 items-center justify-center rounded-md border border-chassis-500 bg-chassis-700 text-lg font-semibold text-gray-100 active:bg-chassis-600"
            >
              {key === 'del' ? <Delete size={18} /> : key}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          className="mt-1 flex h-12 items-center justify-center rounded-md bg-status-normal-dim text-base font-bold text-white active:brightness-90 disabled:opacity-30"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
