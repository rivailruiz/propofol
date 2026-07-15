import { Activity } from 'lucide-react';
import { RealtimeChart } from './RealtimeChart';

export function RightPanel() {
  return (
    <section
      aria-label="Gráfico de concentrações em tempo real"
      className="flex h-full min-w-0 flex-1 flex-col gap-1 bg-chassis-900 p-1.5"
    >
      <div className="flex items-center gap-1.5 px-1">
        <Activity size={13} className="text-status-info" />
        <span className="text-[11px] font-semibold tracking-wide text-gray-400">
          MONITOR DE CONCENTRAÇÃO
        </span>
      </div>
      <RealtimeChart />
    </section>
  );
}
