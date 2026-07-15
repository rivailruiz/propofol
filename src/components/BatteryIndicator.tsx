import { BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Plug } from 'lucide-react';

export function BatteryIndicator({ percent }: { percent: number }) {
  const level = Math.round(percent);
  const isCritical = level < 15;
  const isLow = level < 30;

  const Icon = isCritical ? BatteryWarning : isLow ? BatteryLow : level < 70 ? BatteryMedium : BatteryFull;
  const colorClass = isCritical
    ? 'text-status-alarm'
    : isLow
      ? 'text-status-attention'
      : 'text-status-normal';

  return (
    <div className={`flex items-center gap-1.5 ${colorClass}`} role="status" aria-label={`Bateria em ${level} por cento`}>
      <Icon size={18} strokeWidth={2} />
      <span className="tabular text-xs font-semibold">{level}%</span>
      {isCritical && <Plug size={14} className="animate-pulse" />}
    </div>
  );
}
