import { Play, Pause, Square, Bell } from 'lucide-react';
import { usePumpStore } from '../store/pumpStore';
import { StatBlock } from './StatBlock';
import { SyringeGauge } from './SyringeGauge';
import { formatElapsed, formatFlowRate, formatVolume } from '../lib/format';
import { ALARM_DEFINITIONS } from '../lib/alarms';

export function BottomBar() {
  const status = usePumpStore((s) => s.status);
  const flowRateMlH = usePumpStore((s) => s.flowRateMlH);
  const infusedVolumeMl = usePumpStore((s) => s.infusedVolumeMl);
  const elapsedSeconds = usePumpStore((s) => s.elapsedSeconds);
  const syringeRemainingMl = usePumpStore((s) => s.syringeRemainingMl);
  const config = usePumpStore((s) => s.config);
  const alarms = usePumpStore((s) => s.alarms);
  const start = usePumpStore((s) => s.start);
  const pause = usePumpStore((s) => s.pause);
  const resume = usePumpStore((s) => s.resume);
  const stop = usePumpStore((s) => s.stop);
  const toggleAlarmPanel = usePumpStore((s) => s.toggleAlarmPanel);

  const hasCritical = alarms.some((a) => ALARM_DEFINITIONS[a.type].severity === 'critical');
  const hasWarning = alarms.some((a) => ALARM_DEFINITIONS[a.type].severity === 'warning');

  const mainButton = getMainButtonConfig(status, hasCritical);

  function handleMainAction() {
    if (status === 'stopped') start();
    else if (status === 'running') pause();
    else if (status === 'paused') resume();
  }

  return (
    <footer className="safe-bottom flex h-16 shrink-0 items-center gap-2 border-t border-chassis-700 bg-chassis-900 px-2 sm:h-[68px] sm:gap-3 sm:px-3">
      <div className="flex items-center gap-2 sm:gap-4">
        <StatBlock label="Vazão" value={formatFlowRate(flowRateMlH)} unit="mL/h" />
        <StatBlock label="Volume" value={formatVolume(infusedVolumeMl)} unit="mL" />
        <StatBlock label="Tempo" value={formatElapsed(elapsedSeconds)} unit="" />
      </div>

      <div className="hidden md:block">
        <SyringeGauge remaining={syringeRemainingMl} max={config.syringeVolumeMax} />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => toggleAlarmPanel(true)}
          aria-label={`Alarmes${alarms.length ? `: ${alarms.length} ativos` : ''}`}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors ${
            hasCritical
              ? 'border-status-alarm bg-status-alarm/20 text-status-alarm animate-pulse'
              : hasWarning
                ? 'border-status-attention bg-status-attention/15 text-status-attention'
                : 'border-chassis-500 bg-chassis-700 text-gray-300'
          }`}
        >
          <Bell size={20} />
          {alarms.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-alarm px-1 text-[10px] font-bold text-white">
              {alarms.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={stop}
          disabled={status === 'stopped'}
          aria-label="Encerrar infusão"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-chassis-500 bg-chassis-700 px-2.5 text-sm font-semibold text-gray-200 disabled:opacity-30 sm:px-3"
        >
          <Square size={16} />
          <span className="hidden md:inline">Encerrar</span>
        </button>

        <button
          type="button"
          onClick={handleMainAction}
          disabled={mainButton.disabled}
          aria-label={mainButton.label}
          className={`flex h-11 min-w-[92px] shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold text-white transition-colors disabled:opacity-30 sm:min-w-[120px] sm:px-4 ${mainButton.colorClass}`}
        >
          <mainButton.Icon size={18} />
          {mainButton.label}
        </button>
      </div>
    </footer>
  );
}

function getMainButtonConfig(status: 'stopped' | 'running' | 'paused', hasCritical: boolean) {
  if (status === 'running') {
    return { label: 'Pausar', Icon: Pause, colorClass: 'bg-status-attention text-chassis-950', disabled: false };
  }
  if (status === 'paused') {
    return { label: 'Retomar', Icon: Play, colorClass: 'bg-status-normal-dim', disabled: hasCritical };
  }
  return { label: 'Iniciar', Icon: Play, colorClass: 'bg-status-normal-dim', disabled: hasCritical };
}
