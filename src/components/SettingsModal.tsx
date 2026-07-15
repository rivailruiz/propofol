import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePumpStore } from '../store/pumpStore';

export function SettingsModal() {
  const isOpen = usePumpStore((s) => s.isSettingsOpen);
  const config = usePumpStore((s) => s.config);
  const status = usePumpStore((s) => s.status);
  const setConfig = usePumpStore((s) => s.setConfig);
  const toggleSettings = usePumpStore((s) => s.toggleSettings);

  const [draft, setDraft] = useState(config);

  useEffect(() => {
    if (isOpen) setDraft(config);
  }, [isOpen, config]);

  if (!isOpen) return null;

  const locked = status !== 'stopped';

  function handleSave() {
    setConfig({
      targetMin: clampNumber(draft.targetMin, 0, 20),
      targetMax: clampNumber(draft.targetMax, draft.targetMin + 0.1, 20),
      targetStep: clampNumber(draft.targetStep, 0.1, 2),
      syringeVolumeMax: clampNumber(draft.syringeVolumeMax, 10, 100),
      drugConcentrationMgMl: clampNumber(draft.drugConcentrationMgMl, 1, 20),
    });
    toggleSettings(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90%] w-full max-w-sm flex-col gap-3 overflow-hidden rounded-xl border border-chassis-600 bg-chassis-800 p-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-gray-300">CONFIGURAÇÕES</span>
          <button
            type="button"
            onClick={() => toggleSettings(false)}
            aria-label="Fechar configurações"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-chassis-700"
          >
            <X size={16} />
          </button>
        </div>

        {locked && (
          <p className="rounded-md border border-status-attention/40 bg-status-attention/10 px-2.5 py-1.5 text-[11px] text-status-attention">
            Encerre a infusão para alterar as configurações.
          </p>
        )}

        <div className="flex flex-col gap-2.5 overflow-y-auto">
          <Field
            label="Alvo mínimo (µg/mL)"
            value={draft.targetMin}
            step={0.1}
            disabled={locked}
            onChange={(v) => setDraft((d) => ({ ...d, targetMin: v }))}
          />
          <Field
            label="Alvo máximo (µg/mL)"
            value={draft.targetMax}
            step={0.1}
            disabled={locked}
            onChange={(v) => setDraft((d) => ({ ...d, targetMax: v }))}
          />
          <Field
            label="Incremento do alvo (µg/mL)"
            value={draft.targetStep}
            step={0.1}
            disabled={locked}
            onChange={(v) => setDraft((d) => ({ ...d, targetStep: v }))}
          />
          <Field
            label="Volume da seringa (mL)"
            value={draft.syringeVolumeMax}
            step={5}
            disabled={locked}
            onChange={(v) => setDraft((d) => ({ ...d, syringeVolumeMax: v }))}
          />
          <Field
            label="Concentração do fármaco (mg/mL)"
            value={draft.drugConcentrationMgMl}
            step={1}
            disabled={locked}
            onChange={(v) => setDraft((d) => ({ ...d, drugConcentrationMgMl: v }))}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={locked}
          className="h-11 rounded-md bg-status-info text-sm font-bold text-chassis-950 disabled:opacity-30"
        >
          Salvar
        </button>

        <p className="text-center text-[10px] leading-snug text-gray-500">
          SIMULADOR EDUCACIONAL — não representa um dispositivo médico real e não deve ser
          utilizado para decisões clínicas.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-gray-300">
      <span className="min-w-0 flex-1">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="tabular w-20 shrink-0 rounded-md border border-chassis-500 bg-chassis-900 px-2 py-1.5 text-right text-white disabled:opacity-40"
      />
    </label>
  );
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
