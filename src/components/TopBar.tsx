import { Settings, Syringe } from 'lucide-react';
import { usePumpStore } from '../store/pumpStore';
import { BatteryIndicator } from './BatteryIndicator';
import { SimClock } from './SimClock';
import { StatusBadge } from './StatusBadge';

export function TopBar() {
  const config = usePumpStore((s) => s.config);
  const batteryPercent = usePumpStore((s) => s.batteryPercent);
  const toggleSettings = usePumpStore((s) => s.toggleSettings);

  const percentConcentration = (config.drugConcentrationMgMl / 10).toFixed(1);

  return (
    <header className="safe-top flex h-11 shrink-0 items-center justify-between border-b border-chassis-700 bg-chassis-900 px-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Syringe size={18} className="shrink-0 text-status-info" strokeWidth={2} />
        <span className="truncate text-[13px] font-semibold tracking-wide text-gray-200">
          TCI SIM
        </span>
        <span className="h-4 w-px bg-chassis-600" />
        <span className="truncate text-[13px] font-medium text-gray-100">{config.drugName}</span>
        <span className="rounded bg-chassis-700 px-1.5 py-0.5 text-[11px] font-semibold tabular text-status-info">
          {percentConcentration}%
        </span>
        <span className="hidden text-[11px] text-gray-400 sm:inline">
          {config.drugConcentrationMgMl} mg/mL
        </span>
        <span className="hidden rounded border border-chassis-600 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gray-400 md:inline">
          {config.pkModel === 'marsh' ? 'MARSH' : 'SCHNIDER'}
        </span>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <StatusBadge />
        <span className="rounded border border-status-alarm/50 bg-status-alarm/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-status-alarm">
          SIMULADOR
        </span>
        <BatteryIndicator percent={batteryPercent} />
        <SimClock />
        <button
          type="button"
          onClick={() => toggleSettings(true)}
          aria-label="Configurações"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-chassis-700 hover:text-white active:bg-chassis-600"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
