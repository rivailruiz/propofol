type CardColor = 'cpt' | 'cp' | 'ce';

const COLOR_CLASSES: Record<CardColor, { badge: string; text: string }> = {
  cpt: { badge: 'bg-status-normal/15 text-status-normal', text: 'text-status-normal' },
  cp: { badge: 'bg-status-info/15 text-status-info', text: 'text-status-info' },
  ce: { badge: 'bg-ce/15 text-ce', text: 'text-ce' },
};

export function ConcentrationCard({
  label,
  sublabel,
  value,
  color,
  compact = false,
}: {
  label: string;
  sublabel: string;
  value: number;
  color: CardColor;
  compact?: boolean;
}) {
  const classes = COLOR_CLASSES[color];
  return (
    <div className="flex flex-col rounded-lg border border-chassis-600 bg-chassis-800 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${classes.badge}`}>
          {label}
        </span>
        <span className="truncate text-[10px] text-gray-400">{sublabel}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`tabular font-bold leading-tight text-white ${compact ? 'text-2xl' : 'text-3xl'}`}
        >
          {value.toFixed(1)}
        </span>
        <span className="text-[10px] font-medium text-gray-400">µg/mL</span>
      </div>
    </div>
  );
}
