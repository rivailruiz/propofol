import { CircleDot, Pause, Square } from 'lucide-react';
import { usePumpStore } from '../store/pumpStore';

const STATUS_CONFIG = {
  stopped: { label: 'PARADO', Icon: Square, className: 'bg-status-idle/20 text-gray-300' },
  running: { label: 'INFUNDINDO', Icon: CircleDot, className: 'bg-status-normal/15 text-status-normal' },
  paused: { label: 'PAUSADO', Icon: Pause, className: 'bg-status-attention/15 text-status-attention' },
} as const;

export function StatusBadge() {
  const status = usePumpStore((s) => s.status);
  const { label, Icon, className } = STATUS_CONFIG[status];

  return (
    <div
      role="status"
      className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-bold tracking-wide ${className}`}
    >
      <Icon size={12} className={status === 'running' ? 'animate-pulse' : ''} />
      {label}
    </div>
  );
}
