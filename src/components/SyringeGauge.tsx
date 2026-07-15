export function SyringeGauge({ remaining, max }: { remaining: number; max: number }) {
  const percent = max > 0 ? clamp01((remaining / max) * 100) : 0;
  const isCritical = percent <= 5;
  const isLow = percent <= 20;

  const barColor = isCritical
    ? 'bg-status-alarm'
    : isLow
      ? 'bg-status-attention'
      : 'bg-status-normal';

  return (
    <div className="flex min-w-0 flex-col gap-0.5" aria-label={`Seringa com ${remaining.toFixed(1)} de ${max} mililitros restantes`}>
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>Seringa</span>
        <span className="tabular font-semibold text-gray-200">
          {remaining.toFixed(1)}/{max} mL
        </span>
      </div>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-chassis-700 sm:w-28">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function clamp01(v: number): number {
  return Math.min(100, Math.max(0, v));
}
