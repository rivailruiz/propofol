import { X, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePumpStore } from '../store/pumpStore';
import { ALARM_DEFINITIONS, type AlarmType } from '../lib/alarms';

const DEMO_TYPES: AlarmType[] = ['occlusion', 'air_in_line', 'syringe_empty', 'low_battery'];

export function AlarmPanel() {
  const isOpen = usePumpStore((s) => s.isAlarmPanelOpen);
  const alarms = usePumpStore((s) => s.alarms);
  const toggleAlarmPanel = usePumpStore((s) => s.toggleAlarmPanel);
  const clearAlarm = usePumpStore((s) => s.clearAlarm);
  const clearAllAlarms = usePumpStore((s) => s.clearAllAlarms);
  const triggerAlarm = usePumpStore((s) => s.triggerAlarm);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90%] w-full max-w-sm flex-col gap-3 overflow-hidden rounded-xl border border-chassis-600 bg-chassis-800 p-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-gray-300">ALARMES</span>
          <button
            type="button"
            onClick={() => toggleAlarmPanel(false)}
            aria-label="Fechar alarmes"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-chassis-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          {alarms.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-chassis-600 bg-chassis-900 py-6 text-status-normal">
              <CheckCircle2 size={22} />
              <span className="text-xs font-medium">Nenhum alarme ativo</span>
            </div>
          ) : (
            alarms.map((alarm) => {
              const def = ALARM_DEFINITIONS[alarm.type];
              const isCritical = def.severity === 'critical';
              return (
                <div
                  key={alarm.id}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${
                    isCritical
                      ? 'border-status-alarm/50 bg-status-alarm/10'
                      : 'border-status-attention/50 bg-status-attention/10'
                  }`}
                >
                  {isCritical ? (
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-status-alarm" />
                  ) : (
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-attention" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        isCritical ? 'text-status-alarm' : 'text-status-attention'
                      }`}
                    >
                      {def.label}
                    </p>
                    <p className="text-[11px] text-gray-400">{def.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearAlarm(alarm.id)}
                    className="shrink-0 rounded border border-chassis-500 px-2 py-1 text-[11px] font-medium text-gray-300 active:bg-chassis-700"
                  >
                    Limpar
                  </button>
                </div>
              );
            })
          )}
        </div>

        {alarms.length > 0 && (
          <button
            type="button"
            onClick={clearAllAlarms}
            className="h-10 rounded-md border border-chassis-500 bg-chassis-700 text-sm font-semibold text-gray-200 active:bg-chassis-600"
          >
            Limpar todos
          </button>
        )}

        <div className="border-t border-chassis-600 pt-2.5">
          <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-gray-500">
            SIMULAR ALARME (demonstração)
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => triggerAlarm(type)}
                className="rounded-md border border-chassis-500 bg-chassis-900 px-2 py-1.5 text-[11px] font-medium text-gray-300 active:bg-chassis-700"
              >
                {ALARM_DEFINITIONS[type].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
