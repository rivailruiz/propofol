import { usePumpStore } from '../store/pumpStore';
import { ConcentrationCard } from './ConcentrationCard';
import { TargetButton } from './TargetButton';

export function LeftPanel() {
  const target = usePumpStore((s) => s.target);
  const pk = usePumpStore((s) => s.pk);
  const config = usePumpStore((s) => s.config);
  const incrementTarget = usePumpStore((s) => s.incrementTarget);
  const decrementTarget = usePumpStore((s) => s.decrementTarget);
  const toggleKeypad = usePumpStore((s) => s.toggleKeypad);

  return (
    <section
      aria-label="Concentrações e alvo"
      className="flex h-full min-w-0 flex-col gap-1.5 border-r border-chassis-700 bg-chassis-900 p-1.5"
    >
      <div className="grid grid-cols-2 gap-1.5">
        <ConcentrationCard label="Cp" sublabel="plasmática" value={pk.cp} color="cp" compact />
        <ConcentrationCard label="Ce" sublabel="efeito" value={pk.ce} color="ce" compact />
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-status-normal/40 bg-chassis-800 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-status-normal/15 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-status-normal">
            Cpt
          </span>
          <span className="truncate text-[11px] text-gray-400">Alvo plasmático</span>
        </div>

        <button
          type="button"
          onClick={() => toggleKeypad(true)}
          aria-label={`Alvo atual ${target.toFixed(1)} microgramas por mililitro. Toque para editar.`}
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md active:bg-chassis-700/50"
        >
          <span className="tabular text-6xl font-bold leading-none text-white">
            {target.toFixed(1)}
          </span>
          <span className="text-xs font-medium text-gray-400">µg/mL</span>
        </button>

        <div className="flex items-center gap-2 pt-1">
          <TargetButton direction="decrease" onClick={decrementTarget} />
          <span className="w-16 shrink-0 text-center text-[10px] leading-tight text-gray-500">
            passo {config.targetStep.toFixed(1)}
            <br />
            {config.targetMin.toFixed(1)}–{config.targetMax.toFixed(1)}
          </span>
          <TargetButton direction="increase" onClick={incrementTarget} />
        </div>
      </div>
    </section>
  );
}
