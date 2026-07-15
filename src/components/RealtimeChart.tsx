import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePumpStore, HISTORY_WINDOW_SECONDS } from '../store/pumpStore';

const SERIES = [
  { key: 'cpt', label: 'Cpt (alvo)', color: 'var(--color-cpt)' },
  { key: 'cp', label: 'Cp (plasma)', color: 'var(--color-cp)' },
  { key: 'ce', label: 'Ce (efeito)', color: 'var(--color-ce)' },
] as const;

function formatRelativeTick(t: number, latest: number): string {
  const diff = latest - t;
  if (diff <= 0) return 'agora';
  const m = Math.floor(diff / 60);
  const s = Math.floor(diff % 60);
  return `-${m}:${String(s).padStart(2, '0')}`;
}

function CustomTooltip({
  active,
  payload,
  latest,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  latest: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const t = (payload[0] as unknown as { payload: { t: number } }).payload.t;
  return (
    <div className="rounded-md border border-chassis-500 bg-chassis-900/95 px-2.5 py-1.5 text-[11px] shadow-lg">
      <div className="mb-1 text-gray-400">{formatRelativeTick(t, latest)}</div>
      {SERIES.map((s) => {
        const item = payload.find((p) => p.dataKey === s.key);
        if (!item) return null;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="text-gray-300">{s.label}:</span>
            <span className="tabular font-semibold text-white">{item.value.toFixed(2)} µg/mL</span>
          </div>
        );
      })}
    </div>
  );
}

export function RealtimeChart() {
  const history = usePumpStore((s) => s.history);
  const target = usePumpStore((s) => s.target);
  const config = usePumpStore((s) => s.config);

  const latest = history.length ? history[history.length - 1].t : 0;
  // Antes de iniciar (latest = 0) mostramos uma janela vazia de 5 min como referência visual.
  const windowEnd = latest > 0 ? latest : HISTORY_WINDOW_SECONDS;
  const domainStart = Math.max(0, windowEnd - HISTORY_WINDOW_SECONDS);

  const ticks = useMemo(() => {
    const step = HISTORY_WINDOW_SECONDS / 5;
    return Array.from({ length: 6 }, (_, i) => domainStart + i * step);
  }, [domainStart]);

  const yMax = useMemo(() => {
    const maxHistory = history.reduce((m, p) => Math.max(m, p.cp, p.ce, p.cpt), 0);
    return Math.max(config.targetMax, maxHistory * 1.15, 1);
  }, [history, config.targetMax]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1 pb-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[10px] font-medium text-gray-400">{s.label}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-gray-500">últimos 5 min</span>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history}
            margin={{ top: 4, right: 10, bottom: 0, left: -18 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="var(--color-chassis-700)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[domainStart, windowEnd]}
              ticks={ticks}
              tickFormatter={(t) => formatRelativeTick(t, windowEnd)}
              stroke="var(--color-chassis-500)"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-chassis-600)' }}
            />
            <YAxis
              domain={[0, yMax]}
              stroke="var(--color-chassis-500)"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={34}
              label={{
                value: 'µg/mL',
                angle: -90,
                position: 'insideLeft',
                fill: '#6b7280',
                fontSize: 10,
                offset: 10,
              }}
            />
            <Tooltip content={<CustomTooltip latest={windowEnd} />} />
            <Line
              dataKey="cpt"
              stroke="var(--color-cpt)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="cp"
              stroke="var(--color-cp)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="ce"
              stroke="var(--color-ce)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="sr-only" aria-live="polite">
        Alvo atual {target.toFixed(1)} microgramas por mililitro
      </span>
    </div>
  );
}
